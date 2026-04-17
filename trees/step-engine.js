/**
 * Step-by-step tree operation recorder for educational visualization.
 * Splay: bottom-up splay with zig / zig-zig / zig-zag.
 * AVL: insert with imbalance detection and rotations.
 * Red-Black: insert with recolor and rotations (Cormen-style).
 *
 * Snapshots are plain objects: { key, left, right, height?, color? } (RB uses color RED|BLACK).
 */

function snapNode(n, kind) {
  if (!n) return null;
  if (kind === "rb") {
    return {
      key: n.key,
      color: n.color,
      left: snapNode(n.left, kind),
      right: snapNode(n.right, kind),
    };
  }
  if (kind === "avl") {
    return {
      key: n.key,
      height: n.height,
      left: snapNode(n.left, kind),
      right: snapNode(n.right, kind),
    };
  }
  return {
    key: n.key,
    left: snapNode(n.left, "bst"),
    right: snapNode(n.right, "bst"),
  };
}

function _avlH(n) {
  return n ? n.height : 0;
}
function _avlBF(n) {
  return _avlH(n.left) - _avlH(n.right);
}
function _avlUpd(n) {
  n.height = 1 + Math.max(_avlH(n.left), _avlH(n.right));
}

// ─── Splay (parent pointers, bottom-up) ───────────────────────────────────

function spNew(key) {
  return { key, left: null, right: null, parent: null };
}

function spRoot(x) {
  let n = x;
  while (n.parent) n = n.parent;
  return n;
}

function spRotateRight(y) {
  const x = y.left;
  const p = y.parent;
  y.left = x.right;
  if (x.right) x.right.parent = y;
  x.right = y;
  y.parent = x;
  x.parent = p;
  if (p) {
    if (p.left === y) p.left = x;
    else p.right = x;
  }
  return x;
}

function spRotateLeft(y) {
  const x = y.right;
  const p = y.parent;
  y.right = x.left;
  if (x.left) x.left.parent = y;
  x.left = y;
  y.parent = x;
  x.parent = p;
  if (p) {
    if (p.left === y) p.left = x;
    else p.right = x;
  }
  return x;
}

/** Returns { op, label, alignment, x, y, z } before mutation; applies one splay macro-step. */
function spSplayOneStep(x) {
  const p = x.parent;
  if (!p) {
    return { done: true };
  }
  const g = p.parent;
  const zx = x.key;
  const yy = p.key;
  const zz = g ? g.key : null;

  if (!g) {
    const isZig = x === p.left;
    const op = isZig ? "zig" : "zag";
    const opLabel = isZig ? "zig at y (parent is root)" : "zag at y (parent is root)";
    const side = isZig
      ? "x is the left child of the root parent"
      : "x is the right child of the root parent";
    const alignment = "N/A — there is no grandparent (parent is the tree root).";
    if (isZig) spRotateRight(p);
    else spRotateLeft(p);
    return {
      done: false,
      op,
      opLabel,
      alignment,
      sameSide: null,
      reason: `${side}. A single ${op} at y moves x toward the root (no grandparent, so not zig-zig or zig-zag).`,
      x: zx,
      y: yy,
      z: null,
    };
  }

  const sameSide =
    (x === p.left && p === g.left) || (x === p.right && p === g.right);
  let op;
  let opLabel;
  let alignment;
  let reason;

  if (sameSide) {
    op = "zig-zig";
    if (x === p.left) {
      opLabel = "zig-zig (zig at z, then zig at parent of x)";
      alignment =
        "Same side: x is the left child of y, and y is the left child of z (left–left chain).";
      reason =
        "Both x and y lie on the same side of their parents (both left). Zig-zig applies: two zigs in a row along that spine.";
      spRotateRight(g);
      spRotateRight(x.parent);
    } else {
      opLabel = "zig-zig (zag at z, then zag at parent of x)";
      alignment =
        "Same side: x is the right child of y, and y is the right child of z (right–right chain).";
      reason =
        "Both x and y lie on the same side of their parents (both right). Symmetric zig-zig: two zags in a row.";
      spRotateLeft(g);
      spRotateLeft(x.parent);
    }
  } else {
    op = "zig-zag";
    if (x === p.left) {
      opLabel = "zig-zag (zig at y, then zag at former grandparent)";
      alignment =
        "Opposite sides: x is the left child of y, but y is the right child of z (right–left pattern).";
      reason =
        "x and y are on opposite sides relative to z: first a zig at y to lift x, then a zag at the former grandparent.";
      spRotateRight(p);
      spRotateLeft(x.parent);
    } else {
      opLabel = "zig-zag (zag at y, then zig at former grandparent)";
      alignment =
        "Opposite sides: x is the right child of y, but y is the left child of z (left–right pattern).";
      reason =
        "Zig-zag: first a zag at y to lift x, then a zig at the former grandparent.";
      spRotateLeft(p);
      spRotateRight(x.parent);
    }
  }

  return {
    done: false,
    op,
    opLabel,
    alignment,
    sameSide,
    reason,
    x: zx,
    y: yy,
    z: zz,
  };
}

