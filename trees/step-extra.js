/**
 * Step recorders for 2-4 tree, B-tree (t=3), Treap, and AA tree.
 * Snapshots are JSON-safe for the interactive UI.
 * Dropbox course materials could not be fetched; logic follows trees/twofour.js, btree.js, treap.js, aatree.js.
 */

const _BT_DEG = 3;

function clone24(n) {
  if (!n) return null;
  return {
    keys: [...n.keys],
    children: n.children.map(clone24),
    accessCount: n.accessCount ? [...n.accessCount] : n.keys.map(() => 0),
  };
}

function snap24(n) {
  if (!n) return null;
  return {
    keys: [...n.keys],
    children: n.children.map(snap24),
  };
}

function snap24Full(root) {
  return { type: "twofour", root: snap24(root) };
}

function isLeaf24(n) {
  return !n.children || n.children.length === 0;
}

function nodePathId(path) {
  return path.length ? path.join("/") : "root";
}

/** 2-4 search: one step per key comparison within a node, then descend. */
function buildTwoFourLookupSteps(root, key) {
  const steps = [];
  if (!root) {
    return {
      ok: true,
      steps: [
        {
          kind: "twofour",
          title: "Empty tree",
          op: "lookup",
          opLabel: "search",
          alignment: "—",
          reason: "There is no root; the key cannot be present.",
          x: key,
          y: null,
          z: null,
          highlightPath: "",
          before: snap24Full(null),
          after: snap24Full(null),
        },
      ],
      finalRoot: null,
    };
  }

  let cur = root;
  const path = [];
  while (cur) {
    const before = snap24Full(root);
    let i = 0;
    let descendedLeft = false;
    while (i < cur.keys.length) {
      const sep = cur.keys[i];
      steps.push({
        kind: "twofour",
        title: `At node [${cur.keys.join(", ")}]`,
        op: "compare",
        opLabel: `compare ${key} with ${sep}`,
        alignment: "—",
        reason:
          key > sep
            ? `${key} is greater than ${sep}; continue scanning keys in this node (or descend if no more keys on the right).`
            : key < sep
              ? `${key} is less than ${sep}; stop scanning and descend into the subtree left of ${sep}.`
              : `Match: ${key} equals ${sep}.`,
        x: key,
        y: sep,
        z: nodePathId(path),
        highlightPath: nodePathId(path),
        scanIndex: i,
        before,
        after: before,
      });
      if (key === sep) {
        return { ok: true, steps, finalRoot: root };
      }
      if (key < sep) {
        if (isLeaf24(cur)) {
          steps.push({
            kind: "twofour",
            title: "Not found",
            op: "fail",
            opLabel: "leaf",
            alignment: "—",
            reason: `Leaf reached; ${key} is not in the tree.`,
            x: key,
            y: null,
            z: nodePathId(path),
            highlightPath: nodePathId(path),
            before,
            after: before,
          });
          return { ok: true, steps, finalRoot: root };
        }
        path.push(i);
        cur = cur.children[i];
        steps.push({
          kind: "twofour",
          title: "Descend",
          op: "walk",
          opLabel: `child index ${i} (left of ${sep})`,
          alignment: "—",
          reason: `Follow pointer to child ${i}, which holds keys less than ${sep}.`,
          x: key,
          y: i,
          z: nodePathId(path.slice(0, -1)),
          highlightPath: nodePathId(path),
          before,
          after: snap24Full(root),
        });
        descendedLeft = true;
        break;
      }
      i++;
    }
    if (descendedLeft) continue;
    if (i >= cur.keys.length) {
      if (isLeaf24(cur)) {
        steps.push({
          kind: "twofour",
          title: "Not found",
          op: "fail",
          opLabel: "past last key",
          alignment: "—",
          reason: `${key} is greater than every key in this leaf.`,
          x: key,
          y: null,
          z: nodePathId(path),
          highlightPath: nodePathId(path),
          before: snap24Full(root),
          after: snap24Full(root),
        });
        return { ok: true, steps, finalRoot: root };
      }
      path.push(i);
      steps.push({
        kind: "twofour",
        title: "Descend",
        op: "walk",
        opLabel: `child index ${i} (right of all keys)`,
        alignment: "—",
        reason: `${key} is greater than all separators in this node; use the rightmost child.`,
        x: key,
        y: i,
        z: nodePathId(path.slice(0, -1)),
        highlightPath: nodePathId(path),
        before: snap24Full(root),
        after: snap24Full(root),
      });
      cur = cur.children[i];
    }
  }
  return { ok: true, steps, finalRoot: root };
}

