(() => {
  const $ = (id) => document.getElementById(id);
  const object = $("motion-object");
  const shadow = $("object-shadow");
  const stage = $("stage-wrap");
  const track = $("track");
  const recordBtn = $("record-btn");
  const pauseBtn = $("pause-btn");
  const stopBtn = $("stop-btn");
  const exportDialog = $("export-dialog");
  let mode = "solid";
  let recording = false;
  let paused = false;
  let duration = 2000;
  let startedAt = 0;
  let pausedTotal = 0;
  let pausedAt = 0;
  let playFrame = null;
  let playing = false;
  let playStart = 0;
  let playOffset = 0;
  let dragging = false;
  let dragPoint = null;
  let resizing = null;
  let toastTimer;
  let keyframes = [];
  let currentTime = 0;

  const n = (id) => Number($(id).value) || 0;
  const rgbAlpha = (hex, alpha) => {
    const h = hex.replace("#", "");
    return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${alpha})`;
  };
  const cssFill = () =>
    mode === "solid"
      ? $("color-input").value
      : `linear-gradient(${n("gradient-angle")}deg, ${$("gradient-a").value}, ${$("gradient-b").value})`;
  const snapshot = (time = now()) => ({
    time,
    fill: cssFill(),
    width: n("width"),
    height: n("height"),
    opacity: n("opacity") / 100,
    radius: n("radius"),
    rotate: n("rotate"),
    scale: n("scale") || 1,
    x: n("move-x"),
    y: n("move-y"),
    tiltX: n("tilt-x"),
    tiltY: n("tilt-y"),
    perspective: n("perspective"),
    shadow: $("shadow-toggle").checked,
    shadowBlur: n("shadow-blur"),
    shadowY: n("shadow-y"),
    shadowColor: $("shadow-color").value,
  });
  function now() {
    return recording && !paused
      ? Math.max(0, performance.now() - startedAt - pausedTotal)
      : currentTime;
  }
  function applyFrame(f, animate = false) {
    const tx = f.x || 0,
      ty = f.y || 0;
    object.style.transition = animate ? "none" : "";
    object.style.background = f.fill;
    object.style.opacity = f.opacity;
    object.style.borderRadius = `${f.radius}px`;
    object.style.width = `${f.width}px`;
    object.style.height = `${f.height}px`;
    object.style.transform = `perspective(${f.perspective}px) translate(${tx}px, ${ty}px) rotate(${f.rotate}deg) scale(${f.scale}) rotateX(${f.tiltX}deg) rotateY(${f.tiltY}deg)`;
    object.style.perspective = `${f.perspective}px`;
    object.style.boxShadow = f.shadow
      ? `0 ${f.shadowY}px ${f.shadowBlur}px ${rgbAlpha(f.shadowColor, 0.28)}`
      : "none";
    shadow.style.filter = f.shadow
      ? `drop-shadow(0 ${Math.max(0, f.shadowY / 2)}px ${Math.max(0, f.shadowBlur / 2)}px ${rgbAlpha(f.shadowColor, 0.13)})`
      : "none";
    $("coordinates").innerHTML = `X ${tx}&nbsp;&nbsp; Y ${ty}`;
    $("opacity-value").textContent = `${Math.round(f.opacity * 100)}%`;
    $("radius-value").textContent = `${f.radius} px`;
    $("tilt-x-value").textContent = `${f.tiltX}\u00b0`;
    $("tilt-y-value").textContent = `${f.tiltY}\u00b0`;
    $("perspective-value").textContent = `${f.perspective} px`;
    $("size-summary").textContent = `Rectangle \u00b7 ${Math.round(f.width)} \u00d7 ${Math.round(f.height)}`;
  }
  function updateUI() {
    const f = snapshot();
    applyFrame(f);
    $("solid-swatch").style.background = $("color-input").value;
    document.querySelector(".layer-mini").style.background = cssFill();
  }
  function addKeyframe() {
    if (!recording || paused) return;
    const frame = snapshot(now());
    const existing = keyframes.findIndex(
      (k) => Math.abs(k.time - frame.time) < 85,
    );
    if (existing >= 0) keyframes[existing] = frame;
    else keyframes.push(frame);
    keyframes.sort((a, b) => a.time - b.time);
    renderMarkers();
  }
  function renderMarkers() {
    track.querySelectorAll(".recorded-marker").forEach((el) => el.remove());
    keyframes.forEach((f, i) => {
      const marker = document.createElement("div");
      marker.className = "keyframe-marker recorded-marker";
      marker.style.left = `${duration ? Math.min(100, (f.time / duration) * 100) : 0}%`;
      marker.title = `${(f.time / 1000).toFixed(2)}s`;
      if (i === 0) marker.style.background = "#a89cff";
      track.append(marker);
    });
    $("timeline-subtitle").textContent = keyframes.length
      ? `${keyframes.length} keyframe${keyframes.length === 1 ? "" : "s"} captured`
      : "Record your first keyframe";
  }
  function setProgress(time) {
    currentTime = Math.max(0, Math.min(duration, time));
    $("playhead").style.left =
      `${duration ? (currentTime / duration) * 100 : 0}%`;
    $("current-time").textContent = (currentTime / 1000).toFixed(2);
  }
  function paintRecording() {
    if (!recording || paused) return;
    const t = now();
    if (t >= duration) {
      duration = Math.min(10000, Math.ceil((t + 200) / 200) * 200);
      updateDuration();
    }
    setProgress(Math.min(t, duration));
    playFrame = requestAnimationFrame(paintRecording);
  }
  function startRecording() {
    stopPlayback();
    recording = true;
    paused = false;
    keyframes = [];
    currentTime = 0;
    pausedTotal = 0;
    startedAt = performance.now();
    document.body.classList.add("recording");
    recordBtn.hidden = true;
    pauseBtn.hidden = false;
    stopBtn.hidden = false;
    $("pause-label").textContent = "Pause";
    $("pause-icon").textContent = "\u2161";
    $("timeline-subtitle").textContent = "Recording your changes\u2026";
    addKeyframe();
    paintRecording();
    toast("Recording started \u2014 go ahead and change things.");
  }
  function pauseRecording() {
    if (!recording) return;
    if (!paused) {
      paused = true;
      pausedAt = performance.now();
      cancelAnimationFrame(playFrame);
      setProgress(Math.max(0, pausedAt - startedAt - pausedTotal));
      $("pause-label").textContent = "Resume";
      $("pause-icon").textContent = "\u25b6";
      toast("Recording paused.");
    } else {
      paused = false;
      pausedTotal += performance.now() - pausedAt;
      $("pause-label").textContent = "Pause";
      $("pause-icon").textContent = "\u2161";
      toast("Recording resumed.");
      playFrame = requestAnimationFrame(paintRecording);
    }
  }
  function stopRecording() {
    if (!recording) return;
    const elapsed = paused ? currentTime : now();
    if (elapsed > 0) {
      const frame = snapshot(elapsed);
      const last = keyframes[keyframes.length - 1];
      if (!last || elapsed - last.time > 30) keyframes.push(frame);
      else keyframes[keyframes.length - 1] = frame;
    }
    recording = false;
    paused = false;
    cancelAnimationFrame(playFrame);
    document.body.classList.remove("recording");
    recordBtn.hidden = false;
    pauseBtn.hidden = true;
    stopBtn.hidden = true;
    duration = Math.max(700, Math.ceil(Math.max(elapsed, 500) / 100) * 100);
    updateDuration();
    renderMarkers();
    setProgress(Math.min(elapsed, duration));
    $("timeline-subtitle").textContent =
      `${keyframes.length} keyframe${keyframes.length === 1 ? "" : "s"} captured`;
    toast(
      `${keyframes.length} keyframe${keyframes.length === 1 ? "" : "s"} saved. Your CSS is ready.`,
    );
    openExport();
  }
  function updateDuration() {
    $("duration-label").textContent = `${(duration / 1000).toFixed(1)}s`;
    $("total-time").textContent = `${(duration / 1000).toFixed(2)}s`;
    const labels = $("ruler").children;
    for (let i = 0; i < labels.length; i++)
      labels[i].textContent = `${((duration / 4000) * i).toFixed(1)}s`;
    renderMarkers();
  }
  function toast(message) {
    const t = $("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2300);
  }
  function toCss() {
    let frames = keyframes.length
      ? keyframes.slice()
      : [snapshot(0), snapshot(duration)];
    if (frames.length === 1)
      frames = [frames[0], { ...frames[0], time: duration }];
    const max = Math.max(...frames.map((f) => f.time), 1);
    const body = frames
      .map((f) => {
        const pct = Math.max(0, Math.min(100, (f.time / max) * 100));
        const shadowValue = f.shadow
          ? `0 ${f.shadowY}px ${f.shadowBlur}px ${rgbAlpha(f.shadowColor, 0.28)}`
          : "none";
      return `  ${pct.toFixed(1)}% {\n    width: ${f.width}px;\n    height: ${f.height}px;\n    background: ${f.fill};\n    opacity: ${Number(f.opacity.toFixed(2))};\n    border-radius: ${f.radius}px;\n    transform: perspective(${f.perspective}px) translate(${f.x}px, ${f.y}px) rotate(${f.rotate}deg) scale(${Number(f.scale.toFixed(2))}) rotateX(${f.tiltX}deg) rotateY(${f.tiltY}deg);\n    box-shadow: ${shadowValue};\n  }`;
      })
      .join("\n");
    const animationName = cssAnimationName($("animation-title").value);
    return `/* Add the class "animated-shape" to your element. */\n.animated-shape {\n  animation: ${animationName} ${(duration / 1000).toFixed(2)}s ${$("easing").value} ${$("direction").value} infinite;\n  transform-style: preserve-3d;\n  perspective: ${n("perspective")}px;\n}\n\n@keyframes ${animationName} {\n${body}\n}`;
  }
  function cssAnimationName(title) {
    const slug = title.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    return slug && /^[a-z_]/.test(slug) ? slug : `animation-${slug || "motion"}`;
  }
  function commitTitle() {
    const title = $("animation-title").value.trim() || "Untitled animation";
    $("animation-title").value = title;
    document.title = `${title} \u2014 Motion Studio`;
    if (exportDialog.open) $("css-output").textContent = toCss();
  }
  function openExport() {
    $("css-output").textContent = toCss();
    if (!exportDialog.open) exportDialog.showModal();
  }
  function stopPlayback() {
    playing = false;
    if (playFrame) cancelAnimationFrame(playFrame);
    playFrame = null;
    $("play-icon").textContent = "\u25b6";
  }
  function frameAt(time) {
    if (!keyframes.length) return snapshot(time);
    const sorted = keyframes.slice().sort((a, b) => a.time - b.time);
    if (time <= sorted[0].time) return sorted[0];
    if (time >= sorted[sorted.length - 1].time)
      return sorted[sorted.length - 1];
    let i = 0;
    while (sorted[i + 1].time < time) i++;
    const a = sorted[i],
      b = sorted[i + 1],
      p = (time - a.time) / (b.time - a.time);
    const out = { ...a, time };
    for (const k of [
      "opacity",
      "width",
      "height",
      "radius",
      "rotate",
      "scale",
      "x",
      "y",
      "tiltX",
      "tiltY",
      "perspective",
      "shadowBlur",
      "shadowY",
    ])
      out[k] = a[k] + (b[k] - a[k]) * p;
    out.fill = p < 0.5 ? a.fill : b.fill;
    out.shadow = p < 0.5 ? a.shadow : b.shadow;
    out.shadowColor = p < 0.5 ? a.shadowColor : b.shadowColor;
    return out;
  }
  function playTick() {
    if (!playing) return;
    const t = (playOffset + (performance.now() - playStart)) % duration;
    setProgress(t);
    applyFrame(frameAt(t), true);
    playFrame = requestAnimationFrame(playTick);
  }
  function togglePlay() {
    if (playing) {
      stopPlayback();
      return;
    }
    if (recording) {
      toast("Stop recording before previewing.");
      return;
    }
    if (!keyframes.length) {
      keyframes = [
        snapshot(0),
        { ...snapshot(0), time: duration, rotate: 360 },
      ];
      renderMarkers();
    }
    playing = true;
    playOffset = currentTime;
    playStart = performance.now();
    $("play-icon").textContent = "\u2161";
    playTick();
  }
  function colorSync(input, hex) {
    $(hex).value = $(input).value.toUpperCase();
    updateUI();
    addKeyframe();
  }

  document.querySelectorAll(".fill-tab").forEach((btn) =>
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      document
        .querySelectorAll(".fill-tab")
        .forEach((b) => b.classList.toggle("active", b === btn));
      $("solid-field").hidden = mode !== "solid";
      $("gradient-fields").hidden = mode !== "gradient";
      updateUI();
      addKeyframe();
    }),
  );
  $("color-input").addEventListener("input", () =>
    colorSync("color-input", "hex-input"),
  );
  $("hex-input").addEventListener("change", () => {
    if (/^#[0-9a-f]{6}$/i.test($("hex-input").value)) {
      $("color-input").value = $("hex-input").value;
      updateUI();
      addKeyframe();
    }
  });
  [
    ["gradient-a", "gradient-a-hex"],
    ["gradient-b", "gradient-b-hex"],
  ].forEach(([c, h]) => {
    $(c).addEventListener("input", () => colorSync(c, h));
    $(h).addEventListener("change", () => {
      if (/^#[0-9a-f]{6}$/i.test($(h).value)) {
        $(c).value = $(h).value;
        updateUI();
        addKeyframe();
      }
    });
  });
  [
    "gradient-angle",
    "opacity",
    "radius",
    "shadow-toggle",
    "shadow-blur",
    "shadow-y",
    "shadow-color",
    "width",
    "height",
    "rotate",
    "scale",
    "move-x",
    "move-y",
    "tilt-x",
    "tilt-y",
    "perspective",
    "easing",
    "direction",
  ].forEach((id) =>
    $(id).addEventListener("input", () => {
      updateUI();
      addKeyframe();
    }),
  );
  ["shadow-toggle", "easing", "direction"].forEach((id) =>
    $(id).addEventListener("change", () => {
      updateUI();
      addKeyframe();
    }),
  );
  recordBtn.addEventListener("click", startRecording);
  pauseBtn.addEventListener("click", pauseRecording);
  stopBtn.addEventListener("click", stopRecording);
  $("play-btn").addEventListener("click", togglePlay);
  $("rewind-btn").addEventListener("click", () => {
    stopPlayback();
    setProgress(0);
    if (keyframes.length) applyFrame(frameAt(0));
  });
  $("end-btn").addEventListener("click", () => {
    stopPlayback();
    setProgress(duration);
    if (keyframes.length) applyFrame(frameAt(duration));
  });
  $("duration-minus").addEventListener("click", () => {
    duration = Math.max(700, duration - 200);
    updateDuration();
  });
  $("duration-plus").addEventListener("click", () => {
    duration = Math.min(10000, duration + 200);
    updateDuration();
  });
  track.addEventListener("pointerdown", (e) => {
    const rect = track.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * duration;
    if (recording) {
      toast("Stop recording to scrub the timeline.");
      return;
    }
    stopPlayback();
    setProgress(t);
    if (keyframes.length) applyFrame(frameAt(t));
  });
  object.addEventListener("pointerdown", (e) => {
    const handle = e.target.closest("[data-resize]");
    if (handle) {
      e.preventDefault();
      e.stopPropagation();
      resizing = {
        direction: handle.dataset.resize,
        startX: e.clientX,
        startY: e.clientY,
        width: n("width"),
        height: n("height"),
      };
      object.setPointerCapture(e.pointerId);
      return;
    }
    if (recording && paused) return;
    dragging = true;
    dragPoint = { x: e.clientX - n("move-x"), y: e.clientY - n("move-y") };
    object.setPointerCapture(e.pointerId);
  });
  object.addEventListener("pointermove", (e) => {
    if (resizing) {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      const dir = resizing.direction;
      const zoomFactor = zoom / 100;
      if (dir.includes("e")) $("width").value = Math.max(20, Math.min(800, resizing.width + dx / zoomFactor));
      if (dir.includes("w")) $("width").value = Math.max(20, Math.min(800, resizing.width - dx / zoomFactor));
      if (dir.includes("s")) $("height").value = Math.max(20, Math.min(800, resizing.height + dy / zoomFactor));
      if (dir.includes("n")) $("height").value = Math.max(20, Math.min(800, resizing.height - dy / zoomFactor));
      $("width").value = Math.round(n("width"));
      $("height").value = Math.round(n("height"));
      updateUI();
      addKeyframe();
      return;
    }
    if (!dragging) return;
    $("move-x").value = Math.round(e.clientX - dragPoint.x);
    $("move-y").value = Math.round(e.clientY - dragPoint.y);
    updateUI();
    addKeyframe();
  });
  object.addEventListener("pointerup", () => { dragging = false; resizing = null; });
  object.addEventListener("pointercancel", () => { dragging = false; resizing = null; });
  $("grid-toggle").addEventListener("click", () => {
    $("stage-grid").classList.toggle("off");
    $("grid-toggle").classList.toggle("active");
  });
  let zoom = 100;
  function setZoom(v) {
    zoom = Math.max(60, Math.min(140, v));
    $("zoom-value").textContent = `${zoom}%`;
    object.style.zoom = zoom / 100;
  }
  $("zoom-in").addEventListener("click", () => setZoom(zoom + 10));
  $("zoom-out").addEventListener("click", () => setZoom(zoom - 10));
  $("fit-btn").addEventListener("click", () => setZoom(100));
  $("tip-close").addEventListener("click", () =>
    document.querySelector(".tip").remove(),
  );
  $("reset-btn").addEventListener("click", () => {
    if (recording) stopRecording();
    stopPlayback();
    document
      .querySelectorAll(".fill-tab")
      .forEach((b) => b.classList.toggle("active", b.dataset.mode === "solid"));
    mode = "solid";
    $("color-input").value = "#7868f6";
    $("hex-input").value = "#7868F6";
    $("opacity").value = 100;
    $("radius").value = 24;
    $("shadow-toggle").checked = true;
    $("shadow-blur").value = 28;
    $("shadow-y").value = 14;
    $("shadow-color").value = "#6659d9";
    $("rotate").value = 0;
    $("scale").value = 1;
    $("move-x").value = 0;
    $("move-y").value = 0;
    $("tilt-x").value = 0;
    $("tilt-y").value = 0;
    $("perspective").value = 800;
    $("width").value = 160;
    $("height").value = 160;
    keyframes = [];
    duration = 2000;
    updateDuration();
    renderMarkers();
    setProgress(0);
    updateUI();
    toast("Styles reset.");
  });
  ["export-top", "stop-btn"].forEach((id) =>
    $(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") openExport();
    }),
  );
  $("export-top").addEventListener("click", openExport);
  $("animation-title").addEventListener("change", commitTitle);
  $("animation-title").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); $("animation-title").blur(); }
    if (e.key === "Escape") { $("animation-title").value = "Untitled animation"; $("animation-title").blur(); }
  });
  $("animation-title").addEventListener("blur", commitTitle);
  $("close-dialog").addEventListener("click", () => exportDialog.close());
  exportDialog.addEventListener("click", (e) => {
    if (e.target === exportDialog) exportDialog.close();
  });
  $("copy-css").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("css-output").textContent);
      $("copy-css").textContent = "Copied!";
      setTimeout(() => ($("copy-css").textContent = "Copy code"), 1600);
    } catch {
      toast("Clipboard is unavailable in this browser.");
    }
  });
  $("download-css").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toCss()], { type: "text/css" }));
    a.download = "animation.css";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("animation.css downloaded.");
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      openExport();
    }
    if (
      e.code === "Space" &&
      !["INPUT", "SELECT", "BUTTON"].includes(document.activeElement.tagName)
    ) {
      e.preventDefault();
      togglePlay();
    }
  });
  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.addEventListener("wheel", (e) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      const step = Number(input.step) > 0 ? Number(input.step) : 1;
      const precision = (String(step).split(".")[1] || "").length;
      const next = Number(input.value || 0) + (e.deltaY < 0 ? step : -step);
      const bounded = Math.max(input.min === "" ? -Infinity : Number(input.min), Math.min(input.max === "" ? Infinity : Number(input.max), next));
      input.value = bounded.toFixed(precision);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, { passive: false });
  });
  updateDuration();
  updateUI();
})();