function spFind(root, key) {
  let cur = root;
  let last = null;
  while (cur) {
    last = cur;
    if (key === cur.key) return { node: cur, last, found: true };
    cur = key < cur.key ? cur.left : cur.right;
  }
  return { node: null, last, found: false };
}

function spInsertNode(root, key) {
  if (!root) {
    const n = spNew(key);
    return { root: n, inserted: n, duplicate: false };
  }
  let cur = root;
  while (true) {
    if (key === cur.key) return { root, inserted: null, duplicate: true };
    if (key < cur.key) {
      if (!cur.left) {
        const n = spNew(key);
        n.parent = cur;
        cur.left = n;
        return { root: spRoot(cur), inserted: n, duplicate: false };
      }
      cur = cur.left;
    } else {
      if (!cur.right) {
        const n = spNew(key);
        n.parent = cur;
        cur.right = n;
        return { root: spRoot(cur), inserted: n, duplicate: false };
      }
      cur = cur.right;
    }
  }
}

/**
 * Build splay steps: phases 'insert' | 'splay'. Each step: { phase, title, before, after, op, ... }
 */
function buildSplayInsertSteps(initialRoot, key) {
  const steps = [];
  const before0 = snapNode(initialRoot, "bst");
  let root = initialRoot;

  const ins = spInsertNode(root, key);
  if (ins.duplicate) {
    return {
      ok: false,
      error: `Duplicate key ${key} — not inserted.`,
      steps: [],
      finalRoot: initialRoot,
    };
  }
  root = ins.root;
  const inserted = ins.inserted;

  steps.push({
    kind: "splay",
    phase: "insert",
    title: "BST insert",
    op: "insert",
    opLabel: "attach new leaf",
    alignment: "—",
    reason: `Insert ${key} as a new leaf in the BST (standard search, then attach).`,
    x: key,
    y: inserted.parent ? inserted.parent.key : null,
    z: null,
    before: before0,
    after: snapNode(root, "bst"),
  });

  let x = inserted;
  while (x.parent) {
    const snapBefore = snapNode(spRoot(x), "bst");
    const meta = spSplayOneStep(x);
    const snapAfter = snapNode(spRoot(inserted), "bst");
    steps.push({
      kind: "splay",
      phase: "splay",
      title: "Splay step",
      op: meta.op,
      opLabel: meta.opLabel,
      alignment: meta.alignment,
      sameSide: meta.sameSide,
      reason: meta.reason,
      x: meta.x,
      y: meta.y,
      z: meta.z,
      before: snapBefore,
      after: snapAfter,
    });
  }

  return { ok: true, steps, finalRoot: spRoot(inserted) };
}