function split24Node(parent, i) {
  const full = parent.children[i];
  const mid = full.keys[1];
  const left = isLeaf24(full)
    ? { keys: [full.keys[0]], children: [], accessCount: [full.accessCount[0]] }
    : {
        keys: [full.keys[0]],
        children: [full.children[0], full.children[1]],
        accessCount: [full.accessCount[0]],
      };
  const right = isLeaf24(full)
    ? { keys: [full.keys[2]], children: [], accessCount: [full.accessCount[2]] }
    : {
        keys: [full.keys[2]],
        children: [full.children[2], full.children[3]],
        accessCount: [full.accessCount[2]],
      };
  parent.keys.splice(i, 0, mid);
  parent.accessCount.splice(i, 0, full.accessCount[1]);
  parent.children.splice(i, 1, left, right);
}

function insert24NonFullWithSteps(root, key, steps, pathPrefix) {
  if (isLeaf24(root)) {
    let i = root.keys.length - 1;
    while (i >= 0 && key < root.keys[i]) i--;
    if (i >= 0 && root.keys[i] === key) return false;
    const before = snap24Full(steps._rootRef || root);
    root.keys.splice(i + 1, 0, key);
    root.accessCount.splice(i + 1, 0, 0);
    steps.push({
      kind: "twofour",
      title: "Insert into leaf",
      op: "insert",
      opLabel: "place key",
      alignment: "—",
      reason: `Insert ${key} in sorted order among leaf keys.`,
      x: key,
      y: null,
      z: nodePathId(pathPrefix),
      highlightPath: nodePathId(pathPrefix),
      before,
      after: snap24Full(steps._rootRef),
    });
    return true;
  }
  let i = root.keys.length - 1;
  while (i >= 0 && key < root.keys[i]) i--;
  if (i >= 0 && root.keys[i] === key) return false;
  i++;
  if (root.children[i].keys.length === 3) {
    const before = snap24Full(steps._rootRef);
    steps.push({
      kind: "twofour",
      title: "Child full (3 keys)",
      op: "split",
      opLabel: "split child before descent",
      alignment: "—",
      reason:
        "A 2-4 node may hold at most 3 keys. Split the full child so we can descend without overflowing.",
      x: key,
      y: i,
      z: nodePathId(pathPrefix),
      highlightPath: nodePathId(pathPrefix),
      before,
      after: before,
    });
    split24Node(root, i);
    steps[steps.length - 1].after = snap24Full(steps._rootRef);
    if (key > root.keys[i]) i++;
    if (i < root.keys.length && key === root.keys[i]) return false;
  }
  const p = [...pathPrefix, i];
  steps.push({
    kind: "twofour",
    title: "Descend for insert",
    op: "walk",
    opLabel: `child ${i}`,
    alignment: "—",
    reason: `Recurse into child ${i} to find the leaf position for ${key}.`,
    x: key,
    y: i,
    z: nodePathId(pathPrefix),
    highlightPath: nodePathId(p),
    before: snap24Full(steps._rootRef),
    after: snap24Full(steps._rootRef),
  });
  return insert24NonFullWithSteps(root.children[i], key, steps, p);
}

