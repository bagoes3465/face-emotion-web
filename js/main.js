const MODEL_ID = "cuplis123/facial_emotion_bgs";
const INFERENCE_ENDPOINT = "/api/emotion";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const toastEl = $("#toast");
let toastTimer;
function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3000);
}

const navToggle = $(".nav-toggle");
const mobileMenu = $("#mobile-menu");
if (navToggle && mobileMenu) {
  navToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  $$('a, button', mobileMenu).forEach((item) => item.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }));
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard unavailable");
}

const codeText = `from transformers import pipeline

classifier = pipeline("image-classification", model="${MODEL_ID}")
results = classifier("live_frame.jpg")
print(results)`;
const copyBtn = $("#copy-code");
const copyState = $("#copy-state");
copyBtn?.addEventListener("click", async () => {
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
    toast("Copy failed - select the code manually");
  }
});

$$('[data-action="api-access"]').forEach((button) => button.addEventListener("click", async () => {
  try {
    await copyText(MODEL_ID);
    toast(`Model ID copied: ${MODEL_ID}`);
  } catch {
    window.location.hash = "#model-details";
    toast(`Model ID: ${MODEL_ID}`);
  }
}));

const demoBtn = $("#initialize-demo");
const video = $("#camera-video");
const placeholder = $(".camera-placeholder");
const canvas = $("#analysis-canvas");
const cameraMessage = $("#camera-message");
const cameraLabel = $("#camera-label");
const emotionValue = $("#emotion-value");
const emotionConf = $("#emotion-conf");
const emotionCard = $("#emotion-card");
const idStatus = $("#id-status");
const recDot = $("#rec-dot");
const scanner = $("#scanner-line");
const boundingBox = $("#bounding-box");
const sysStatus = $("#sys-status");
const latencyValue = $("#latency-value");
const exportBtn = $("#export-log");
const bars = $("#bars");

let stream;
let running = false;
let analyzing = false;
let inferenceBlocked = false;
let log = [];
let loopTimer;

function setStatus(system, face, message) {
  if (sysStatus) sysStatus.textContent = system;
  if (idStatus) idStatus.textContent = face;
  if (cameraMessage) cameraMessage.textContent = message;
}

function updateTelemetry(results, latency) {
  const normalized = results.map((item) => ({
    label: String(item.label || "unknown").replace(/[_-]+/g, " ").toUpperCase(),
    score: Number(item.score || 0) * 100
  }));
  const top = normalized[0];
  if (!top) return;
  if (emotionValue) emotionValue.textContent = top.label;
  if (emotionConf) emotionConf.textContent = `CONFIDENCE: ${top.score.toFixed(1)}%`;
  if (emotionCard) {
    emotionCard.style.opacity = "0.55";
    setTimeout(() => { emotionCard.style.opacity = "1"; }, 120);
  }
  if (latencyValue) latencyValue.textContent = `${latency}ms`;
  const rows = bars ? $$(".bar-row", bars) : [];
  rows.forEach((row, index) => {
    const label = $(".bar-meta span:first-child", row);
    const value = $(".bar-pct", row);
    const fill = $(".bar-fill", row);
    const result = normalized[index];
    const score = result ? result.score : 0;
    if (label) label.textContent = result ? result.label : "-";
    if (value) value.textContent = `${score.toFixed(1)}%`;
    if (fill) fill.style.setProperty("--w", `${score}%`);
  });
  log.push({ timestamp: new Date().toISOString(), emotion: top.label, confidence: top.score.toFixed(1), latencyMs: latency });
}

async function analyzeFrame() {
  if (!running || analyzing || inferenceBlocked || !video.videoWidth) return;
  analyzing = true;
  const started = performance.now();
  try {
    canvas.width = 224;
    canvas.height = 224;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const response = await fetch(INFERENCE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: canvas.toDataURL("image/jpeg", 0.82) })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Inference endpoint failed");
    const results = Array.isArray(payload) ? payload : payload.results;
    if (!Array.isArray(results)) throw new Error("Model returned an invalid response");
    updateTelemetry(results, Math.max(1, Math.round(performance.now() - started)));
    setStatus("SYS.ACTIVE", "TRACKING", "Face emotion analysis is running");
  } catch (error) {
    console.error(error);
    inferenceBlocked = true;
    setStatus("MODEL.ERROR", "ERROR", error.message || "Model could not analyze this frame");
    toast(error.message || "Inference failed");
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
  running = false;
  inferenceBlocked = false;
  clearTimeout(loopTimer);
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  if (video) { video.pause(); video.srcObject = null; }
  placeholder?.classList.remove("is-hidden");
  video?.classList.remove("is-visible");
  demoBtn?.classList.remove("is-live");
  if (demoBtn) demoBtn.textContent = "Start Camera Demo";
  recDot?.classList.remove("live");
  scanner?.classList.remove("scanning");
  boundingBox?.classList.remove("tracking");
  if (exportBtn) exportBtn.disabled = log.length === 0;
  if (cameraLabel) cameraLabel.textContent = "CAMERA / READY";
  if (latencyValue) latencyValue.textContent = "--";
  setStatus("MODEL.IDLE", "WAITING", "Press Start Camera Demo to begin");
  if (showToast) toast("Camera stopped");
}

async function startDemo() {
  if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    setStatus("CAMERA.ERROR", "ERROR", "Camera needs HTTPS or localhost");
    toast("Open this site through HTTPS or localhost");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("CAMERA.ERROR", "ERROR", "This browser does not support camera access");
    toast("Camera access is unavailable in this browser");
    return;
  }
  try {
    demoBtn && (demoBtn.disabled = true);
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
    demoBtn?.classList.add("is-live");
    if (demoBtn) demoBtn.textContent = "Stop Camera Demo";
    recDot?.classList.add("live");
    scanner?.classList.add("scanning");
    boundingBox?.classList.add("tracking");
    if (cameraLabel) cameraLabel.textContent = "CAMERA / LIVE";
    if (exportBtn) exportBtn.disabled = false;
    setStatus("SERVER.READY", "TRACKING", "Camera is live; starting model inference...");
    toast("Camera preview started");
    scheduleAnalysis();
  } catch (error) {
    console.error(error);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    setStatus("SYSTEM.ERROR", "ERROR", error.name === "NotAllowedError" ? "Allow camera access and try again" : "Could not start the camera");
    toast(error.message || "Could not start camera demo");
  } finally {
    if (demoBtn) demoBtn.disabled = false;
  }
}

demoBtn?.addEventListener("click", () => {
  if (running) stopDemo();
  else startDemo();
});

function download(name, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

exportBtn?.addEventListener("click", () => {
  const lines = ["timestamp,emotion,confidence,latencyMs", ...log.map((row) => [row.timestamp, row.emotion, row.confidence, row.latencyMs].join(","))];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  download(`cuplis-ai-emotion-log-${stamp}.csv`, lines.join("\n"), "text/csv");
  toast(`Emotion log exported (${log.length} samples)`);
});

window.addEventListener("beforeunload", () => { if (stream) stream.getTracks().forEach((track) => track.stop()); });

const buttonStyle = document.createElement("style");
buttonStyle.textContent = ".btn-primary.is-live{background:var(--secondary-container);color:var(--on-secondary-container);box-shadow:0 0 15px rgba(220,184,255,0.35)}";
document.head.appendChild(buttonStyle);