function buildSplayLookupSteps(initialRoot, key) {
  const steps = [];
  if (!initialRoot) {
    return {
      ok: false,
      error: "Tree is empty — nothing to look up.",
      steps: [],
      finalRoot: null,
    };
  }

  const { node, last, found } = spFind(initialRoot, key);
  const target = found ? node : last;
  if (!target) {
    return {
      ok: false,
      error: "Tree is empty.",
      steps: [],
      finalRoot: initialRoot,
    };
  }

  steps.push({
    kind: "splay",
    phase: "lookup",
    title: found ? "Search: key found" : "Search: key not found (splay last visited)",
    op: "search",
    opLabel: found ? "found node to splay" : "splay predecessor/successor leaf",
    alignment: "—",
    reason: found
      ? `Found ${key}. We splay this node to the root.`
      : `${key} is not in the tree; we splay the last node on the search path (standard splay-tree lookup).`,
    x: target.key,
    y: target.parent ? target.parent.key : null,
    z: null,
    before: snapNode(initialRoot, "bst"),
    after: snapNode(initialRoot, "bst"),
  });

  let x = target;
  while (x.parent) {
    const snapBefore = snapNode(spRoot(x), "bst");
    const meta = spSplayOneStep(x);
    const snapAfter = snapNode(spRoot(target), "bst");
    steps.push({
      kind: "splay",
      phase: "splay",
      title: "Splay step",
      op: meta.op,
      opLabel: meta.opLabel,
      alignment: meta.alignment,
      sameSide: meta.sameSide,
      reason: meta.reason,
      x: meta.x,
      y: meta.y,
      z: meta.z,
      before: snapBefore,
      after: snapAfter,
    });
  }

  return { ok: true, steps, finalRoot: spRoot(target) };
}

function cloneSplay(root) {
  if (!root) return null;
  const n = spNew(root.key);
  if (root.left) {
    n.left = cloneSplay(root.left);
    n.left.parent = n;
  }
  if (root.right) {
    n.right = cloneSplay(root.right);
    n.right.parent = n;
  }
  return n;
}

// ─── AVL ───────────────────────────────────────────────────────────────────

function avlRotR(y) {
  const x = y.left;
  const t = x.right;
  x.right = y;
  y.left = t;
  _avlUpd(y);
  _avlUpd(x);
  return x;
}
function avlRotL(x) {
  const y = x.right;
  const t = y.left;
  y.left = x;
  x.right = t;
  _avlUpd(x);
  _avlUpd(y);
  return y;
}

function avlBalance(z) {
  _avlUpd(z);
  const bf = _avlBF(z);
  if (bf > 1) {
    const leftBf = _avlBF(z.left);
    let rot = "LL";
    if (leftBf < 0) {
      z.left = avlRotL(z.left);
      rot = "LR";
    }
    return { newTop: avlRotR(z), type: rot };
  }
  if (bf < -1) {
    const rightBf = _avlBF(z.right);
    let rot = "RR";
    if (rightBf > 0) {
      z.right = avlRotR(z.right);
      rot = "RL";
    }
    return { newTop: avlRotL(z), type: rot };
  }
  return { newTop: z, type: null };
}

function cloneAVL(root) {
  if (!root) return null;
  return {
    key: root.key,
    height: root.height,
    left: cloneAVL(root.left),
    right: cloneAVL(root.right),
  };
}

// ─── Red-Black (Cormen, parent pointers, sentinel NIL) ─────────────────────

function rbNIL() {
  const n = {};
  n.key = 0;
  n.color = "BLACK";
  n.isNIL = true;
  n.left = n;
  n.right = n;
  n.parent = n;
  return n;
}

function rbNode(key, NIL) {
  return {
    key,
    color: "RED",
    left: NIL,
    right: NIL,
    parent: NIL,
    isNIL: false,
  };
}

function snapRB(root, NIL) {
  if (!root || root.isNIL) return null;
  return {
    key: root.key,
    color: root.color,
    left: snapRB(root.left, NIL),
    right: snapRB(root.right, NIL),
  };
}

class RBRecorder {
  constructor() {
    this.NIL = rbNIL();
    this.root = this.NIL;
    this.steps = [];
  }

  cloneTree() {
    const map = new Map();
    const NIL = rbNIL();
    const cloneNd = (n) => {
      if (!n || n.isNIL) return NIL;
      if (map.has(n.key)) return map.get(n.key);
      const c = rbNode(n.key, NIL);
      c.color = n.color;
      map.set(n.key, c);
      c.left = cloneNd(n.left);
      c.right = cloneNd(n.right);
      if (!c.left.isNIL) c.left.parent = c;
      if (!c.right.isNIL) c.right.parent = c;
      return c;
    };
    const r = this.root.isNIL ? NIL : cloneNd(this.root);
    if (!r.isNIL) r.parent = NIL;
    const copy = new RBRecorder();
    copy.NIL = NIL;
    copy.root = r;
    return copy;
  }