function buildTwoFourInsertSteps(root, key) {
  const steps = [];
  const tree = clone24(root);
  if (!tree) {
    const nr = { keys: [key], children: [], accessCount: [0] };
    steps.push({
      kind: "twofour",
      title: "First key",
      op: "insert",
      opLabel: "new root",
      alignment: "—",
      reason: `Empty tree; ${key} becomes the root leaf.`,
      x: key,
      y: null,
      z: "root",
      highlightPath: "root",
      before: snap24Full(null),
      after: snap24Full(nr),
    });
    return { ok: true, steps, finalRoot: nr };
  }
  steps._rootRef = tree;
  if (tree.keys.length === 3) {
    const before = snap24Full(tree);
    const nr = { keys: [], children: [tree], accessCount: [] };
    steps.push({
      kind: "twofour",
      title: "Root full",
      op: "split",
      opLabel: "split root",
      alignment: "—",
      reason: "Root has 3 keys; split it upward so the tree can grow in height.",
      x: key,
      y: null,
      z: "root",
      highlightPath: "root",
      before,
      after: before,
    });
    split24Node(nr, 0);
    steps[steps.length - 1].after = snap24Full(nr);
    steps._rootRef = nr;
    const ok = insert24NonFullWithSteps(nr, key, steps, []);
    delete steps._rootRef;
    if (!ok) return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: root };
    return { ok: true, steps, finalRoot: nr };
  }
  steps._rootRef = tree;
  const ok = insert24NonFullWithSteps(tree, key, steps, []);
  delete steps._rootRef;
  if (!ok) return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: root };
  return { ok: true, steps, finalRoot: tree };
}

function cloneBT(n) {
  if (!n) return null;
  return {
    keys: [...n.keys],
    accessCount: n.accessCount ? [...n.accessCount] : n.keys.map(() => 0),
    children: n.children.map(cloneBT),
    isLeaf: n.isLeaf,
  };
}

function snapBT(n) {
  if (!n) return null;
  return {
    keys: [...n.keys],
    isLeaf: n.isLeaf,
    children: n.children.map(snapBT),
  };
}

function snapBTFull(root) {
  return { type: "btree", root: snapBT(root) };
}

function buildBTreeLookupSteps(root, key) {
  const steps = [];
  if (!root) {
    return {
      ok: true,
      steps: [
        {
          kind: "btree",
          title: "Empty tree",
          op: "lookup",
          opLabel: "search",
          alignment: "—",
          reason: "No root.",
          x: key,
          y: null,
          z: "",
          highlightPath: "",
          before: snapBTFull(null),
          after: snapBTFull(null),
        },
      ],
      finalRoot: null,
    };
  }
  let node = root;
  const path = [];
  while (node) {
    const before = snapBTFull(root);
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) {
      const k = node.keys[i];
      steps.push({
        kind: "btree",
        title: `At node [${node.keys.join(", ")}]`,
        op: "compare",
        opLabel: `${key} > ${k}?`,
        alignment: "—",
        reason: `Scan index ${i}: ${key} is greater than ${k}; advance.`,
        x: key,
        y: k,
        z: nodePathId(path),
        highlightPath: nodePathId(path),
        before,
        after: before,
      });
      i++;
    }
    if (i < node.keys.length && node.keys[i] === key) {
      steps.push({
        kind: "btree",
        title: "Found",
        op: "compare",
        opLabel: `match at index ${i}`,
        alignment: "—",
        reason: `${key} equals key at index ${i} in this node.`,
        x: key,
        y: i,
        z: nodePathId(path),
        highlightPath: nodePathId(path),
        before,
        after: before,
      });
      return { ok: true, steps, finalRoot: root };
    }
    if (node.isLeaf) {
      steps.push({
        kind: "btree",
        title: "Not found",
        op: "fail",
        opLabel: "leaf",
        alignment: "—",
        reason: `Leaf exhausted; ${key} not present.`,
        x: key,
        y: null,
        z: nodePathId(path),
        highlightPath: nodePathId(path),
        before,
        after: before,
      });
      return { ok: true, steps, finalRoot: root };
    }
    path.push(i);
    steps.push({
      kind: "btree",
      title: "Descend",
      op: "walk",
      opLabel: `child slot ${i}`,
      alignment: "—",
      reason: `Enter child ${i} (keys in that subtree are bounded by surrounding separators).`,
      x: key,
      y: i,
      z: nodePathId(path.slice(0, -1)),
      highlightPath: nodePathId(path),
      before,
      after: snapBTFull(root),
    });
    node = node.children[i];
  }
  return { ok: true, steps, finalRoot: root };
}

