/* global d3 */
(function () {
  const E = window.TreeStepEngine;
  const X = window.TreeStepExtra;

  const COLORS = {
    x: "#ea580c",
    y: "#2563eb",
    z: "#9333ea",
    edge: "#d6d3d1",
    text: "#fff",
    rbRed: "#dc2626",
    rbBlk: "#1c1917",
    avl: "#2563eb",
    splay: "#16a34a",
    twofour: "#d97706",
    btree: "#be185d",
    treap: "#7c3aed",
    aa: "#0891b2",
  };

  const MODES = [
    { id: "splay", lab: "Splay" },
    { id: "avl", lab: "AVL" },
    { id: "rb", lab: "RB" },
    { id: "twofour", lab: "2-4" },
    { id: "btree", lab: "B-tree" },
    { id: "treap", lab: "Treap" },
    { id: "aa", lab: "AA" },
  ];

  let mode = "splay";
  let op = "insert";
  let splayRoot = null;
  let avlRoot = null;
  let rbRec = new E.RBRecorder();
  let tfRoot = null;
  let btRoot = null;
  let treapRoot = null;
  let aaRoot = null;

  let steps = [];
  let idx = 0;

  function setMode(m) {
    mode = m;
    document.querySelectorAll("#mode-row .pill").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  }
  function setOp(o) {
    op = o;
    document.querySelectorAll("#op-row .pill").forEach((b) => b.classList.toggle("on", b.dataset.op === o));
  }

  function showErr(msg) {
    const el = document.getElementById("err-box");
    el.textContent = msg;
    el.style.display = msg ? "" : "none";
  }

  function toHierarchyMulti(n, path) {
    if (!n) return null;
    const p = path || [];
    const id = p.length ? p.join("/") : "root";
    const name = n.keys.join(" | ");
    const ch = n.children && n.children.length ? n.children.map((c, i) => toHierarchyMulti(c, [...p, i])) : null;
    return { name, id, keys: n.keys, children: ch };
  }

  function toHierarchyTreap(n) {
    if (!n) return null;
    const ch = [];
    if (n.left) ch.push(toHierarchyTreap(n.left));
    if (n.right) ch.push(toHierarchyTreap(n.right));
    return {
      name: String(n.key),
      id: String(n.key),
      key: n.key,
      p: n.p,
      color: COLORS.treap,
      children: ch.length ? ch : null,
    };
  }

  function toHierarchyAA(n) {
    if (!n) return null;
    const ch = [];
    if (n.left) ch.push(toHierarchyAA(n.left));
    if (n.right) ch.push(toHierarchyAA(n.right));
    return {
      name: `${n.key}·L${n.level}`,
      id: String(n.key),
      key: n.key,
      color: COLORS.aa,
      children: ch.length ? ch : null,
    };
  }

  function layoutSnapshot(snap, kind) {
    if (!snap) return { nodes: [], edges: [], ox: 40, oy: 40, W: 400, H: 180 };
    if (snap.type === "twofour" || snap.type === "btree") {
      const root = snap.root ? toHierarchyMulti(snap.root, []) : null;
      if (!root) return { nodes: [], edges: [], ox: 40, oy: 40, W: 400, H: 180 };
      const h = d3.hierarchy(root, (d) => d.children);
      const layout = d3.tree().nodeSize([70, 62])(h);
      const nodes = [];
      const edges = [];
      layout.each((d) => {
        const w = Math.max(44, d.data.name.length * 7 + 16);
        nodes.push({
          id: d.data.id,
          x: d.x,
          y: d.y,
          w,
          h: 24,
          label: d.data.name,
          color: kind === "twofour" ? COLORS.twofour : COLORS.btree,
        });
      });
      layout.links().forEach((l) => {
        edges.push({ x1: l.source.x, y1: l.source.y, x2: l.target.x, y2: l.target.y });
      });
      const xs = nodes.map((n) => n.x),
        ys = nodes.map((n) => n.y);
      const pad = 48;
      const minX = Math.min(...xs),
        maxX = Math.max(...xs);
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);
      const W = Math.max(maxX - minX + pad * 2, 320);
      const H = Math.max(maxY - minY + pad * 2, 200);
      const ox = -minX + pad,
        oy = -minY + pad;
      return { nodes, edges, ox, oy, W, H, multi: true };
    }
    if (snap.type === "treap" || snap.type === "aa") {
      if (!snap.root) return { nodes: [], edges: [], ox: 40, oy: 40, W: 400, H: 180 };
      const conv = snap.type === "treap" ? toHierarchyTreap(snap.root) : toHierarchyAA(snap.root);
      if (!conv) return { nodes: [], edges: [], ox: 40, oy: 40, W: 400, H: 180 };
      const h = d3.hierarchy(conv, (d) => d.children);
      const layout = d3.tree().nodeSize([38, 58])(h);
      const nodes = [];
      const edges = [];
      layout.each((d) => {
        nodes.push({
          id: d.data.id,
          key: d.data.key,
          x: d.x,
          y: d.y,
          color: d.data.color,
          label: kind === "treap" ? String(d.data.key) : d.data.name,
        });
      });
      layout.links().forEach((l) => {
        edges.push({ x1: l.source.x, y1: l.source.y, x2: l.target.x, y2: l.target.y });
      });
      const xs = nodes.map((n) => n.x),
        ys = nodes.map((n) => n.y);
      const pad = 40;
      const minX = Math.min(...xs),
        maxX = Math.max(...xs);
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);
      const W = Math.max(maxX - minX + pad * 2, 320);
      const H = Math.max(maxY - minY + pad * 2, 200);
      const ox = -minX + pad,
        oy = -minY + pad;
      return { nodes, edges, ox, oy, W, H, multi: false };
    }

    const wrap = (node, k) => {
      if (!node) return null;
      const base = { key: node.key, kind: k, raw: node };
      if (k === "rb") {
        base.color = node.color === "RED" ? COLORS.rbRed : COLORS.rbBlk;
      } else if (k === "avl") {
        base.h = node.height;
        base.color = COLORS.avl;
      } else {
        base.color = COLORS.splay;
      }
      base.left = wrap(node.left, k);
      base.right = wrap(node.right, k);
      return base;
    };
    const root = wrap(snap, kind);
    if (!root) return { nodes: [], edges: [], ox: 40, oy: 40, W: 400, H: 180 };
    const h = d3.hierarchy(root, (d) => {
      const c = [];
      if (d.left) c.push(d.left);
      if (d.right) c.push(d.right);
      return c.length ? c : null;
    });
    const layout = d3.tree().nodeSize([36, 58])(h);
    const nodes = [];
    const edges = [];
    layout.each((d) => {
      nodes.push({
        id: String(d.data.key),
        key: d.data.key,
        x: d.x,
        y: d.y,
        color: d.data.color,
      });
    });
    layout.links().forEach((l) => {
      edges.push({ x1: l.source.x, y1: l.source.y, x2: l.target.x, y2: l.target.y });
    });
    const xs = nodes.map((n) => n.x),
      ys = nodes.map((n) => n.y);
    const pad = 40;
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const W = Math.max(maxX - minX + pad * 2, 320);
    const H = Math.max(maxY - minY + pad * 2, 200);
    const ox = -minX + pad,
      oy = -minY + pad;
    return { nodes, edges, ox, oy, W, H, multi: false };
  }

  function drawSnap(svgEl, snap, kind, st) {
    const hx = st && st.x != null ? String(st.x) : null;
    const hy = st && st.y != null ? String(st.y) : null;
    const hz = st && st.z != null ? String(st.z) : null;
    const pathHi = st && st.highlightPath != null ? String(st.highlightPath) : null;

    const { nodes, edges, ox, oy, W, H, multi } = layoutSnapshot(snap, kind);
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${W} ${H}`).attr("height", Math.min(H, 420));
    const g = svg.append("g");

    for (const e of edges) {
      g.append("line")
        .attr("x1", e.x1 + ox)
        .attr("y1", e.y1 + oy)
        .attr("x2", e.x2 + ox)
        .attr("y2", e.y2 + oy)
        .attr("stroke", COLORS.edge)
        .attr("stroke-width", 1.2);
    }

    if (multi) {
      for (const n of nodes) {
        const rw = n.w / 2,
          rh = n.h / 2;
        let stroke = "#fff",
          sw = 1.5;
        if (pathHi && n.id === pathHi) {
          stroke = COLORS.x;
          sw = 3;
        }
        g.append("rect")
          .attr("x", n.x + ox - rw)
          .attr("y", n.y + oy - rh)
          .attr("width", n.w)
          .attr("height", n.h)
          .attr("rx", 5)
          .attr("fill", n.color)
          .attr("stroke", stroke)
          .attr("stroke-width", sw);
        g.append("text")
          .attr("x", n.x + ox)
          .attr("y", n.y + oy + 4)
          .attr("text-anchor", "middle")
          .style("font-family", "monospace")
          .style("font-size", "9px")
          .attr("fill", COLORS.text)
          .text(n.label.length > 14 ? n.label.slice(0, 12) + "…" : n.label);
      }
    } else {
      for (const n of nodes) {
        const id = n.id != null ? String(n.id) : String(n.key);
        let stroke = "#fff",
          sw = 1.5;
        if (pathHi && id === pathHi.split("/").pop()) {
          stroke = COLORS.x;
          sw = 3;
        } else if (id === hx) {
          stroke = COLORS.x;
          sw = 3;
        } else if (id === hy) {
          stroke = COLORS.y;
          sw = 3;
        } else if (hz != null && hz !== "null" && id === hz) {
          stroke = COLORS.z;
          sw = 3;
        }
        g.append("circle")
          .attr("cx", n.x + ox)
          .attr("cy", n.y + oy)
          .attr("r", 14)
          .attr("fill", n.color)
          .attr("stroke", stroke)
          .attr("stroke-width", sw);
        const lab = n.label != null ? n.label : String(n.key);
        g.append("text")
          .attr("x", n.x + ox)
          .attr("y", n.y + oy + 4)
          .attr("text-anchor", "middle")
          .style("font-family", "monospace")
          .style("font-size", "10px")
          .attr("fill", COLORS.text)
          .text(lab.length > 8 ? lab.slice(0, 7) + "…" : lab);
      }
    }

    if (!nodes.length) {
      svg
        .append("text")
        .attr("x", W / 2)
        .attr("y", H / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#a8a29e")
        .style("font-size", "12px")
        .text("Empty");
    }
    const zoom = d3.zoom().scaleExtent([0.12, 6]).on("zoom", (ev) => g.attr("transform", ev.transform));
    svg.call(zoom);
  }

  function explainStep(st) {
    const el = document.getElementById("explain");
    if (!st) {
      el.innerHTML =
        "<h3>Welcome</h3><p>Pick a structure and operation, enter an integer, and press Run. The Dropbox folder you linked is not readable from here; algorithms match this repo’s <code>trees/*.js</code> and standard texts. A Java reference lives under <code>java/tree-steps/</code> (Maven). The live page uses JavaScript for the browser.</p>";
      return;
    }
    const op = st.opLabel || st.op || "—";
    const extra =
      st.highlightPath != null && st.highlightPath !== ""
        ? ` · active path: <code>${st.highlightPath}</code>`
        : "";
    const lines = [
      `<div class="op-tag">${st.title || ""}</div>`,
      `<p><strong>Operation</strong>: ${op}</p>`,
      `<p><strong>Alignment / check</strong>: ${st.alignment || "—"}</p>`,
      `<p>${st.reason || ""}</p>`,
      `<p style="margin-top:8px;font-size:11px;color:#78716c">x=${st.x ?? "—"}, y=${st.y ?? "—"}, z=${st.z ?? "—"}${extra}` +
        (st.uncleColor != null ? ` · uncle: ${st.uncleColor}` : "") +
        (st.sameSide === true ? ` · splay: same side (zig-zig)` : st.sameSide === false ? ` · splay: opposite (zig-zag)` : "") +
        "</p>",
    ];
    el.innerHTML = lines.join("");
  }

  function kindForRender(m) {
    if (m === "rb") return "rb";
    if (m === "avl") return "avl";
    if (m === "twofour") return "twofour";
    if (m === "btree") return "btree";
    if (m === "treap") return "treap";
    if (m === "aa") return "aa";
    return "bst";
  }

  function render() {
    const st = steps[idx];
    document.getElementById("step-meta").textContent = steps.length ? `Step ${idx + 1} / ${steps.length}` : "Step — / —";
    document.getElementById("btn-prev").disabled = idx <= 0;
    document.getElementById("btn-next").disabled = idx >= steps.length - 1;

    const k = kindForRender(mode);

    if (!st) {
      let snap = null;
      if (mode === "splay") snap = E.snapNode(splayRoot, "bst");
      else if (mode === "avl") snap = E.snapNode(avlRoot, "avl");
      else if (mode === "rb") snap = E.snapRB(rbRec.root, rbRec.NIL);
      else if (mode === "twofour") snap = X.snap24Full(tfRoot);
      else if (mode === "btree") snap = X.snapBTFull(btRoot);
      else if (mode === "treap") snap = { type: "treap", root: X.snapTreap(treapRoot) };
      else if (mode === "aa") snap = { type: "aa", root: X.snapAA(aaRoot) };
      drawSnap(document.getElementById("svg-before"), snap, k, null);
      drawSnap(document.getElementById("svg-after"), snap, k, null);
      explainStep(null);
      return;
    }

    const rk = st.kind === "rb" ? "rb" : st.kind === "avl" ? "avl" : st.kind === "twofour" ? "twofour" : st.kind === "btree" ? "btree" : st.kind === "treap" ? "treap" : st.kind === "aa" ? "aa" : "bst";
    drawSnap(document.getElementById("svg-before"), st.before, rk, st);
    drawSnap(document.getElementById("svg-after"), st.after, rk, st);
    explainStep(st);
  }

  function run() {
    showErr("");
    const v = parseInt(document.getElementById("val-input").value, 10);
    if (Number.isNaN(v)) {
      showErr("Enter an integer key.");
      return;
    }

    let res;
    if (mode === "splay") {
      const root = E.cloneSplay(splayRoot);
      res = op === "insert" ? E.buildSplayInsertSteps(root, v) : E.buildSplayLookupSteps(root, v);
      if (res.ok) splayRoot = E.cloneSplay(res.finalRoot);
    } else if (mode === "avl") {
      const root = E.cloneAVL(avlRoot);
      res = op === "insert" ? E.buildAVLInsertSteps(root, v) : E.buildAVLLookupSteps(root, v);
      if (res.ok) avlRoot = E.cloneAVL(res.finalRoot);
    } else if (mode === "rb") {
      const rec = E.cloneRBRecorder(rbRec);
      res = op === "insert" ? E.buildRBInsertStepsFrom(rec, v) : E.buildRBLookupSteps(rec, v);
      if (res.ok) rbRec = rec;
    } else if (mode === "twofour") {
      const root = X.clone24(tfRoot);
      res = op === "insert" ? X.buildTwoFourInsertSteps(root, v) : X.buildTwoFourLookupSteps(root, v);
      if (res.ok) tfRoot = X.clone24(res.finalRoot);
    } else if (mode === "btree") {
      const root = X.cloneBT(btRoot);
      res = op === "insert" ? X.buildBTreeInsertSteps(root, v) : X.buildBTreeLookupSteps(root, v);
      if (res.ok) btRoot = X.cloneBT(res.finalRoot);
    } else if (mode === "treap") {
      const root = X.cloneTreap(treapRoot);
      res = op === "insert" ? X.buildTreapInsertSteps(root, v) : X.buildTreapLookupSteps(root, v);
      if (res.ok) treapRoot = X.cloneTreap(res.finalRoot);
    } else if (mode === "aa") {
      const root = X.cloneAA(aaRoot);
      res = op === "insert" ? X.buildAAInsertSteps(root, v) : X.buildAALookupSteps(root, v);
      if (res.ok) aaRoot = X.cloneAA(res.finalRoot);
    }

    if (!res.ok) {
      showErr(res.error || "Operation failed.");
      steps = [];
      idx = 0;
      render();
      return;
    }
    steps = res.steps;
    idx = 0;
    render();
  }

  function reset() {
    splayRoot = null;
    avlRoot = null;
    rbRec = new E.RBRecorder();
    tfRoot = null;
    btRoot = null;
    treapRoot = null;
    aaRoot = null;
    steps = [];
    idx = 0;
    showErr("");
    render();
  }

  document.getElementById("mode-row").innerHTML = MODES.map(
    (m) => `<button type="button" class="pill${m.id === "splay" ? " on" : ""}" data-mode="${m.id}">${m.lab}</button>`,
  ).join("");
  document.getElementById("mode-row").querySelectorAll(".pill").forEach((b) => {
    b.onclick = () => {
      setMode(b.dataset.mode);
      reset();
    };
  });

  document.getElementById("op-row").innerHTML = ["insert", "lookup"]
    .map((o) => `<button type="button" class="pill${o === "insert" ? " on" : ""}" data-op="${o}">${o === "insert" ? "Insert" : "Lookup"}</button>`)
    .join("");
  document.getElementById("op-row").querySelectorAll(".pill").forEach((b) => {
    b.onclick = () => setOp(b.dataset.op);
  });

  document.getElementById("btn-go").onclick = run;
  document.getElementById("val-input").onkeydown = (e) => {
    if (e.key === "Enter") run();
  };
  document.getElementById("btn-reset").onclick = reset;
  document.getElementById("btn-prev").onclick = () => {
    if (idx > 0) {
      idx--;
      render();
    }
  };
  document.getElementById("btn-next").onclick = () => {
    if (idx < steps.length - 1) {
      idx++;
      render();
    }
  };

  render();
})();
