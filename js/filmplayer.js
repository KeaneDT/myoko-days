/* Myoko Days: the full-screen film. A dark room, the picture, and a small translucent control bar that fades away while it plays. */
(function () {
  "use strict";
  const dlg = document.getElementById("filmDialog"), v = document.getElementById("fullFilm");
  if (!dlg || !v) return;
  const stage = document.getElementById("fdStage"), play = document.getElementById("fdPlay"), seek = document.getElementById("fdSeek"), tm = document.getElementById("fdTime");
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  let scrub = false, hideT = 0;

  const paint = () => {
    const d = v.duration || 0;
    if (!scrub) seek.value = d ? Math.round(v.currentTime / d * 1000) : 0;
    seek.style.setProperty("--p", (seek.value / 10) + "%");
    tm.textContent = fmt(v.currentTime) + " / " + fmt(d);
  };
  const state = () => { stage.classList.toggle("is-paused", v.paused); play.setAttribute("aria-label", v.paused ? "Play" : "Pause"); wake(); };
  function wake() {
    stage.classList.add("is-awake"); clearTimeout(hideT);
    if (!v.paused) hideT = setTimeout(() => { if (document.getElementById("fdBar").matches(":hover")) return wake(); stage.classList.remove("is-awake"); }, 2600);
  }
  const toggle = () => { v.paused ? (v.play() || Promise.resolve()).catch(() => {}) : v.pause(); };

  v.addEventListener("timeupdate", paint); v.addEventListener("loadedmetadata", paint); v.addEventListener("durationchange", paint);
  v.addEventListener("play", state); v.addEventListener("pause", state); v.addEventListener("ended", () => { state(); stage.classList.add("is-awake"); });
  play.addEventListener("click", toggle);
  v.addEventListener("click", toggle);
  seek.addEventListener("input", () => { scrub = true; const d = v.duration || 0; if (d) v.currentTime = seek.value / 1000 * d; paint(); });
  seek.addEventListener("change", () => { scrub = false; });
  stage.addEventListener("pointermove", wake); stage.addEventListener("pointerdown", wake); stage.addEventListener("keydown", wake);
  /* a click on the dark room (outside the picture) closes the film */
  dlg.addEventListener("click", e => { if (e.target === dlg || e.target.classList.contains("fd__note")) dlg.close(); });
  dlg.addEventListener("close", () => { try { v.currentTime = 0; } catch (e) {} clearTimeout(hideT); paint(); });
  new MutationObserver(() => { if (dlg.open) { stage.classList.add("is-awake"); state(); paint(); } }).observe(dlg, { attributes: true, attributeFilter: ["open"] });
  state(); paint();
})();