  rotateL(x) {
    const y = x.right;
    x.right = y.left;
    if (!y.left.isNIL) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent.isNIL) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  rotateR(y) {
    const x = y.left;
    y.left = x.right;
    if (!x.right.isNIL) x.right.parent = y;
    x.parent = y.parent;
    if (y.parent.isNIL) this.root = x;
    else if (y === y.parent.right) y.parent.right = x;
    else y.parent.left = x;
    x.right = y;
    y.parent = x;
  }

  insertWithSteps(key) {
    this.steps = [];
    const NIL = this.NIL;
    const treeBeforeInsert = snapRB(this.root, NIL);
    let y = NIL;
    let x = this.root;
    while (!x.isNIL) {
      y = x;
      if (key < x.key) x = x.left;
      else if (key > x.key) x = x.right;
      else {
        return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: this.root };
      }
    }
    const z = rbNode(key, NIL);
    z.parent = y;
    if (y.isNIL) this.root = z;
    else if (key < y.key) y.left = z;
    else y.right = z;

    this.steps.push({
      kind: "rb",
      phase: "insert",
      title: "BST insert (new RED leaf)",
      op: "insert",
      opLabel: "attach red node",
      alignment: "—",
      reason: `Insert ${key} as a red leaf. If the parent is red, we fix the double-red violation next.`,
      x: key,
      y: y.isNIL ? null : y.key,
      z: y.isNIL ? null : y.key,
      uncleColor: null,
      before: treeBeforeInsert,
      after: snapRB(this.root, NIL),
    });