function splitBTChild(parent, i) {
  const full = parent.children[i];
  const mid = full.keys[_BT_DEG - 1];
  const midAC = full.accessCount[_BT_DEG - 1];
  const right = { keys: [], children: [], isLeaf: full.isLeaf, accessCount: [] };
  right.keys = full.keys.splice(_BT_DEG, _BT_DEG - 1);
  right.accessCount = full.accessCount.splice(_BT_DEG, _BT_DEG - 1);
  if (!full.isLeaf) {
    right.children = full.children.splice(_BT_DEG, _BT_DEG);
  }
  full.keys.pop();
  full.accessCount.pop();
  parent.keys.splice(i, 0, mid);
  parent.accessCount.splice(i, 0, midAC);
  parent.children.splice(i + 1, 0, right);
}

function insertBTNonFullSteps(root, key, steps, pathPrefix) {
  let i = root.keys.length - 1;
  if (root.isLeaf) {
    while (i >= 0 && key < root.keys[i]) i--;
    if (i >= 0 && root.keys[i] === key) return false;
    const before = snapBTFull(steps._btRoot);
    root.keys.splice(i + 1, 0, key);
    root.accessCount.splice(i + 1, 0, 0);
    steps.push({
      kind: "btree",
      title: "Insert in leaf",
      op: "insert",
      opLabel: "sorted insert",
      alignment: "—",
      reason: `Place ${key} among leaf keys in order.`,
      x: key,
      y: null,
      z: nodePathId(pathPrefix),
      highlightPath: nodePathId(pathPrefix),
      before,
      after: snapBTFull(steps._btRoot),
    });
    return true;
  }
  while (i >= 0 && key < root.keys[i]) i--;
  if (i >= 0 && root.keys[i] === key) return false;
  i++;
  if (root.children[i].keys.length === 2 * _BT_DEG - 1) {
    const before = snapBTFull(steps._btRoot);
    steps.push({
      kind: "btree",
      title: "Full child",
      op: "split",
      opLabel: `split child ${i}`,
      alignment: "—",
      reason: `Child has 2t−1 keys (${2 * _BT_DEG - 1}); split before descending.`,
      x: key,
      y: i,
      z: nodePathId(pathPrefix),
      highlightPath: nodePathId(pathPrefix),
      before,
      after: before,
    });
    splitBTChild(root, i);
    steps[steps.length - 1].after = snapBTFull(steps._btRoot);
    if (key > root.keys[i]) i++;
    if (i < root.keys.length && key === root.keys[i]) return false;
  }
  const p = [...pathPrefix, i];
  steps.push({
    kind: "btree",
    title: "Descend",
    op: "walk",
    opLabel: `child ${i}`,
    alignment: "—",
    reason: `Recurse into non-full child ${i}.`,
    x: key,
    y: i,
    z: nodePathId(pathPrefix),
    highlightPath: nodePathId(p),
    before: snapBTFull(steps._btRoot),
    after: snapBTFull(steps._btRoot),
  });
  return insertBTNonFullSteps(root.children[i], key, steps, p);
}

function buildBTreeInsertSteps(root, key) {
  const steps = [];
  const tree = cloneBT(root);
  if (!tree) {
    const nr = { keys: [key], children: [], isLeaf: true, accessCount: [0] };
    steps.push({
      kind: "btree",
      title: "New root",
      op: "insert",
      opLabel: "leaf root",
      alignment: "—",
      reason: `First key ${key}.`,
      x: key,
      y: null,
      z: "root",
      highlightPath: "root",
      before: snapBTFull(null),
      after: snapBTFull(nr),
    });
    return { ok: true, steps, finalRoot: nr };
  }
  steps._btRoot = tree;
  if (tree.keys.length === 2 * _BT_DEG - 1) {
    const before = snapBTFull(tree);
    const nr = { keys: [], children: [tree], isLeaf: false, accessCount: [] };
    steps.push({
      kind: "btree",
      title: "Split full root",
      op: "split",
      opLabel: "grow height",
      alignment: "—",
      reason: "Root is full; split to increase tree height.",
      x: key,
      y: null,
      z: "root",
      highlightPath: "root",
      before,
      after: before,
    });
    splitBTChild(nr, 0);
    steps[steps.length - 1].after = snapBTFull(nr);
    steps._btRoot = nr;
    const ok = insertBTNonFullSteps(nr, key, steps, []);
    delete steps._btRoot;
    if (!ok) return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: root };
    return { ok: true, steps, finalRoot: nr };
  }
  steps._btRoot = tree;
  const ok = insertBTNonFullSteps(tree, key, steps, []);
  delete steps._btRoot;
  if (!ok) return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: root };
  return { ok: true, steps, finalRoot: tree };
}

