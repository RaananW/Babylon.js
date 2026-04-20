/* eslint-disable @typescript-eslint/naming-convention */
/**
 * PreviewServer — built-in HTTP server that serves a glTF document from
 * the MCP server's in-memory state via the Babylon.js Sandbox.
 *
 * Design:
 * ───────
 * 1. Uses Node's built-in `http` module (zero external dependencies).
 * 2. Regenerates the GLB on every request — the preview always reflects
 *    the latest in-memory state without needing a restart.
 * 3. Singleton — only one preview server runs at a time.
 * 4. Non-blocking — runs in the background alongside the MCP stdio transport.
 *
 * The server exposes several routes:
 * - `GET /model.glb`     — serves the active document as a GLB binary
 * - `GET /model.gltf`    — serves the active document as glTF JSON
 * - `GET /api/info`      — returns a JSON summary of the active document
 * - `GET /`              — redirects to the Sandbox URL
 */

import * as http from "http";
import { type GltfManager } from "./gltfManager.js";

// ═══════════════════════════════════════════════════════════════════════════
//  State
// ═══════════════════════════════════════════════════════════════════════════

let _server: http.Server | null = null;
let _port: number = 0;
let _docName: string = "";
let _manager: GltfManager | null = null;
let _version: number = 0;

const SANDBOX_BASE = "https://sandbox.babylonjs.com";

// ═══════════════════════════════════════════════════════════════════════════
//  Built-in viewer HTML
// ═══════════════════════════════════════════════════════════════════════════

function getViewerHtml(serverUrl: string, sandboxUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>glTF Preview — ${_docName}</title>
<style>
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#1e1e1e}
  #renderCanvas{width:100%;height:100%;touch-action:none;outline:none}
  #toolbar{position:fixed;top:8px;right:12px;z-index:10;display:flex;gap:8px;font:13px/1.4 system-ui,sans-serif}
  #toolbar a,#toolbar button{background:rgba(255,255,255,.12);color:#ccc;border:1px solid rgba(255,255,255,.2);
    padding:4px 10px;border-radius:4px;text-decoration:none;cursor:pointer;font:inherit}
  #toolbar a:hover,#toolbar button:hover{background:rgba(255,255,255,.22)}
  #animPanel{position:fixed;bottom:0;left:0;right:0;z-index:10;background:rgba(30,30,30,.92);
    border-top:1px solid rgba(255,255,255,.15);padding:8px 16px;font:12px/1.5 system-ui,sans-serif;color:#ccc;
    display:none;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto}
  #animPanel.visible{display:flex}
  #animPanel .anim-header{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  #animPanel .anim-header label{color:#999;font-size:11px}
  #animPanel select{background:#2d2d2d;color:#ccc;border:1px solid rgba(255,255,255,.2);border-radius:3px;
    padding:3px 6px;font:inherit}
  #animPanel button{background:rgba(255,255,255,.12);color:#ccc;border:1px solid rgba(255,255,255,.2);
    padding:3px 10px;border-radius:3px;cursor:pointer;font:inherit}
  #animPanel button:hover{background:rgba(255,255,255,.22)}
  #animPanel button.active{background:rgba(100,180,255,.3);border-color:rgba(100,180,255,.5)}
  #animPanel .speed-control{display:flex;align-items:center;gap:6px}
  #animPanel .speed-control input[type=range]{width:80px;accent-color:#5a9fd4}
  #animPanel .speed-control span{min-width:30px;text-align:center}
  #animPanel .progress-row{display:flex;align-items:center;gap:8px}
  #animPanel .progress-row input[type=range]{flex:1;accent-color:#5a9fd4}
  #animPanel .progress-row span{min-width:80px;text-align:right;font-variant-numeric:tabular-nums}
  #noAnims{color:#666;font-style:italic}
