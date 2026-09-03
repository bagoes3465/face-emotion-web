const MODEL_ID = "cuplis123/facial_emotion_bgs";
const INFERENCE_ENDPOINT = "/api/emotion";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ── Toast ──────────────────────────────────────────────────────────────────
const toastEl = $("#toast");
let toastTimer;
function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
}

// ── Mobile Nav ─────────────────────────────────────────────────────────────
const navToggle = $(".nav-toggle");
const mobileMenu = $("#mobile-menu");
if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  $$("a, button", mobileMenu).forEach(item =>
    item.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );
}

// ── Copy Utilities ─────────────────────────────────────────────────────────
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("Clipboard unavailable");
}

// ── Copy Model ID buttons ──────────────────────────────────────────────────
$$('[data-action="api-access"]').forEach(btn =>
  btn.addEventListener("click", async () => {
    try {
      await copyText(MODEL_ID);
      toast(`Model ID copied: ${MODEL_ID}`);
    } catch {
      toast(`Model ID: ${MODEL_ID}`);
    }
  })
);

// Also the nav button with id
const btnCopyNav = $("#btnCopyNav");
if (btnCopyNav) {
  btnCopyNav.addEventListener("click", async () => {
    try {
      await copyText(MODEL_ID);
      const orig = btnCopyNav.innerHTML;
      btnCopyNav.innerHTML =
        `<span class="material-symbols-outlined" style="font-size:15px;font-variation-settings:'FILL' 0">check</span> COPIED!`;
      setTimeout(() => { btnCopyNav.innerHTML = orig; }, 2000);
    } catch {
      toast(`Model ID: ${MODEL_ID}`);
    }
  });
}

// ── Copy Code snippet ──────────────────────────────────────────────────────
const codeText = `from transformers import pipeline

classifier = pipeline("image-classification", model="${MODEL_ID}")
results = classifier("live_frame.jpg")
print(results)`;
const copyBtn  = $("#copy-code");
const copyState = $("#copy-state");
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await copyText(codeText);
      if (copyState) copyState.textContent = "Copied!";
      copyBtn.classList.add("copied");
      toast("Python example copied");
      setTimeout(() => {
        if (copyState) copyState.textContent = "Copy";
        copyBtn.classList.remove("copied");
      }, 1800);
    } catch {
      toast("Copy failed — select the code manually");
    }
  });
}

// ── Camera Demo ────────────────────────────────────────────────────────────
// Both the hero button and the one under video
const demoButtons  = $$("#initialize-demo, #initialize-demo-2");
const video        = $("#camera-video");
const placeholder  = $("#camera-placeholder");
const canvas       = $("#analysis-canvas");
const cameraMsg    = $("#camera-message");
const cameraLabel  = $("#camera-label");
const emotionValue = $("#emotion-value");
const emotionConf  = $("#emotion-conf");
const emotionCard  = $("#emotion-card");
const idStatus     = $("#id-status");
const recDot       = $("#rec-dot");
const scannerLine  = $("#scanner-line");
const boundingBox  = $("#bounding-box");
const sysStatus    = $("#sys-status");
const latencyValue = $("#latency-value");
const exportBtn    = $("#export-log");
const barsRoot     = $("#bars");
const reticles     = $$(".reticle");

let stream; let running = false; let analyzing = false;
let inferenceBlocked = false; let log = []; let loopTimer;

// Sync both start/stop buttons label
function syncButtonLabels(label) {
  demoButtons.forEach(b => b.innerHTML =
    `<span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 0">${label === "Stop Camera Demo" ? "videocam_off" : "videocam"}</span> ${label}`
  );
}

function setStatus(system, face, message) {
  if (sysStatus)    sysStatus.textContent    = system;
  if (idStatus)     idStatus.textContent     = `STATUS: ${face}`;
  if (cameraMsg)    cameraMsg.textContent    = message;
  if (latencyValue && system !== "SYS.ACTIVE") latencyValue.textContent = "--";
}

function updateTelemetry(results, latency) {
  const norm = results.map(r => ({
    label: String(r.label || "UNKNOWN").replace(/[_-]+/g," ").toUpperCase(),
    score: Number(r.score || 0) * 100
  }));
  const top = norm[0]; if (!top) return;

  if (emotionValue) emotionValue.textContent = top.label;
  if (emotionConf)  emotionConf.textContent  = `CONFIDENCE: ${top.score.toFixed(1)}%`;
  if (emotionCard)  { emotionCard.style.opacity = "0.4"; setTimeout(() => { emotionCard.style.opacity = "1"; }, 120); }
  if (latencyValue) latencyValue.textContent = `${latency}ms`;

  const rows = barsRoot ? $$(".bar-row", barsRoot) : [];
  rows.forEach((row, i) => {
    const lbl  = $(".bar-meta span:first-child", row);
    const pct  = $(".bar-pct", row);
    const fill = $(".bar-fill", row);
    const r    = norm[i]; const score = r ? r.score : 0;
    if (lbl)  lbl.textContent  = r ? r.label : "-";
    if (pct)  pct.textContent  = `${score.toFixed(1)}%`;
    if (fill) {
      fill.style.setProperty("--w", `${score}%`);
      fill.classList.toggle("bar-high", score >= 80);
      fill.classList.toggle("bar-dim", !r || i !== 0);
    }
  });

  log.push({ timestamp: new Date().toISOString(), emotion: top.label, confidence: top.score.toFixed(1), latencyMs: latency });
}

