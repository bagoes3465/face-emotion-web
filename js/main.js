/* ============================================================
   SENTIENT AI — interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, min, max) { return Math.min(max, Math.max(min, v)); };

  /* ---------- toast ---------- */
  var toastEl = $("#toast");
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- mobile menu ---------- */
  var navToggle = $(".nav-toggle");
  var mobileMenu = $("#mobile-menu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("a", mobileMenu).forEach(function (a) {
      a.addEventListener("click", function () {
        mobileMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- copy code ---------- */
  var copyBtn = $("#copy-code");
  var copyState = $("#copy-state");
  var CODE_TEXT = [
    "from transformers import pipeline",
    "",
    "# Initialize the emotion detection pipeline",
    'classifier = pipeline("image-classification", model="cuplis123/facial_emotion_bgs")',
    "",
    "# Run inference on a frame",
    'results = classifier("live_frame_01.jpg")',
    "print(results)",
    ""
  ].join("\n");

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      copyText(CODE_TEXT).then(function () {
        if (copyState) copyState.textContent = "Copied!";
        copyBtn.classList.add("copied");
        toast("Code copied to clipboard");
        setTimeout(function () {
          if (copyState) copyState.textContent = "Copy";
          copyBtn.classList.remove("copied");
        }, 1800);
      }).catch(function () {
        toast("Copy failed — select the code manually");
      });
    });
  }

  /* ---------- Get API Access ---------- */
  var MODEL_ID = "cuplis123/facial_emotion_bgs";
  $$('[data-action="api-access"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(MODEL_ID).then(function () {
        toast("Model ID copied: " + MODEL_ID);
      }).catch(function () {
        window.location.hash = "#how-it-works";
        toast("API access: model ID " + MODEL_ID);
      });
    });
  });

  /* ---------- Live demo simulation ---------- */
  var EMOTIONS = [
    { name: "NEUTRAL",   conf: 94.2, violet: 94.2, cyan: 82.1, happy: 12.5, sur: 4.1, ang: 1.2, dominant: "bar-violet" },
    { name: "FOCUSED",   conf: 91.4, violet: 88.0, cyan: 91.4, happy: 7.2,  sur: 2.4, ang: 0.8, dominant: "bar-cyan" },
    { name: "HAPPY",     conf: 87.6, violet: 80.3, cyan: 84.2, happy: 87.6, sur: 6.9, ang: 1.7, dominant: "bar-violet" },
    { name: "SURPRISED", conf: 79.8, violet: 72.1, cyan: 76.4, happy: 15.3, sur: 79.8, ang: 2.2, dominant: "bar-violet" },
    { name: "ANGRY",     conf: 83.5, violet: 70.8, cyan: 74.6, happy: 5.8,  sur: 3.1, ang: 83.5, dominant: "bar-cyan" }
  ];

  var demoBtn = $("#initialize-demo");
  var emotionValue = $("#emotion-value");
  var emotionConf = $("#emotion-conf");
  var emotionCard = $("#emotion-card");
  var idStatus = $("#id-status");
  var recDot = $("#rec-dot");
  var scanner = $("#scanner-line");
  var boundingBox = $("#bounding-box");
  var sysStatus = $("#sys-status");
  var latencyValue = $("#latency-value");
  var exportBtn = $("#export-log");
  var bars = $("#bars");

  var demoRunning = false;
  var demoInterval = null;
  var log = [];

  function setEmotion(e, logEntry) {
    emotionValue.textContent = e.name;
    emotionConf.textContent = "CONFIDENCE: " + e.conf.toFixed(1) + "%";
    emotionCard.style.opacity = "0.55";
    setTimeout(function () { emotionCard.style.opacity = "1"; }, 120);

    if (bars) {
      var fills = $$(".bar-fill", bars);
      var rowMeta = $$(".bar-meta .bar-pct", bars);
      var values = [e.violet, e.cyan, e.happy, e.sur, e.ang];
      fills.forEach(function (f, i) { f.style.setProperty("--w", values[i] + "%"); });
      rowMeta.forEach(function (r, i) { r.textContent = values[i].toFixed(1) + "%"; });
    }
    if (logEntry) {
      log.push({ ts: new Date().toISOString(), emotion: e.name, confidence: e.conf.toFixed(1) + "%", latencyMs: logEntry.latency });
    }
  }

  function startDemo() {
    if (demoRunning) return;
    demoRunning = true;
    if (demoBtn) {
      demoBtn.textContent = "Terminate Demo";
      demoBtn.classList.add("is-live");
    }
    if (recDot) recDot.classList.add("live");
    if (scanner) scanner.classList.add("scanning");
    if (boundingBox) boundingBox.classList.add("tracking");
    if (idStatus) idStatus.textContent = "TRACKING";
    if (sysStatus) sysStatus.textContent = "SYS.ACTIVE";
    if (exportBtn) exportBtn.disabled = false;

    var step = 0;
    setEmotion(EMOTIONS[0], { latency: 12 });

    demoInterval = setInterval(function () {
      step += 1;
      var e = EMOTIONS[step % EMOTIONS.length];
      var latency = Math.round(clamp(9 + Math.random() * 9, 8, 18));
      if (latencyValue) latencyValue.textContent = latency;
      setEmotion(e, { latency: latency });
    }, 2600);
  }

  function stopDemo() {
    if (!demoRunning) return;
    demoRunning = false;
    clearInterval(demoInterval);
    demoInterval = null;
    if (demoBtn) { demoBtn.textContent = "Initialize Demo"; demoBtn.classList.remove("is-live"); }
    if (recDot) recDot.classList.remove("live");
    if (scanner) scanner.classList.remove("scanning");
    if (boundingBox) boundingBox.classList.remove("tracking");
    if (idStatus) idStatus.textContent = "ANALYZING";
    if (sysStatus) sysStatus.textContent = "SYS.READY";
    if (latencyValue) latencyValue.textContent = "12";
  }

  if (demoBtn) {
    demoBtn.addEventListener("click", function () {
      if (demoRunning) {
        stopDemo();
        toast("Demo terminated");
      } else {
        startDemo();
        toast("Live demo initialized");
      }
    });
  }

  /* ---------- Export log ---------- */
  function download(name, content, type) {
    var blob = new Blob([content], { type: type || "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 120);
  }

  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.addEventListener("click", function () {
      var lines = ["timestamp,emotion,confidence,latencyMs"];
      log.forEach(function (row) {
        lines.push([row.ts, row.emotion, row.confidence, row.latencyMs].join(","));
      });
      var stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      download("sentient-telemetry-" + stamp + ".csv", lines.join("\n"), "text/csv");
      toast("Telemetry log exported (" + log.length + " samples)");
    });
  }

  /* ---------- Toggle CTA label while live ---------- */
  var btnStyle = document.createElement("style");
  btnStyle.textContent = ".btn-primary.is-live{background:var(--secondary-container);color:var(--on-secondary-container);box-shadow:0 0 15px rgba(220,184,255,0.35);}";
  document.head.appendChild(btnStyle);

  /* ---------- year normalization (kept from spec: 2024) ---------- */
})();