</style>
</head>
<body>
<div id="toolbar">
  <button onclick="location.reload()">&#x21bb; Refresh</button>
  <a href="${sandboxUrl}" target="_blank" rel="noopener">Open in Sandbox &#x2197;</a>
</div>
<canvas id="renderCanvas"></canvas>
<div id="animPanel">
  <div class="anim-header">
    <label>Animation:</label>
    <select id="animSelect"></select>
    <button id="btnPlay" title="Play">&#x25B6;</button>
    <button id="btnPause" title="Pause">&#x23F8;</button>
    <button id="btnStop" title="Stop">&#x23F9;</button>
    <div class="speed-control">
      <label>Speed:</label>
      <input type="range" id="speedSlider" min="0" max="3" step="0.1" value="1">
      <span id="speedVal">1.0x</span>
    </div>
  </div>
  <div class="progress-row">
    <input type="range" id="scrubber" min="0" max="1000" value="0" step="1">
    <span id="timeLabel">0.00 / 0.00s</span>
  </div>
</div>
<script src="https://cdn.babylonjs.com/babylon.js"><\/script>
<script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"><\/script>
<script>
(function(){
  var canvas=document.getElementById("renderCanvas");
  var engine=new BABYLON.Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true});
  var animGroups=[];
  var currentGroup=null;
  var scrubbing=false;

  BABYLON.SceneLoader.Load("","${serverUrl}/model.glb?t="+Date.now(),engine,function(scene){
    scene.createDefaultCameraOrLight(true,true,true);
    scene.createDefaultEnvironment();
    engine.runRenderLoop(function(){
      scene.render();
      if(currentGroup&&currentGroup.isPlaying&&!scrubbing){
        updateScrubber();
      }
    });

    animGroups=scene.animationGroups||[];
    initAnimPanel(scene);
  },null,function(_scene,msg){document.body.innerHTML="<pre style=\\"color:red;padding:2em\\">"+msg+"</pre>"});
  window.addEventListener("resize",function(){engine.resize()});

  function initAnimPanel(scene){
    var panel=document.getElementById("animPanel");
    var select=document.getElementById("animSelect");
    var btnPlay=document.getElementById("btnPlay");
    var btnPause=document.getElementById("btnPause");
    var btnStop=document.getElementById("btnStop");
    var speedSlider=document.getElementById("speedSlider");
    var speedVal=document.getElementById("speedVal");
    var scrubberEl=document.getElementById("scrubber");
    var timeLabel=document.getElementById("timeLabel");

    if(animGroups.length===0){
      return; // panel stays hidden
    }
    panel.classList.add("visible");

    // Stop all auto-playing animations first
    animGroups.forEach(function(g){g.stop()});

    // Populate dropdown
    animGroups.forEach(function(g,i){
      var opt=document.createElement("option");
      opt.value=i;
      opt.textContent=(g.name||"Animation "+i)+" ("+g.targetedAnimations.length+" targets)";
      select.appendChild(opt);
    });

    currentGroup=animGroups[0]||null;
    if(currentGroup){
      currentGroup.start(true);
      updateButtonStates();
    }

    select.addEventListener("change",function(){
      if(currentGroup)currentGroup.stop();
      currentGroup=animGroups[parseInt(select.value)]||null;
      if(currentGroup){
        currentGroup.speedRatio=parseFloat(speedSlider.value);
        currentGroup.start(true);
        updateButtonStates();
        updateScrubber();
      }
    });

    btnPlay.addEventListener("click",function(){
      if(!currentGroup)return;
      if(currentGroup.isPlaying&&!currentGroup.isPaused){return}
      if(currentGroup.isPaused){currentGroup.play(true)}
      else{currentGroup.start(true)}
      currentGroup.speedRatio=parseFloat(speedSlider.value);
      updateButtonStates();
    });

    btnPause.addEventListener("click",function(){
      if(!currentGroup||!currentGroup.isPlaying)return;
      currentGroup.pause();
      updateButtonStates();
    });

    btnStop.addEventListener("click",function(){
      if(!currentGroup)return;
      currentGroup.stop();
      currentGroup.goToFrame(currentGroup.from);
      updateButtonStates();
      updateScrubber();
    });

    speedSlider.addEventListener("input",function(){
      var v=parseFloat(this.value);
      speedVal.textContent=v.toFixed(1)+"x";
      if(currentGroup)currentGroup.speedRatio=v;
    });

    scrubberEl.addEventListener("mousedown",function(){scrubbing=true});
    scrubberEl.addEventListener("touchstart",function(){scrubbing=true});
    scrubberEl.addEventListener("input",function(){
      if(!currentGroup)return;
      var ratio=parseInt(this.value)/1000;
      var frame=currentGroup.from+ratio*(currentGroup.to-currentGroup.from);
      var wasPlaying=currentGroup.isPlaying&&!currentGroup.isPaused;
      if(wasPlaying)currentGroup.pause();
      currentGroup.goToFrame(frame);
      var t=(frame-currentGroup.from)/(scene.getAnimationRatio()||1)/60;
      var total=(currentGroup.to-currentGroup.from)/(scene.getAnimationRatio()||1)/60;
      timeLabel.textContent=formatTime(frame,currentGroup)+formatTime(currentGroup.to,currentGroup);
    });
    scrubberEl.addEventListener("mouseup",function(){scrubbing=false});
    scrubberEl.addEventListener("touchend",function(){scrubbing=false});

    function updateButtonStates(){
      btnPlay.classList.toggle("active",currentGroup&&currentGroup.isPlaying&&!currentGroup.isPaused);
      btnPause.classList.toggle("active",currentGroup&&currentGroup.isPaused);
    }
  }

  function updateScrubber(){
    if(!currentGroup)return;
    var scrubberEl=document.getElementById("scrubber");
    var timeLabel=document.getElementById("timeLabel");
    var anims=currentGroup.targetedAnimations;
    if(!anims||anims.length===0)return;
    var masterAnim=anims[0].animation;
    var runtimeAnims=currentGroup.animatables;
    var currentFrame=currentGroup.from;
    if(runtimeAnims&&runtimeAnims.length>0){
      currentFrame=runtimeAnims[0].masterFrame||currentGroup.from;
    }
    var range=currentGroup.to-currentGroup.from;
    if(range>0){
      var ratio=(currentFrame-currentGroup.from)/range;
      scrubberEl.value=Math.round(ratio*1000);
    }
    timeLabel.textContent=currentFrame.toFixed(1)+" / "+currentGroup.to.toFixed(1)+" frames";
  }

  function formatTime(frame,group){
    return frame.toFixed(1);
  }
})();
<\/script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Public queries
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Whether the preview server is currently running.
 */
