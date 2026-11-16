/*
 * Hero canvas: a live sketch of the HUSTVA agent graph.
 * Queries enter, pass the guardrail, get routed to the ReAct loop, fan out to tools
 * and come back composed. Some inputs are prompt-injection attempts: they stop at
 * the guard and burst. Colors come from the page's CSS tokens so both themes work.
 */
(function () {
  "use strict";
  var canvas = document.getElementById("hero-graph");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var host = canvas.parentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- theme ---------------------------------------------------------------
  var C = {};
  function readTheme() {
    var s = getComputedStyle(document.documentElement);
    function v(name, fb) { var x = s.getPropertyValue(name).trim(); return x || fb; }
    C.signal = v("--signal", "#5eead4");
    C.agent = v("--agent", "#a78bfa");
    C.guard = v("--guard", "#fbbf24");
    C.fg = v("--fg", "#e8ebf7");
    C.muted = v("--muted", "#9aa3c0");
    C.light = document.documentElement.getAttribute("data-theme") === "light";
  }
  function rgba(color, a) {
    // accepts #rgb / #rrggbb / rgb(...) ; falls back to the raw color
    var c = color.trim();
    if (c[0] === "#") {
      var h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
    }
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (m) { var p = m[1].split(","); return "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + a + ")"; }
    return c;
  }
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });

  // ---- graph model (normalized coords inside the graph region) -------------
  var NODES = {
    query:   { x: 0.04, y: 0.52, label: "query",    kind: "fg" },
    guard:   { x: 0.20, y: 0.52, label: "guard",    kind: "guard", r: 1.25 },
    router:  { x: 0.38, y: 0.46, label: "router",   kind: "agent" },
    react:   { x: 0.56, y: 0.34, label: "ReAct",    kind: "agent", r: 1.3 },
    rag:     { x: 0.80, y: 0.12, label: "RAG",      kind: "signal" },
    grades:  { x: 0.90, y: 0.36, label: "grades",   kind: "signal" },
    kms:     { x: 0.80, y: 0.58, label: "KMS",      kind: "signal" },
    compose: { x: 0.56, y: 0.74, label: "compose",  kind: "agent" },
    answer:  { x: 0.80, y: 0.88, label: "answer",   kind: "fg" }
  };
  var EDGES = [
    ["query", "guard"], ["guard", "router"], ["router", "react"],
    ["react", "rag"], ["react", "grades"], ["react", "kms"],
    ["react", "compose"], ["router", "compose"], ["compose", "answer"]
  ];
  var TOOLS = ["rag", "grades", "kms"];
  Object.keys(NODES).forEach(function (k) { NODES[k].pulse = 0; NODES[k].id = k; });

  // ---- layout ----------------------------------------------------------------
  var W = 0, H = 0, dpr = 1, region = { x: 0, y: 0, w: 0, h: 0 }, mobile = false;
  function layout() {
    var rect = host.getBoundingClientRect();
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 860;
    // keep the graph clear of the left-aligned hero text; cap its height so tall screens don't stretch it
    if (mobile) {
      var mh = Math.min(H * 0.3, 240);
      region = { x: W * 0.5, y: H * 0.03, w: W * 0.46, h: mh };
    } else {
      var gh = Math.min(H * 0.7, 540);
      region = { x: W * 0.58, y: (H - gh) / 2, w: Math.min(W * 0.38, 560), h: gh };
    }
    initStars();
  }
  function P(n) {
    return { x: region.x + n.x * region.w + par.x * (n.x + 0.3), y: region.y + n.y * region.h + par.y * (n.y + 0.3) };
  }
  // quadratic curve control point (gentle bend, alternating sides)
  function ctrl(a, b, i) {
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
    var bend = (i % 2 ? 1 : -1) * 0.12;
    return { x: mx - dy * bend, y: my + dx * bend };
  }
  function edgeIndex(a, b) {
    for (var i = 0; i < EDGES.length; i++) {
      if ((EDGES[i][0] === a && EDGES[i][1] === b) || (EDGES[i][0] === b && EDGES[i][1] === a)) return i;
    }
    return 0;
  }
  function onCurve(a, c, b, t) {
    var u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }

  // ---- ambient stars ----------------------------------------------------------
  var stars = [];
  function initStars() {
    var count = Math.round(Math.min(90, (W * H) / 16000));
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
        r: Math.random() * 1.3 + 0.3, tw: Math.random() * Math.PI * 2 });
    }
  }

  // ---- packets ----------------------------------------------------------------
  var packets = [], bursts = [], spawnTimer = 0;
  function spawn() {
    var threat = Math.random() < 0.22;
    var path;
    if (threat) path = ["query", "guard"];
    else if (Math.random() < 0.25) path = ["query", "guard", "router", "compose", "answer"]; // small talk skips tools
    else {
      var tool = TOOLS[Math.floor(Math.random() * TOOLS.length)];
      path = ["query", "guard", "router", "react", tool, "react", "compose", "answer"];
    }
    packets.push({ path: path, seg: 0, t: 0, threat: threat, speed: 150 + Math.random() * 70, trail: [] });
  }

  function step(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawn(); spawnTimer = 0.45 + Math.random() * 0.5; }

    for (var i = packets.length - 1; i >= 0; i--) {
      var p = packets[i];
      var a = P(NODES[p.path[p.seg]]), b = P(NODES[p.path[p.seg + 1]]);
      var len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      p.t += (p.speed * dt) / len;
      var idx = edgeIndex(p.path[p.seg], p.path[p.seg + 1]);
      var forward = EDGES[idx][0] === p.path[p.seg];
      var c = forward ? ctrl(a, b, idx) : ctrl(b, a, idx);
      var pos = forward ? onCurve(a, c, b, Math.min(p.t, 1)) : onCurve(b, c, a, 1 - Math.min(p.t, 1));
      // threats are stopped just short of the guard
      if (p.threat && p.t >= 0.86) {
        bursts.push({ x: pos.x, y: pos.y, age: 0 });
        NODES.guard.pulse = 1;
        packets.splice(i, 1);
        continue;
      }
      p.trail.push(pos);
      if (p.trail.length > 14) p.trail.shift();
      p.pos = pos;
      if (p.t >= 1) {
        p.seg++; p.t = 0;
        NODES[p.path[p.seg]].pulse = 1;
        if (p.seg >= p.path.length - 1) packets.splice(i, 1);
      }
    }
    for (var j = bursts.length - 1; j >= 0; j--) { bursts[j].age += dt; if (bursts[j].age > 0.9) bursts.splice(j, 1); }
    Object.keys(NODES).forEach(function (k) { NODES[k].pulse = Math.max(0, NODES[k].pulse - dt * 1.6); });
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      st.x += st.vx * dt; st.y += st.vy * dt; st.tw += dt;
      if (st.x < 0) st.x += W; if (st.x > W) st.x -= W;
      if (st.y < 0) st.y += H; if (st.y > H) st.y -= H;
    }
    par.x += (par.tx - par.x) * Math.min(1, dt * 3);
    par.y += (par.ty - par.y) * Math.min(1, dt * 3);
  }

  // ---- drawing ------------------------------------------------------------------
  function colorOf(kind) { return kind === "fg" ? C.muted : C[kind]; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var alphaScale = mobile ? 0.4 : 1;
    var lightK = C.light ? 0.75 : 1;

    // stars + faint constellation lines
    for (var i = 0; i < stars.length; i++) {
      var a = stars[i];
      ctx.fillStyle = rgba(C.fg, (0.25 + 0.25 * Math.sin(a.tw * 1.3)) * (C.light ? 0.35 : 0.6));
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      for (var j = i + 1; j < stars.length; j++) {
        var b = stars[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) {
          ctx.strokeStyle = rgba(C.agent, (1 - d / 110) * 0.12 * lightK);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    ctx.save();
    ctx.globalAlpha = alphaScale;

    // edges
    EDGES.forEach(function (e, i) {
      var A = P(NODES[e[0]]), B = P(NODES[e[1]]), c = ctrl(A, B, i);
      var g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
      g.addColorStop(0, rgba(colorOf(NODES[e[0]].kind), 0.35 * lightK));
      g.addColorStop(1, rgba(colorOf(NODES[e[1]].kind), 0.35 * lightK));
      ctx.strokeStyle = g; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(c.x, c.y, B.x, B.y); ctx.stroke();
    });

    // guard shield arc
    var G = P(NODES.guard), gr = 34 + NODES.guard.pulse * 10;
    ctx.strokeStyle = rgba(C.guard, 0.35 + NODES.guard.pulse * 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(G.x, G.y, gr, -Math.PI * 0.7, Math.PI * 0.7, true); ctx.stroke();
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = rgba(C.guard, 0.25);
    ctx.beginPath(); ctx.arc(G.x, G.y, gr + 9, -Math.PI * 0.7, Math.PI * 0.7, true); ctx.stroke();
    ctx.setLineDash([]);

    // packets
    packets.forEach(function (p) {
      if (!p.pos) return;
      var col = p.threat ? C.guard : (p.path[p.seg + 1] && TOOLS.indexOf(p.path[p.seg + 1]) >= 0 || TOOLS.indexOf(p.path[p.seg]) >= 0 ? C.signal : C.agent);
      for (var k = 0; k < p.trail.length; k++) {
        var tp = p.trail[k], f = k / p.trail.length;
        ctx.fillStyle = rgba(col, f * 0.45);
        ctx.beginPath(); ctx.arc(tp.x, tp.y, 1 + f * 2, 0, Math.PI * 2); ctx.fill();
      }
      var glow = ctx.createRadialGradient(p.pos.x, p.pos.y, 0, p.pos.x, p.pos.y, 12);
      glow.addColorStop(0, rgba(col, 0.9)); glow.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, 12, 0, Math.PI * 2); ctx.fill();
      if (p.threat) {
        ctx.strokeStyle = rgba(C.guard, 0.95); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, 4, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = C.light ? rgba(col, 1) : "rgba(255,255,255,0.95)";
        ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    });

    // bursts (blocked injections)
    bursts.forEach(function (b) {
      var t = b.age / 0.9;
      ctx.strokeStyle = rgba(C.guard, (1 - t) * 0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, 4 + t * 22, 0, Math.PI * 2); ctx.stroke();
      for (var s = 0; s < 6; s++) {
        var ang = (s / 6) * Math.PI * 2 + 0.3, r1 = 6 + t * 10, r2 = 10 + t * 20;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(ang) * r1, b.y + Math.sin(ang) * r1);
        ctx.lineTo(b.x + Math.cos(ang) * r2, b.y + Math.sin(ang) * r2);
        ctx.stroke();
      }
      if (t < 0.6) {
        ctx.fillStyle = rgba(C.guard, (0.6 - t) * 1.4);
        ctx.font = "600 10px 'JetBrains Mono', ui-monospace, monospace";
        ctx.fillText("blocked", b.x - 20, b.y - 20 - t * 14);
      }
    });

    // nodes
    Object.keys(NODES).forEach(function (k) {
      var n = NODES[k], p = P(n), col = colorOf(n.kind), r = 6 * (n.r || 1) + n.pulse * 4;
      var halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      halo.addColorStop(0, rgba(col, (0.28 + n.pulse * 0.35) * lightK)); halo.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(col, 0.95);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(C.fg, C.light ? 0.5 : 0.35); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2); ctx.stroke();
      if (!mobile) {
        ctx.fillStyle = rgba(C.fg, 0.7);
        ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.label, p.x, p.y + r + 20);
        ctx.textAlign = "start";
      }
    });
    ctx.restore();
  }

  // ---- loop, visibility, input ------------------------------------------------
  var par = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", function (e) {
    if (reduce) return;
    par.tx = (e.clientX / window.innerWidth - 0.5) * 18;
    par.ty = (e.clientY / window.innerHeight - 0.5) * 14;
  }, { passive: true });

  var running = false, visible = true, last = 0;
  function frame(ts) {
    if (!running) return;
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    step(dt); draw();
    requestAnimationFrame(frame);
  }
  function setRunning(on) {
    on = on && visible && !document.hidden && !reduce;
    if (on && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    else if (!on) running = false;
  }

  layout();
  if (reduce) {
    // one still, representative frame
    for (var w = 0; w < 6; w++) spawn();
    for (var s = 0; s < 120; s++) step(1 / 30);
    draw();
  } else {
    // pre-warm so the first frame already has traffic on it
    for (var s2 = 0; s2 < 90; s2++) step(1 / 30);
    draw();
  }

  if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); if (!running) draw(); }).observe(host);
  else window.addEventListener("resize", function () { layout(); draw(); });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRunning(true); }).observe(host);
  }
  document.addEventListener("visibilitychange", function () { setRunning(true); });
  setRunning(true);
})();
