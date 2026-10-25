/* Smart crops. Every photo has a focal point (tools/focal.py -> focus-data.js). For any <img> shown with object-fit: cover
   we work out where the box would crop it and slide object-position so the subject, not the sky, stays in view. */
(function () {
  const F = (window.MD && MD.focal) || {};
  const re = /assets\/(?:img|thumb)\/(.+?)\.jpg/;
  const seen = new WeakSet();
  function apply(img) {
    const m = re.exec(img.getAttribute("src") || ""); if (!m) return;
    const f = F[m[1]]; if (!f) return;
    const bw = img.clientWidth, bh = img.clientHeight; if (!bw || !bh) return;
    const iw = f[2], ih = f[3], s = Math.max(bw / iw, bh / ih), w = iw * s, h = ih * s;
    const pos = (box, size, fp) => { const over = size - box; if (over < 1) return 50; const left = Math.min(0, Math.max(-over, box / 2 - fp * size)); return (-left / over) * 100; };
    img.style.objectPosition = `${pos(bw, w, f[0]).toFixed(1)}% ${pos(bh, h, f[1]).toFixed(1)}%`;
  }
  const ro = "ResizeObserver" in window ? new ResizeObserver(es => es.forEach(e => apply(e.target))) : null;
  function watch(img) { if (seen.has(img)) { apply(img); return; } if (!re.test(img.getAttribute("src") || "")) return; seen.add(img); if (ro) ro.observe(img); img.addEventListener("load", () => apply(img)); apply(img); }
  function scan(root) { (root.nodeType === 1 && root.tagName === "IMG" ? [root] : root.querySelectorAll ? root.querySelectorAll("img") : []).forEach(watch); }
  function start() {
    scan(document);
    new MutationObserver(ms => ms.forEach(m => { if (m.type === "attributes") watch(m.target); else m.addedNodes.forEach(n => n.nodeType === 1 && scan(n)); }))
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  }
  window.addEventListener("resize", () => document.querySelectorAll("img").forEach(i => seen.has(i) && apply(i)));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  MD.focus = { apply, scan };
})();

/* Warm the cache while the browser is idle: the builder's thumbnails (about 1.8 MB in all) are fetched a few at a time,
   so lists, cards and the Review page show pictures straight away instead of loading them one by one on scroll. */
(function () {
  const keys = Object.keys((window.MD && MD.focal) || {}).filter(k => k.startsWith("fieldwork/"));
  let i = 0, busy = 0;
  function pump() {
    while (busy < 3 && i < keys.length) { const im = new Image(); busy++; im.decoding = "async"; im.onload = im.onerror = () => { busy--; setTimeout(pump, 40); }; im.src = `assets/thumb/${keys[i++]}.jpg`; }
  }
  const go = () => { try { pump(); } catch (e) { /* warming is optional */ } };
  window.addEventListener("load", () => { if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500); });
})();
