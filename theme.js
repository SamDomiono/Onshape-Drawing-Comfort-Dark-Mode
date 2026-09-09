(() => {
  "use strict";
  const VERSION = "0.1.1";
  const KEY = "__onshapeComfortExtension01";
  if (Object.prototype.hasOwnProperty.call(window, KEY)) return;
  const id = crypto.randomUUID().slice(0, 8);
  const log = (message, data = {}) =>
    console.log(`[Comfort EXT ${id}] ${message} ${JSON.stringify(data)}`);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const packed = n => Number.isInteger(n) && n >= 0 && n <= 0xFFFFFF;
  const rgb = c => Array.isArray(c) && c.length === 3 &&
    c.every(n => Number.isFinite(n) && n >= 0 && n <= 1);
  let controller = null;
  let stopped = false;
  let timer = null;
  let status = "waiting";
  const started = performance.now();

  function resolve() {
    check(typeof window.getXeApplication === "function", "engine not ready");
    const app = window.getXeApplication();
    const docs = Object.entries(app?.m_XeDocuments ?? {});
    check(docs.length === 1, `expected one document; found ${docs.length}`);
    const [key, doc] = docs[0];
    const dev = doc?.m_XeGsDevice;
    check(typeof dev?.invalidateScene === "function", "scene invalidation not ready");
    const pal = dev?.getPalette?.()?.getPalette?.();
    check(Array.isArray(pal) && pal.length === 256 && packed(pal[7]),
      "palette not ready or unexpected");
    const layout = doc?.m_XeDatabase?.m_XeLayout;
    const paper = layout?.m_Paper;
    check(paper?.m_ClassName === "XeLayoutPaper", "paper not ready");
    const d = Object.getOwnPropertyDescriptor(paper, "m_PaperBackColor");
    check(d && "value" in d && d.writable && packed(d.value),
      "surround field not ready or unexpected");
    const scene = paper.m_Scene;
    check(Array.isArray(scene?.children), "scene not ready");
    const candidates = scene.children.filter(m =>
      m?.material?.shader?.shaderName === "PaperOptimized");
    check(candidates.length === 2 && candidates.every(m =>
      rgb(m.material?.uniforms?.color)), "paper materials not ready or unexpected");
    const sum = m => m.material.uniforms.color.reduce((a, b) => a + b, 0);
    candidates.sort((a, b) => sum(b) - sum(a));
    check(sum(candidates[0]) - sum(candidates[1]) >= 0.1, "ambiguous paper mesh");
    const mesh = candidates[0], material = mesh.material;
    const color = material.uniforms.color;
    const snapshot = () => ({ ink: pal[7], paper: color.slice(),
      surround: paper.m_PaperBackColor });
    const original = snapshot();
    const target = { ink: 0x383D3F, paper: [216/255, 208/255, 188/255],
      surround: 0x5A5750 }; // Surround channel order remains provisional.
    const identity = () => {
      const a = window.getXeApplication();
      return a === app && a?.m_XeDocuments?.[key] === doc &&
        doc.m_XeGsDevice === dev && dev.getPalette().getPalette() === pal &&
        doc.m_XeDatabase?.m_XeLayout === layout && layout.m_Paper === paper &&
        paper.m_Scene === scene && scene.children.includes(mesh) &&
        mesh.material === material && material.uniforms.color === color;
    };
    const write = v => {
      pal[7] = v.ink;
      for (let i = 0; i < 3; i++) color[i] = v.paper[i];
      paper.m_PaperBackColor = v.surround;
    };
    const matches = v => pal[7] === v.ink &&
      v.paper.every((n, i) => color[i] === n) && paper.m_PaperBackColor === v.surround;
    function change(action, values) {
      let before;
      try {
        check(identity(), "renderer identity changed");
        check(typeof dev.invalidateScene === "function", "scene invalidation unavailable");
        before = snapshot();
        write(values);
        check(matches(values), "read-back mismatch");
        status = action === "APPLY" ? "applied" : "restored";
        log(`${action} OK`, { original, current: snapshot(),
          surroundEncoding: "provisional integer 0x5A5750" });
      } catch (error) {
        status = "failed";
        log(`${action} FAILED`, { reason: error.message });
        if (before) {
          const errors = [];
          const undo = fn => { try { fn(); } catch (e) { errors.push(e.message); } };
          undo(() => { pal[7] = before.ink; });
          for (let i = 0; i < 3; i++) undo(() => { color[i] = before.paper[i]; });
          undo(() => { paper.m_PaperBackColor = before.surround; });
          log("ROLLBACK", { verified: matches(before), errors });
        }
        return false;
      }
      // A redraw failure does not undo already-verified color writes.
      try {
        dev.invalidateScene();
        log(`${action} REDRAW REQUESTED`);
        return true;
      } catch (error) {
        log(`${action} REDRAW FAILED`, { reason: error.message,
          colorsVerified: matches(values) });
        return false;
      }
    }
    return { apply: () => change("APPLY", target),
      restore: () => change("RESTORE", original),
      report: () => log("STATE", { status, sameReferences: identity(),
        original, current: snapshot() }) };
  }

  Object.defineProperty(window, KEY, { configurable: true, value: Object.freeze({
    restore() {
      stopped = true;
      clearTimeout(timer);
      if (controller) return controller.restore();
      status = "stopped";
      log("STOPPED; no colors applied");
    },
    report() {
      if (controller) controller.report();
      else log("STATE", { status });
    }
  }) });
  log("BOOT", { version: VERSION, timeOrigin: performance.timeOrigin, startupLimitMs: 60000 });
  function attempt() {
    if (stopped) return;
    try { controller = resolve(); }
    catch (error) {
      if (performance.now() - started >= 60000) {
        status = "timeout";
        log("ABORT; no colors applied", { reason: error.message });
      } else timer = setTimeout(attempt, 500);
      return;
    }
    controller.apply(); // No retries after a mutation attempt.
  }
  attempt();
})();