function treapPriority(key) {
  let h = key >>> 0;
  h = ((h ^ (h >>> 16)) * 0x85ebca6b) >>> 0;
  h = ((h ^ (h >>> 13)) * 0xc2b2ae35) >>> 0;
  return (h >>> 0) / 0xffffffff;
}

function snapTreap(n) {
  if (!n) return null;
  return {
    key: n.key,
    p: n.priority,
    left: snapTreap(n.left),
    right: snapTreap(n.right),
  };
}

function cloneTreap(n) {
  if (!n) return null;
  return {
    key: n.key,
    priority: n.priority,
    height: n.height || 1,
    left: cloneTreap(n.left),
    right: cloneTreap(n.right),
    accessCount: n.accessCount || 0,
  };
}

function treapRotR(y) {
  const x = y.left;
  y.left = x.right;
  x.right = y;
  if (y.height) y.height = 1 + Math.max(tH(y.left), tH(y.right));
  if (x.height) x.height = 1 + Math.max(tH(x.left), tH(x.right));
  return x;
}
function treapRotL(x) {
  const y = x.right;
  x.right = y.left;
  y.left = x;
  if (x.height) x.height = 1 + Math.max(tH(x.left), tH(x.right));
  if (y.height) y.height = 1 + Math.max(tH(y.left), tH(y.right));
  return y;
}
function tH(n) {
  return n ? n.height || 1 : 0;
}
function tUpd(n) {
  if (n) n.height = 1 + Math.max(tH(n.left), tH(n.right));
}

function buildTreapLookupSteps(root, key) {
  const steps = [];
  let cur = root;
  const path = [];
  while (cur) {
    const before = { type: "treap", root: snapTreap(root) };
    if (key === cur.key) {
      steps.push({
        kind: "treap",
        title: "Found",
        op: "compare",
        opLabel: `at ${cur.key}`,
        alignment: "—",
        reason: `BST property: key found. Priority here is ${(cur.priority ?? 0).toFixed(4)}.`,
        x: key,
        y: cur.key,
        z: path.length ? String(path[path.length - 1]) : null,
        highlightPath: path.join("/"),
        before,
        after: before,
      });
      return { ok: true, steps, finalRoot: root };
    }
    const goL = key < cur.key;
    steps.push({
      kind: "treap",
      title: `At ${cur.key}`,
      op: "walk",
      opLabel: goL ? "go left" : "go right",
      alignment: "—",
      reason: `${key} ${goL ? "<" : ">"} ${cur.key}; follow BST ordering.`,
      x: key,
      y: cur.key,
      z: null,
      highlightPath: path.concat(cur.key).join("/"),
      before,
      after: before,
    });
    path.push(cur.key);
    cur = goL ? cur.left : cur.right;
  }
  steps.push({
    kind: "treap",
    title: "Not found",
    op: "fail",
    opLabel: "null",
    alignment: "—",
    reason: `Key ${key} absent.`,
    x: key,
    y: null,
    z: null,
    highlightPath: path.join("/"),
    before: { type: "treap", root: snapTreap(root) },
    after: { type: "treap", root: snapTreap(root) },
  });
  return { ok: true, steps, finalRoot: root };
}

function treapContains(n, key) {
  while (n) {
    if (n.key === key) return true;
    n = key < n.key ? n.left : n.right;
  }
  return false;
}

