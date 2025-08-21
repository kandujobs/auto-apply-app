// checkpoint-portal.js
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { randomUUID } = require("crypto");

// Load Playwright conditionally to prevent startup failures
let chromium;
try {
  const playwright = require("playwright");
  chromium = playwright.chromium;
  console.log('✅ Playwright loaded successfully for checkpoint portal');
} catch (error) {
  console.warn('⚠️ Playwright not available for checkpoint portal:', error.message);
}

// Load http-proxy-middleware conditionally
let createProxyMiddleware;
try {
  const httpProxyMiddleware = require("http-proxy-middleware");
  createProxyMiddleware = httpProxyMiddleware.createProxyMiddleware;
  console.log('✅ http-proxy-middleware loaded successfully');
} catch (error) {
  console.warn('⚠️ http-proxy-middleware not available:', error.message);
}

const DISPLAY = ":99";
const VNC_PORT = parseInt(process.env.VNC_PORT || "5900", 10);
const NOVNC_PORT = parseInt(process.env.NOVNC_PORT || "6080", 10);
const DATA_ROOT = process.env.DATA_ROOT || "/data/profiles"; // mount a volume in Railway

// Create data directory safely
try {
  fs.mkdirSync(DATA_ROOT, { recursive: true });
  console.log(`✅ Data directory created/verified: ${DATA_ROOT}`);
} catch (error) {
  console.warn(`⚠️ Could not create data directory: ${error.message}`);
}

let stackStarted = false;
const sessions = new Map(); // token -> { browser, userId, expiresAt }

function startDisplayStackOnce() {
  if (stackStarted) return;
  
  // Check if required packages are available
  const requiredPackages = ['Xvfb', 'fluxbox', 'x11vnc', 'websockify'];
  const missingPackages = [];
  
  for (const pkg of requiredPackages) {
    try {
      require('child_process').execSync(`which ${pkg}`, { stdio: 'ignore' });
    } catch (error) {
      missingPackages.push(pkg);
    }
  }
  
  if (missingPackages.length > 0) {
    console.warn(`⚠️ Missing required packages: ${missingPackages.join(', ')}`);
    console.warn('⚠️ Checkpoint portal will use manual mode only');
    return;
  }
  
  stackStarted = true;
  const procs = [];
  const env = { ...process.env, DISPLAY };

  try {
    console.log('🖥️ Starting Xvfb...');
    const xvfb = spawn("Xvfb", [DISPLAY, "-screen", "0", "1920x1080x24"], { 
      stdio: "inherit",
      env 
    });
    procs.push(xvfb);

    // Wait a moment for Xvfb to start
    setTimeout(() => {
      console.log('🖥️ Starting fluxbox...');
      const flux = spawn("fluxbox", [], { 
        stdio: "inherit", 
        env 
      });
      procs.push(flux);

      setTimeout(() => {
        console.log('🖥️ Starting x11vnc...');
        const x11 = spawn("x11vnc", [
          "-display", DISPLAY, 
          "-nopw", 
          "-forever", 
          "-shared", 
          "-rfbport", String(VNC_PORT)
        ], { 
          stdio: "inherit",
          env 
        });
        procs.push(x11);

        setTimeout(() => {
          console.log('🖥️ Starting websockify...');
          const novnc = spawn("websockify", [
            "--web=/usr/share/novnc", 
            String(NOVNC_PORT), 
            `localhost:${VNC_PORT}`
          ], { 
            stdio: "inherit",
            env 
          });
          procs.push(novnc);
        }, 1000);
      }, 1000);
    }, 1000);

    console.log('✅ Display stack started successfully');
  } catch (error) {
    console.error('❌ Failed to start display stack:', error);
    stackStarted = false;
  }

  process.on("exit", () => procs.forEach(p => p.kill("SIGTERM")));
}

function profileDir(userId) {
  try {
    const dir = path.join(DATA_ROOT, String(userId));
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  } catch (error) {
    console.error('❌ Failed to create profile directory:', error);
    return path.join('/tmp', String(userId)); // fallback to /tmp
  }
}