    this.insertFixRecord(z);
    return { ok: true, steps: this.steps, finalRoot: this.root };
  }

  insertFixRecord(z0) {
    const NIL = this.NIL;
    let z = z0;
    while (z.parent.color === "RED") {
      if (z.parent === z.parent.parent.left) {
        const uncle = z.parent.parent.right;
        if (uncle.color === "RED") {
          const before = snapRB(this.root, NIL);
          this.steps.push({
            kind: "rb",
            phase: "fixup",
            title: "Red parent, red uncle",
            op: "recolor",
            opLabel: "recolor parent, uncle, grandparent",
            alignment: `Uncle (${uncle.key}) is RED — recolor instead of rotating.`,
            reason: `Parent (${z.parent.key}) and uncle (${uncle.key}) both RED; push black down from grandparent (${z.parent.parent.key}).`,
            x: z.key,
            y: z.parent.key,
            z: z.parent.parent.key,
            uncleColor: "RED",
            before,
            after: before,
          });
          z.parent.color = "BLACK";
          uncle.color = "BLACK";
          z.parent.parent.color = "RED";
          z = z.parent.parent;
          this.steps[this.steps.length - 1].after = snapRB(this.root, NIL);
        } else {
          if (z === z.parent.right) {
            const before = snapRB(this.root, NIL);
            const xk = z.key;
            const yk = z.parent.key;
            const gpk = z.parent.parent.key;
            this.steps.push({
              kind: "rb",
              phase: "fixup",
              title: "Triangle (inner child)",
              op: "rotate",
              opLabel: "left rotate at parent",
              alignment:
                "Opposite sides: z is a right child while its parent is a left child — triangle case.",
              reason: "Rotate once at the parent to convert to a line case.",
              x: xk,
              y: yk,
              z: gpk,
              uncleColor: "BLACK",
              before,
              after: before,
            });
            z = z.parent;
            this.rotateL(z);
            this.steps[this.steps.length - 1].after = snapRB(this.root, NIL);
          }
          const before = snapRB(this.root, NIL);
          const y = z.parent;
          const gp = y.parent;
          this.steps.push({
            kind: "rb",
            phase: "fixup",
            title: "Line case — rotate + recolor",
            op: "rotate",
            opLabel: "right rotate at grandparent",
            alignment: "Same-side line on the left: parent is left child of grandparent.",
            reason: `Black uncle (${uncle.key}): recolor parent (${y.key}) black, grandparent (${gp.key}) red, then right rotate at grandparent.`,
            x: z.key,
            y: y.key,
            z: gp.key,
            uncleColor: "BLACK",
            before,
            after: before,
          });
          y.color = "BLACK";
          gp.color = "RED";
          this.rotateR(gp);
          this.steps[this.steps.length - 1].after = snapRB(this.root, NIL);
        }
      } else {
        const uncle = z.parent.parent.left;
        if (uncle.color === "RED") {
          const before = snapRB(this.root, NIL);
          this.steps.push({
            kind: "rb",
            phase: "fixup",
            title: "Red parent, red uncle (mirror)",
            op: "recolor",
            opLabel: "recolor parent, uncle, grandparent",
            alignment: `Uncle (${uncle.key}) is RED.`,
            reason: `Mirror case: recolor parent, uncle, and grandparent (${z.parent.parent.key}).`,
            x: z.key,
            y: z.parent.key,
            z: z.parent.parent.key,
            uncleColor: "RED",
            before,
            after: before,
          });
          z.parent.color = "BLACK";
          uncle.color = "BLACK";
          z.parent.parent.color = "RED";
          z = z.parent.parent;
          this.steps[this.steps.length - 1].after = snapRB(this.root, NIL);
        } else {
          if (z === z.parent.left) {
            const before = snapRB(this.root, NIL);
            const xk = z.key;
            const yk = z.parent.key;
            const gpk = z.parent.parent.key;
            this.steps.push({
              kind: "rb",
              phase: "fixup",
              title: "Triangle (inner child, mirror)",
              op: "rotate",
              opLabel: "right rotate at parent",
              alignment: "Opposite sides on the right subtree — triangle case.",
              reason: "Rotate at parent to line up for the final rotation.",
              x: xk,
              y: yk,
              z: gpk,
              uncleColor: "BLACK",
              before,
              after: before,
            });
            z = z.parent;
            this.rotateR(z);
            this.steps[this.steps.length - 1].after = snapRB(this.root, NIL);
          }
          const before = snapRB(this.root, NIL);
          const y = z.parent;
          const gp = y.parent;
          this.steps.push({
            kind: "rb",
            phase: "fixup",
            title: "Line case — rotate + recolor (mirror)",
            op: "rotate",
            opLabel: "left rotate at grandparent",
            alignment: "Same-side line on the right spine.",
            reason: `Black uncle (${uncle.key}): recolor parent (${y.key}) black, grandparent (${gp.key}) red, then left rotate at grandparent.`,
            x: z.key,
            y: y.key,
            z: gp.key,
            uncleColor: "BLACK",
            before,
            after: before,
          });
          y.color = "BLACK";
          gp.color = "RED";
          this.rotateL(gp);
          this.steps[this.steps.length - 1].after = snapRB(this.root, NIL);
        }
      }
    }
    const beforeRoot = snapRB(this.root, NIL);
    this.root.color = "BLACK";
    this.steps.push({
      kind: "rb",
      phase: "done",
      title: "Ensure root is BLACK",
      op: "recolor",
      opLabel: "root ← BLACK",
      alignment: "—",
      reason: "Red-black trees require a black root.",
      x: this.root.isNIL ? null : this.root.key,
      y: null,
      z: null,
      uncleColor: null,
      before: beforeRoot,
      after: snapRB(this.root, NIL),
    });
  }
}

function cloneRBRecorder(rec) {
  return rec.cloneTree();
}

function buildRBInsertStepsFrom(recorder, key) {
  const res = recorder.insertWithSteps(key);
  if (!res.ok) return { ...res, finalRoot: recorder.root };
  return { ok: true, steps: res.steps, finalRoot: recorder.root };
}

function avlInsertPath(root, key) {
  const path = [];
  let cur = root;
  while (cur) {
    if (key === cur.key) return { root, duplicate: true, path: null, leaf: null };
    path.push(cur);
    cur = key < cur.key ? cur.left : cur.right;
  }
  const leaf = { key, height: 1, left: null, right: null };
  if (!path.length) return { root: leaf, duplicate: false, path: [], leaf };
  const p = path[path.length - 1];
  if (key < p.key) p.left = leaf;
  else p.right = leaf;
  return { root, duplicate: false, path, leaf };
}

