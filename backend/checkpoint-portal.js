// checkpoint-portal.js
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");
const { randomUUID } = require("crypto");
const { createProxyMiddleware } = require("http-proxy-middleware");

const DISPLAY=":99";
const VNC_PORT=+process.env.VNC_PORT||5900;
const NOVNC_PORT=+process.env.NOVNC_PORT||6080;
const DATA_ROOT=process.env.DATA_ROOT||path.join(__dirname, "data", "profiles"); // use local directory for development
fs.mkdirSync(DATA_ROOT,{recursive:true});

let stackStarted=false;
const sessions=new Map(); // token -> { browser, userId, expiresAt }

function startDisplayStackOnce(){
  if(stackStarted) return; stackStarted=true;
  const env={...process.env,DISPLAY};
  spawn("Xvfb",[DISPLAY,"-screen","0","1920x1080x24"],{stdio:"inherit"});
  spawn("fluxbox",[],{stdio:"inherit",env});
  spawn("x11vnc",["-display",DISPLAY,"-nopw","-forever","-shared","-rfbport",String(VNC_PORT)],{stdio:"inherit"});
  spawn("websockify",["--web=/usr/share/novnc",String(NOVNC_PORT),`localhost:${VNC_PORT}`],{stdio:"inherit"});
}

function profileDir(userId){ const d=path.join(DATA_ROOT,String(userId)); fs.mkdirSync(d,{recursive:true}); return d; }
function requireAppAuth(req,res,next){ const uid=req.header("x-user-id"); if(!uid) return res.status(401).json({error:"unauthorized"}); req.userId=uid; next(); }

function registerCheckpointPortal(app){
  // proxy noVNC under same origin
  app.use("/_novnc", createProxyMiddleware({ target:`http://127.0.0.1:${NOVNC_PORT}`, changeOrigin:true, ws:true }));

  app.post("/checkpoint/start", requireAppAuth, async (req,res)=>{
    try{
      const url=req.body?.url; if(!url) return res.status(400).json({error:"url required"});
      startDisplayStackOnce();
      const token=randomUUID();
      const ctx=await chromium.launchPersistentContext(profileDir(req.userId), { headless:false, args:["--display="+DISPLAY,"--disable-dev-shm-usage"] });
      const page=await ctx.newPage(); await page.goto(url,{waitUntil:"domcontentloaded"});
      sessions.set(token,{ browser:ctx, userId:req.userId, expiresAt:Date.now()+10*60*1000 });
      const portalUrl=`${req.protocol}://${req.get("host")}/checkpoint/${token}`;
      res.json({ token, portalUrl });
    }catch(e){ console.error("checkpoint/start",e); res.status(500).json({error:"failed_to_start_portal"}); }
  });

  app.get("/checkpoint/:token", requireAppAuth, (req,res)=>{
    const s=sessions.get(req.params.token);
    if(!s || s.userId!==req.userId) return res.status(404).send("Expired");
    res.type("html").send(`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1">
<style>html,body{height:100%;margin:0;background:#0b0b10;color:#ccc;font:14px system-ui}
#bar{position:fixed;top:0;left:0;right:0;padding:8px;background:#111;z-index:2}
#v{position:absolute;top:40px;left:0;right:0;bottom:0;border:0;width:100%;height:calc(100% - 40px)}</style>
<div id=bar>Complete the check, then click <button id=done>Done</button></div>
<iframe id=v src="/_novnc/vnc.html?autoconnect=true&resize=remote&path=/_novnc/websockify"></iframe>
<script>
document.getElementById('done').onclick=async()=>{await fetch('/checkpoint/${req.params.token}/done',{method:'POST',headers:{'x-user-id':'${req.userId}'}});window.close();};
</script>`);
  });

  app.post("/checkpoint/:token/done", requireAppAuth, async (req,res)=>{
    const s=sessions.get(req.params.token);
    if(!s || s.userId!==req.userId) return res.status(404).json({error:"not_found"});
    try{ await s.browser.close(); }catch{}
    sessions.delete(req.params.token);
    res.json({ok:true});
  });

  setInterval(async()=>{
    const now=Date.now();
    for(const [t,s] of sessions){
      if(s.expiresAt<now){ try{ await s.browser.close(); }catch{} sessions.delete(t); }
    }
  },30000);
}

module.exports = { registerCheckpointPortal };