// replace with your real auth guard
function requireAppAuth(req, res, next) {
  const userId = req.header("x-user-id");
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

function registerCheckpointPortal(app) {
  // Only register if dependencies are available
  if (!chromium) {
    console.warn('⚠️ Checkpoint portal not registered - Playwright not available');
    return;
  }

  if (!createProxyMiddleware) {
    console.warn('⚠️ Checkpoint portal not registered - http-proxy-middleware not available');
    return;
  }

  console.log('✅ Registering checkpoint portal routes');

  // proxy noVNC under the same origin/port
  app.use(
    "/_novnc",
    createProxyMiddleware({
      target: `http://127.0.0.1:${NOVNC_PORT}`,
      changeOrigin: true,
      ws: true,
    })
  );

  // start a portal (called by your worker when checkpoint is hit)
  app.post("/checkpoint/start", requireAppAuth, async (req, res) => {
    try {
      const url = req.body?.url;
      if (!url) return res.status(400).json({ error: "url required" });

      startDisplayStackOnce();
      
      // Check if display stack started successfully
      if (!stackStarted) {
        console.log('⚠️ Display stack not available, using manual checkpoint mode');
        return res.json({
          token: randomUUID(),
          portalUrl: null, // null indicates manual mode
          currentUrl: url,
          mode: 'manual'
        });
      }
      
      const token = randomUUID();
      const browser = await chromium.launch({
        headless: false,
        args: ["--display=" + DISPLAY, "--disable-dev-shm-usage"],
        userDataDir: profileDir(req.userId),
      });
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });

      sessions.set(token, {
        browser,
        userId: req.userId,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const portalUrl = `${req.protocol}://${req.get("host")}/checkpoint/${token}`;
      res.json({ token, portalUrl, mode: 'portal' });
    } catch (e) {
      console.error("checkpoint/start error", e);
      
      // Fallback to manual mode if portal fails
      console.log('⚠️ Portal failed, falling back to manual mode');
      res.json({
        token: randomUUID(),
        portalUrl: null,
        currentUrl: req.body?.url,
        mode: 'manual'
      });
    }
  });

  // tiny page that embeds noVNC
  app.get("/checkpoint/:token", requireAppAuth, (req, res) => {
    const s = sessions.get(req.params.token);
    if (!s || s.userId !== req.userId) return res.status(404).send("Expired");

    res.type("html").send(`<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Security Checkpoint</title>
<style>html,body{height:100%;margin:0;background:#0b0b10;color:#ccc;font:14px system-ui}#bar{position:fixed;top:0;left:0;right:0;padding:8px;background:#111;z-index:2}#v{position:absolute;top:40px;left:0;right:0;bottom:0;border:0;width:100%;height:calc(100% - 40px)}</style>
</head><body>
<div id="bar">Complete the check, then click <button id="done">Done</button></div>
<iframe id="v" src="/_novnc/vnc.html?autoconnect=true&resize=remote&path=/_novnc/websockify"></iframe>
<script>
  document.getElementById('done').onclick = async () => {
    await fetch('/checkpoint/${req.params.token}/done',{method:'POST',headers:{'x-user-id':'${req.userId}'}});
    window.close();
  };
</script>
</body></html>`);
  });

  // close and cleanup
  app.post("/checkpoint/:token/done", requireAppAuth, async (req, res) => {
    const s = sessions.get(req.params.token);
    if (!s || s.userId !== req.userId) return res.status(404).json({ error: "not_found" });
    try { await s.browser.close(); } catch {}
    sessions.delete(req.params.token);
    res.json({ ok: true });
  });

  // TTL sweeper
  setInterval(async () => {
    const now = Date.now();
    for (const [t, s] of sessions) {
      if (s.expiresAt < now) {
        try { await s.browser.close(); } catch {}
        sessions.delete(t);
      }
    }
  }, 30_000);

  console.log('✅ Checkpoint portal routes registered successfully');
}

module.exports = { registerCheckpointPortal };