function buildAVLInsertStepsV2(initialRoot, key) {
  const steps = [];
  const ins = avlInsertPath(initialRoot, key);
  if (ins.duplicate) {
    return {
      ok: false,
      error: `Duplicate key ${key}.`,
      steps: [],
      finalRoot: initialRoot,
    };
  }
  let root = ins.root;
  const path = ins.path;
  const beforeInsert = snapNode(initialRoot, "avl");

  if (!path.length) {
    steps.push({
      kind: "avl",
      phase: "insert",
      title: "Insert into empty tree",
      op: "insert",
      opLabel: "new root",
      alignment: "—",
      reason: `Tree was empty; ${key} becomes the root.`,
      x: key,
      y: null,
      z: null,
      before: beforeInsert,
      after: snapNode(root, "avl"),
    });
    return { ok: true, steps, finalRoot: root };
  }

  steps.push({
    kind: "avl",
    phase: "insert",
    title: "BST insert (new leaf)",
    op: "insert",
    opLabel: "attach leaf",
    alignment: "—",
    reason: `Attach ${key} as a new leaf under its parent.`,
    x: key,
    y: path[path.length - 1].key,
    z: null,
    before: beforeInsert,
    after: snapNode(root, "avl"),
  });

  let didRotate = false;
  for (let i = path.length - 1; i >= 0; i--) {
    const z = path[i];
    const before = snapNode(root, "avl");
    _avlUpd(z);
    const bf = _avlBF(z);
    if (Math.abs(bf) <= 1) continue;

    const zKey = z.key;
    const y = bf > 1 ? z.left : z.right;
    const yKey = y.key;
    let xNode =
      bf > 1
        ? _avlBF(z.left) >= 0
          ? z.left.left
          : z.left.right
        : _avlBF(z.right) <= 0
          ? z.right.right
          : z.right.left;
    const xKey = xNode ? xNode.key : key;
    const typeGuess =
      bf > 1
        ? _avlBF(z.left) >= 0
          ? "LL"
          : "LR"
        : _avlBF(z.right) <= 0
          ? "RR"
          : "RL";
    const alignment =
      typeGuess === "LL" || typeGuess === "RR"
        ? `Same-side (${typeGuess}): two steps in the same direction from z.`
        : `Opposite-side (${typeGuess}): bend under z — double rotation.`;

    steps.push({
      kind: "avl",
      phase: "rebalance",
      title: `Imbalance at ${zKey}`,
      op: "detect",
      opLabel: `balance ${bf} at z`,
      alignment: `left height ${_avlH(z.left)}, right height ${_avlH(z.right)}.`,
      reason: `|balance| > 1 at z=${zKey}. y=${yKey} is on the tall side; x=${xKey} is the grandchild on the insertion path.`,
      x: xKey,
      y: yKey,
      z: zKey,
      before,
      after: before,
    });

    const { newTop, type } = avlBalance(z);
    if (i === 0) root = newTop;
    else {
      const p = path[i - 1];
      if (p.left === z) p.left = newTop;
      else p.right = newTop;
    }

    steps.push({
      kind: "avl",
      phase: "rebalance",
      title: `${type} rotation`,
      op: "rotate",
      opLabel: `${type}`,
      alignment,
      reason: `Apply ${type} at z=${zKey} to restore AVL balance.`,
      x: xKey,
      y: yKey,
      z: zKey,
      before,
      after: snapNode(root, "avl"),
    });
    didRotate = true;
    break;
  }

  if (!didRotate) {
    steps.push({
      kind: "avl",
      phase: "done",
      title: "Balanced",
      op: "done",
      opLabel: "no rotation",
      alignment: "All nodes on the path satisfy |balance| ≤ 1.",
      reason: "No height imbalance beyond 1 along the insertion path.",
      x: key,
      y: null,
      z: null,
      before: snapNode(root, "avl"),
      after: snapNode(root, "avl"),
    });
  }

  return { ok: true, steps, finalRoot: root };
}