function insertTreapWithSteps(node, key, steps, rootHolder) {
  if (!node) {
    const n = {
      key,
      priority: treapPriority(key),
      left: null,
      right: null,
      height: 1,
    };
    steps.push({
      kind: "treap",
      title: "New node",
      op: "insert",
      opLabel: "attach leaf",
      alignment: "—",
      reason: `Create node with key ${key} and deterministic heap priority ${n.priority.toFixed(4)} (reproducible for replay).`,
      x: key,
      y: n.priority,
      z: null,
      highlightPath: "",
      before: { type: "treap", root: snapTreap(rootHolder.r) },
      after: { type: "treap", root: snapTreap(n) },
    });
    return n;
  }
  if (key === node.key) return node;
  const before = { type: "treap", root: snapTreap(rootHolder.r) };
  if (key < node.key) {
    node.left = insertTreapWithSteps(node.left, key, steps, rootHolder);
    if (node.left.priority > node.priority) {
      steps.push({
        kind: "treap",
        title: "Heap fix",
        op: "rotate",
        opLabel: "right rotate (priority heap)",
        alignment: "—",
        reason: `Left child priority ${node.left.priority.toFixed(4)} > this node's ${node.priority.toFixed(4)}; rotate to restore max-heap on priorities.`,
        x: node.left.key,
        y: node.key,
        z: null,
        highlightPath: String(node.key),
        before,
        after: before,
      });
      const nr = treapRotR(node);
      steps[steps.length - 1].after = { type: "treap", root: snapTreap(rootHolder.r) };
      tUpd(nr);
      return nr;
    }
  } else {
    node.right = insertTreapWithSteps(node.right, key, steps, rootHolder);
    if (node.right.priority > node.priority) {
      steps.push({
        kind: "treap",
        title: "Heap fix",
        op: "rotate",
        opLabel: "left rotate (priority heap)",
        alignment: "—",
        reason: `Right child priority ${node.right.priority.toFixed(4)} > this node's ${node.priority.toFixed(4)}; rotate.`,
        x: node.right.key,
        y: node.key,
        z: null,
        highlightPath: String(node.key),
        before,
        after: before,
      });
      const nr = treapRotL(node);
      steps[steps.length - 1].after = { type: "treap", root: snapTreap(rootHolder.r) };
      tUpd(nr);
      return nr;
    }
  }
  tUpd(node);
  return node;
}

function buildTreapInsertSteps(root, key) {
  const steps = [];
  const tree = cloneTreap(root);
  if (treapContains(tree, key)) {
    return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: root };
  }
  const holder = { r: tree };
  holder.r = insertTreapWithSteps(holder.r, key, steps, holder);
  return { ok: true, steps, finalRoot: holder.r };
}

function snapAA(n) {
  if (!n) return null;
  return {
    key: n.key,
    level: n.level,
    left: snapAA(n.left),
    right: snapAA(n.right),
  };
}

function cloneAA(n) {
  if (!n) return null;
  return {
    key: n.key,
    level: n.level,
    left: cloneAA(n.left),
    right: cloneAA(n.right),
    accessCount: n.accessCount || 0,
  };
}

function aaSkew(t) {
  if (!t || !t.left || t.left.level !== t.level) return { node: t, rotated: false };
  const l = t.left;
  t.left = l.right;
  l.right = t;
  return { node: l, rotated: true };
}
function aaSplit(t) {
  if (!t || !t.right || !t.right.right || t.right.right.level !== t.level)
    return { node: t, rotated: false };
  const r = t.right;
  t.right = r.left;
  r.left = t;
  r.level++;
  return { node: r, rotated: true };
}

