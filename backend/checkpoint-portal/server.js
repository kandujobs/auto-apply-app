/**
 * Minimal Checkpoint Portal
 * - POST /checkpoint/start { userId, url } -> { token, portalUrl }
 * - GET  /checkpoint/:token -> serves noVNC page (auth-checked)
 * - POST /checkpoint/:token/done -> closes browser
 * - GET  /health
 *
 * Notes:
 * - Uses one Chromium per portal, with userDataDir mounted per user.
 * - noVNC is proxied under /_novnc to avoid cross-origin issues.
 */
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { chromium } from 'playwright';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const app = express();
app.use(express.json());

/** --- Simple env/config --- **/
const PORT = process.env.PORT || 8080;
const DATA_ROOT = process.env.DATA_ROOT || '/data/profiles'; // mount a Railway volume to persist cookies
const NOVNC_PORT = process.env.NOVNC_PORT || 6080;
const VNC_PORT = process.env.VNC_PORT || 5900;
fs.mkdirSync(DATA_ROOT, { recursive: true });

/** --- Start Xvfb + fluxbox + x11vnc + noVNC once --- **/
function startDisplayStack() {
  const procs = [];

  const xvfb = spawn('Xvfb', [':99', '-screen', '0', '1920x1080x24'], { stdio: 'inherit' });
  procs.push(xvfb);

  const wm = spawn('fluxbox', [], { stdio: 'inherit', env: { ...process.env, DISPLAY: ':99' } });
  procs.push(wm);

  const vnc = spawn('x11vnc', ['-display', ':99', '-nopw', '-forever', '-shared', '-rfbport', `${VNC_PORT}`], { stdio: 'inherit' });
  procs.push(vnc);

  const novnc = spawn('websockify', ['--web=/usr/share/novnc', `${NOVNC_PORT}`, `localhost:${VNC_PORT}`], { stdio: 'inherit' });
  procs.push(novnc);

  process.on('exit', () => procs.forEach(p => p.kill('SIGTERM')));
}
startDisplayStack();

/** --- In-memory sessions --- **/
const sessions = new Map(); // token -> { browser, userId, expiresAt }

/** --- Helpers --- **/
const profileDir = (userId) => {
  const dir = path.join(DATA_ROOT, String(userId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// TODO: replace with your real auth
function requireAppAuth(req, res, next) {
  // Accept any request with x-user-id for demo; wire to your JWT/session
  const userId = req.header('x-user-id');
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = userId;
  next();
}

/** --- Create portal (called by your job when checkpoint detected) --- **/
app.post('/checkpoint/start', requireAppAuth, async (req, res) => {
  try {
    const { url } = req.body;
    const userId = req.userId;
    if (!url) return res.status(400).json({ error: 'url required' });

    const token = randomUUID();

    const browser = await chromium.launch({
      headless: false,
      args: ['--display=:99', '--disable-dev-shm-usage'],
      userDataDir: profileDir(userId),
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    sessions.set(token, {
      browser,
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });

    const portalUrl = `${req.protocol}://${req.get('host')}/checkpoint/${token}`;
    res.json({ token, portalUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed_to_start_portal' });
  }
});

/** --- Serve a tiny page that embeds noVNC --- **/
app.get('/checkpoint/:token', requireAppAuth, (req, res) => {
  const { token } = req.params;
  const s = sessions.get(token);
  if (!s || s.userId !== req.userId) return res.status(404).send('Expired or not found');

  res.type('html').send(`<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Security Checkpoint</title>
<style>html,body,#wrap{height:100%;margin:0;background:#0b0b10} #bar{position:fixed;top:0;left:0;right:0;padding:8px;background:#111;color:#ccc;font:14px system-ui;z-index:2} #vnc{position:absolute;top:40px;left:0;right:0;bottom:0;border:0;width:100%;height:calc(100% - 40px)}</style>
</head>
<body>
<div id="wrap">
  <div id="bar">Complete the verification, then click "Done". <button id="done">Done</button></div>
  <iframe id="vnc" src="/_novnc/vnc.html?autoconnect=true&resize=remote&path=/_novnc/websockify" allow="clipboard-read; clipboard-write"></iframe>
</div>
<script>
  document.getElementById('done').onclick = async () => {
    await fetch('/checkpoint/${token}/done', { method:'POST', headers:{ 'x-user-id': '${req.userId}' }});
    window.close(); // if opened in new window
  };
</script>
</body></html>`);
});

/** --- Close portal --- **/
app.post('/checkpoint/:token/done', requireAppAuth, async (req, res) => {
  const { token } = req.params;
  const s = sessions.get(token);
  if (!s || s.userId !== req.userId) return res.status(404).json({ error: 'not_found' });
  try {
    await s.browser.close();
  } catch (e) {
    console.warn('close err', e?.message);
  }
  sessions.delete(token);
  res.json({ ok: true });
});

/** --- Expiry sweeper --- **/
setInterval(async () => {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (s.expiresAt < now) {
      try { await s.browser.close(); } catch {}
      sessions.delete(token);
    }
  }
}, 30_000);

/** --- Proxy noVNC (so same origin) --- **/
app.use('/_novnc', createProxyMiddleware({
  target: `http://127.0.0.1:${NOVNC_PORT}`,
  changeOrigin: true,
  ws: true,
}));

/** --- Health --- **/
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`checkpoint portal on :${PORT}`));