/** BST lookup — walk with highlights: y = current node, z = parent, x = next hop target key (or found key). */
function buildAVLLookupSteps(initialRoot, key) {
  const steps = [];
  if (!initialRoot) {
    return {
      ok: false,
      error: "Tree is empty.",
      steps: [],
      finalRoot: null,
    };
  }
  let cur = initialRoot;
  let parent = null;
  while (cur) {
    const before = snapNode(initialRoot, "avl");
    if (key === cur.key) {
      steps.push({
        kind: "avl",
        phase: "lookup",
        title: "Key found",
        op: "compare",
        opLabel: `at node ${cur.key}`,
        alignment: "—",
        reason: `${key} equals the current node — AVL lookup is a standard BST search (no rotations).`,
        x: key,
        y: cur.key,
        z: parent ? parent.key : null,
        before,
        after: before,
      });
      return { ok: true, steps, finalRoot: initialRoot };
    }
    const goLeft = key < cur.key;
    const nextKey = goLeft ? cur.left?.key ?? null : cur.right?.key ?? null;
    steps.push({
      kind: "avl",
      phase: "lookup",
      title: `Compare at ${cur.key}`,
      op: "walk",
      opLabel: goLeft ? "go left" : "go right",
      alignment: "—",
      reason: `${key} is ${goLeft ? "less" : "greater"} than ${cur.key}, so continue ${goLeft ? "left" : "right"}.`,
      x: nextKey,
      y: cur.key,
      z: parent ? parent.key : null,
      before,
      after: before,
    });
    parent = cur;
    cur = goLeft ? cur.left : cur.right;
  }
  const before = snapNode(initialRoot, "avl");
  steps.push({
    kind: "avl",
    phase: "lookup",
    title: "Not found",
    op: "fail",
    opLabel: "null child",
    alignment: "—",
    reason: `Reached an empty subtree — ${key} is not in the tree.`,
    x: key,
    y: parent ? parent.key : null,
    z: null,
    before,
    after: before,
  });
  return { ok: true, steps, finalRoot: initialRoot };
}

function buildRBLookupSteps(recorder, key) {
  const NIL = recorder.NIL;
  const steps = [];
  if (recorder.root.isNIL) {
    return {
      ok: false,
      error: "Tree is empty.",
      steps: [],
      finalRoot: recorder.root,
    };
  }
  let cur = recorder.root;
  let parent = NIL;
  while (!cur.isNIL) {
    const before = snapRB(recorder.root, NIL);
    if (key === cur.key) {
      steps.push({
        kind: "rb",
        phase: "lookup",
        title: "Key found",
        op: "compare",
        opLabel: `at node ${cur.key}`,
        alignment: "—",
        reason: `Found ${key}. Lookup ignores colors; it follows left/right like any BST.`,
        x: key,
        y: cur.key,
        z: parent.isNIL ? null : parent.key,
        uncleColor: null,
        before,
        after: before,
      });
      return { ok: true, steps, finalRoot: recorder.root };
    }
    const goLeft = key < cur.key;
    const nextNd = goLeft ? cur.left : cur.right;
    const nextKey = nextNd.isNIL ? null : nextNd.key;
    steps.push({
      kind: "rb",
      phase: "lookup",
      title: `Compare at ${cur.key}`,
      op: "walk",
      opLabel: goLeft ? "go left" : "go right",
      alignment: "—",
      reason: `${key} is ${goLeft ? "less" : "greater"} than ${cur.key} (${cur.color} node).`,
      x: nextKey,
      y: cur.key,
      z: parent.isNIL ? null : parent.key,
      uncleColor: null,
      before,
      after: before,
    });
    parent = cur;
    cur = nextNd;
  }
  const before = snapRB(recorder.root, NIL);
  steps.push({
    kind: "rb",
    phase: "lookup",
    title: "Not found",
    op: "fail",
    opLabel: "NIL",
    alignment: "—",
    reason: `Fell off the tree — ${key} is not stored.`,
    x: key,
    y: parent.isNIL ? null : parent.key,
    z: null,
    uncleColor: null,
    before,
    after: before,
  });
  return { ok: true, steps, finalRoot: recorder.root };
}

// Export for browser / Bun
if (typeof globalThis !== "undefined") {
  globalThis.TreeStepEngine = {
    buildSplayInsertSteps,
    buildSplayLookupSteps,
    buildAVLInsertSteps: buildAVLInsertStepsV2,
    buildAVLLookupSteps,
    buildRBInsertStepsFrom,
    buildRBLookupSteps,
    cloneSplay,
    cloneAVL,
    cloneRBRecorder,
    RBRecorder,
    snapNode,
  };
}