function buildAALookupSteps(root, key) {
  const steps = [];
  let cur = root;
  const path = [];
  while (cur) {
    const before = { type: "aa", root: snapAA(root) };
    if (key === cur.key) {
      steps.push({
        kind: "aa",
        title: "Found",
        op: "compare",
        opLabel: `at level-${cur.level} node`,
        alignment: "—",
        reason: `BST search on AA tree.`,
        x: key,
        y: cur.key,
        z: null,
        highlightPath: path.concat(cur.key).join("/"),
        before,
        after: before,
      });
      return { ok: true, steps, finalRoot: root };
    }
    const goL = key < cur.key;
    steps.push({
      kind: "aa",
      title: `At ${cur.key}`,
      op: "walk",
      opLabel: goL ? "left" : "right",
      alignment: "—",
      reason: `${key} compared to ${cur.key}.`,
      x: key,
      y: cur.key,
      z: null,
      highlightPath: path.concat(cur.key).join("/"),
      before,
      after: before,
    });
    path.push(cur.key);
    cur = goL ? cur.left : cur.right;
  }
  steps.push({
    kind: "aa",
    title: "Not found",
    op: "fail",
    opLabel: "null",
    alignment: "—",
    reason: `Key ${key} not in tree.`,
    x: key,
    y: null,
    z: null,
    highlightPath: path.join("/"),
    before: { type: "aa", root: snapAA(root) },
    after: { type: "aa", root: snapAA(root) },
  });
  return { ok: true, steps, finalRoot: root };
}

function aaContains(n, key) {
  while (n) {
    if (n.key === key) return true;
    n = key < n.key ? n.left : n.right;
  }
  return false;
}

function insertAAWithSteps(node, key, steps, holder) {
  if (!node) {
    const leaf = { key, level: 1, left: null, right: null };
    steps.push({
      kind: "aa",
      title: "New leaf",
      op: "insert",
      opLabel: "create node",
      alignment: "—",
      reason: `Insert ${key} with level 1.`,
      x: key,
      y: null,
      z: null,
      highlightPath: "",
      before: { type: "aa", root: snapAA(holder.r) },
      after: { type: "aa", root: snapAA(leaf) },
    });
    return leaf;
  }
  if (key < node.key) node.left = insertAAWithSteps(node.left, key, steps, holder);
  else if (key > node.key) node.right = insertAAWithSteps(node.right, key, steps, holder);
  else return node;

  const before = { type: "aa", root: snapAA(holder.r) };
  let t = node;
  const sk = aaSkew(t);
  if (sk.rotated) {
    steps.push({
      kind: "aa",
      title: "Skew",
      op: "skew",
      opLabel: "right rotate (remove left horizontal)",
      alignment: "—",
      reason: "AA skew removes a left horizontal link at this level.",
      x: t.key,
      y: sk.node.key,
      z: null,
      highlightPath: String(sk.node.key),
      before,
      after: before,
    });
    t = sk.node;
    steps[steps.length - 1].after = { type: "aa", root: snapAA(holder.r) };
  }
  const sp = aaSplit(t);
  if (sp.rotated) {
    steps.push({
      kind: "aa",
      title: "Split",
      op: "split",
      opLabel: "left rotate + level up",
      alignment: "—",
      reason: "AA split removes consecutive right horizontal edges.",
      x: t.key,
      y: sp.node.key,
      z: null,
      highlightPath: String(sp.node.key),
      before: { type: "aa", root: snapAA(holder.r) },
      after: before,
    });
    t = sp.node;
    steps[steps.length - 1].after = { type: "aa", root: snapAA(holder.r) };
  }
  return t;
}

function buildAAInsertSteps(root, key) {
  const steps = [];
  const tree = cloneAA(root);
  if (aaContains(tree, key)) {
    return { ok: false, error: `Duplicate key ${key}.`, steps: [], finalRoot: root };
  }
  const holder = { r: tree };
  holder.r = insertAAWithSteps(holder.r, key, steps, holder);
  return { ok: true, steps, finalRoot: holder.r };
}

if (typeof globalThis !== "undefined") {
  globalThis.TreeStepExtra = {
    buildTwoFourLookupSteps,
    buildTwoFourInsertSteps,
    buildBTreeLookupSteps,
    buildBTreeInsertSteps,
    buildTreapLookupSteps,
    buildTreapInsertSteps,
    buildAALookupSteps,
    buildAAInsertSteps,
    clone24,
    cloneBT,
    cloneTreap,
    cloneAA,
    snap24Full,
    snapBTFull,
    snapTreap,
    snapAA,
    treapPriority,
  };
}