export function isPreviewRunning(): boolean {
    return _server !== null && _server.listening;
}

/**
 * Returns the local server URL, or null if not running.
 */
export function getPreviewServerUrl(): string | null {
    if (!isPreviewRunning()) {
        return null;
    }
    return `http://localhost:${_port}`;
}

/**
 * Returns the full Sandbox URL that loads the current document, or null.
 */
export function getSandboxUrl(): string | null {
    const serverUrl = getPreviewServerUrl();
    if (!serverUrl) {
        return null;
    }
    _version++;
    return `${SANDBOX_BASE}?assetUrl=${serverUrl}/model.glb?v=${_version}`;
}

/**
 * Returns the document name currently being previewed.
 */
export function getPreviewDocName(): string | null {
    if (!isPreviewRunning()) {
        return null;
    }
    return _docName;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start the preview server.
 *
 * @param manager   The GltfManager instance
 * @param docName   Name of the glTF document to serve
 * @param port      Port to listen on (default: 8766)
 * @returns The Sandbox URL to open in a browser
 */
export async function startPreview(manager: GltfManager, docName: string, port: number = 8766): Promise<string> {
    // If already running on the same port, just switch the document
    if (_server && _server.listening && _port === port) {
        _manager = manager;
        _docName = docName;
        const url = getSandboxUrl()!;
        // eslint-disable-next-line no-console
        console.error(`[gltf-preview] Reusing server — switched to "${docName}"`);
        return url;
    }

    // Stop any existing server first
    if (_server && _server.listening) {
        await stopPreview();
    }

    _manager = manager;
    _docName = docName;
    _port = port;

    return await new Promise((resolve, reject) => {
        const srv = http.createServer((req, res) => {
            const url = new URL(req.url ?? "/", `http://localhost:${_port}`);
            const pathname = url.pathname;

            // CORS — required for the Sandbox to fetch from localhost
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }

            // ── /model.glb — serve the document as GLB ─────────────────
            if (pathname === "/model.glb") {
                const glb = _manager!.exportGlb(_docName);
                if (!glb) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "model/gltf-binary",
                    "Content-Length": String(glb.length),
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    Pragma: "no-cache",
                    Expires: "0",
                });
                res.end(glb);
                return;
            }

            // ── /model.gltf — serve as JSON ────────────────────────────
            if (pathname === "/model.gltf") {
                const json = _manager!.exportJson(_docName);
                if (!json) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "model/gltf+json",
                    "Cache-Control": "no-cache, no-store",
                });
                res.end(json);
                return;
            }

            // ── /api/info — quick document summary ─────────────────────
            if (pathname === "/api/info") {
                const summary = _manager!.describeGltf(_docName);
                if (!summary || summary.startsWith("Error")) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Cache-Control": "no-cache, no-store",
                });
                res.end(summary);
                return;
            }

            // ── /api/animations — list animations as JSON ──────────────
            if (pathname === "/api/animations") {
                const doc = _manager!.getDoc(_docName);
                if (!doc) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: `No document "${_docName}"` }));
                    return;
                }
                const anims = (doc.animations ?? []).map((a, i) => ({
                    index: i,
                    name: a.name ?? `Animation ${i}`,
                    channels: a.channels?.length ?? 0,
                }));
                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache, no-store",
                });
                res.end(JSON.stringify(anims));
                return;
            }

            // ── / — serve a built-in viewer page ───────────────────────
            if (pathname === "/" || pathname === "/index.html") {
                const serverUrl = getPreviewServerUrl()!;
                const sandboxUrl = getSandboxUrl()!;
                const html = getViewerHtml(serverUrl, sandboxUrl);
                res.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                });
                res.end(html);
                return;
            }

            // ── 404 ────────────────────────────────────────────────────
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found. Routes: /model.glb, /model.gltf, /api/info, /api/animations, /");
        });

        srv.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE") {
                reject(new Error(`Port ${_port} is already in use. Try a different port.`));
            } else {
                reject(err);
            }
        });

        srv.listen(_port, () => {
            _server = srv;
            const sandboxUrl = getSandboxUrl()!;
            // eslint-disable-next-line no-console
            console.error(`[gltf-preview] Serving "${_docName}" at http://localhost:${_port}`);
            // eslint-disable-next-line no-console
            console.error(`[gltf-preview] Sandbox: ${sandboxUrl}`);
            resolve(sandboxUrl);
        });
    });
}

/**
 * Stop the preview server.
 */
export async function stopPreview(): Promise<void> {
    return await new Promise((resolve) => {
        if (!_server || !_server.listening) {
            _server = null;
            resolve();
            return;
        }
        _server.close(() => {
            // eslint-disable-next-line no-console
            console.error("[gltf-preview] Server stopped.");
            _server = null;
            _docName = "";
            _port = 0;
            _manager = null;
            resolve();
        });
    });
}

/**
 * Change which document is being served (without restarting).
 */
export function setPreviewDocument(docName: string): void {
    _docName = docName;
}