async function analyzeFrame() {
  if (!running || analyzing || inferenceBlocked || !video.videoWidth) return;
  analyzing = true;
  const started = performance.now();
  try {
    canvas.width = 224; canvas.height = 224;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, 224, 224);
    const resp = await fetch(INFERENCE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: canvas.toDataURL("image/jpeg", 0.82) })
    });
    const payload = await resp.json();
    if (!resp.ok) throw new Error(payload.error || "Inference endpoint failed");
    const results = Array.isArray(payload) ? payload : payload.results;
    if (!Array.isArray(results)) throw new Error("Model returned invalid response");
    updateTelemetry(results, Math.max(1, Math.round(performance.now() - started)));
    setStatus("SYS.ACTIVE", "TRACKING", "Face emotion analysis is running");
  } catch (err) {
    console.error(err);
    inferenceBlocked = true;
    setStatus("MODEL.ERROR", "ERROR", err.message || "Model could not analyze this frame");
    toast(err.message || "Inference failed");
  } finally {
    analyzing = false;
  }
}

async function scheduleAnalysis() {
  clearTimeout(loopTimer);
  if (!running || inferenceBlocked) return;
  await analyzeFrame();
  if (running && !inferenceBlocked) loopTimer = setTimeout(scheduleAnalysis, 1500);
}

async function stopDemo(showToast = true) {
  running = false; inferenceBlocked = false;
  clearTimeout(loopTimer);
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null;
  if (video) { video.pause(); video.srcObject = null; }

  placeholder?.classList.remove("is-hidden");
  video?.classList.remove("is-visible");
  recDot?.classList.remove("live");
  scannerLine?.classList.remove("scanning");
  boundingBox?.classList.remove("tracking");
  reticles.forEach(r => r.classList.remove("active"));

  demoButtons.forEach(b => b.classList.remove("is-live"));
  syncButtonLabels("Start Camera Demo");

  if (cameraLabel) cameraLabel.textContent = "CAMERA / READY";
  if (exportBtn)   exportBtn.disabled = log.length === 0;
  setStatus("MODEL.IDLE", "WAITING", "Press Start Camera Demo to begin");
  if (showToast) toast("Camera stopped");
}

async function startDemo() {
  if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    setStatus("CAMERA.ERROR", "ERROR", "Camera needs HTTPS or localhost");
    toast("Open this site via HTTPS or localhost");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("CAMERA.ERROR", "ERROR", "This browser does not support camera access");
    toast("Camera access unavailable in this browser");
    return;
  }
  try {
    demoButtons.forEach(b => b.disabled = true);
    inferenceBlocked = false;
    setStatus("CAMERA.REQUEST", "WAITING", "Requesting camera access...");

    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    running = true;
    placeholder?.classList.add("is-hidden");
    video?.classList.add("is-visible");
    recDot?.classList.add("live");
    scannerLine?.classList.add("scanning");
    boundingBox?.classList.add("tracking");
    reticles.forEach(r => r.classList.add("active"));

    demoButtons.forEach(b => b.classList.add("is-live"));
    syncButtonLabels("Stop Camera Demo");

    if (cameraLabel) cameraLabel.textContent = "CAMERA / LIVE";
    if (exportBtn)   exportBtn.disabled = false;
    setStatus("SERVER.READY", "TRACKING", "Camera is live; starting model inference...");
    toast("Camera preview started");
    scheduleAnalysis();
  } catch (err) {
    console.error(err);
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    setStatus("SYSTEM.ERROR", "ERROR",
      err.name === "NotAllowedError" ? "Allow camera access and try again" : "Could not start the camera");
    toast(err.message || "Could not start camera demo");
  } finally {
    demoButtons.forEach(b => b.disabled = false);
  }
}

demoButtons.forEach(b =>
  b.addEventListener("click", () => { if (running) stopDemo(); else startDemo(); })
);

// ── Export Log ─────────────────────────────────────────────────────────────
function download(name, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if (exportBtn) {
  exportBtn.disabled = true;
  exportBtn.addEventListener("click", () => {
    const lines = [
      "timestamp,emotion,confidence,latencyMs",
      ...log.map(r => [r.timestamp, r.emotion, r.confidence, r.latencyMs].join(","))
    ];
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    download(`cuplis-ai-emotion-log-${stamp}.csv`, lines.join("\n"), "text/csv");
    toast(`Emotion log exported (${log.length} samples)`);
  });
}

// ── Cleanup on unload ──────────────────────────────────────────────────────
window.addEventListener("beforeunload", () => {
  if (stream) stream.getTracks().forEach(t => t.stop());
});
