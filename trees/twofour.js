// 2-4 Tree (B-tree of order 4).
// Each node holds 1–3 keys and 2–4 children (leaves have 0 children).
// Perfectly balanced by height; all leaves at the same depth.
// Splits on overflow (4 keys), borrows or merges on underflow.
// Height guaranteed ≤ log₂(n+1).

function _24node(keys, children) {
  return { keys: [...keys], children: [...children], accessCount: keys.map(() => 0) };
}
function _24leaf(keys) { return _24node(keys, []); }
function _24isLeaf(n)  { return n.children.length === 0; }

function _24split(parent, i) {
  const full = parent.children[i];
  const mid  = full.keys[1];
  // left child keeps key[0], right child gets key[2]
  const left  = _24isLeaf(full)
    ? _24leaf([full.keys[0]])
    : _24node([full.keys[0]], [full.children[0], full.children[1]]);
  left.accessCount = [full.accessCount[0]];
  const right = _24isLeaf(full)
    ? _24leaf([full.keys[2]])
    : _24node([full.keys[2]], [full.children[2], full.children[3]]);
  right.accessCount = [full.accessCount[2]];
  parent.keys.splice(i, 0, mid);
  parent.accessCount.splice(i, 0, full.accessCount[1]);
  parent.children.splice(i, 1, left, right);
}

function _24insertNF(node, key) {
  if (_24isLeaf(node)) {
    let i = node.keys.length - 1;
    while (i >= 0 && key < node.keys[i]) i--;
    if (i >= 0 && node.keys[i] === key) return; // duplicate
    node.keys.splice(i + 1, 0, key);
    node.accessCount.splice(i + 1, 0, 0);
    return;
  }
  let i = node.keys.length - 1;
  while (i >= 0 && key < node.keys[i]) i--;
  if (i >= 0 && node.keys[i] === key) return; // duplicate
  i++;
  if (node.children[i].keys.length === 3) {
    _24split(node, i);
    if (key > node.keys[i]) i++;
    if (key === node.keys[i]) return;
  }
  _24insertNF(node.children[i], key);
}

function _24search(node, key) {
  if (!node) return false;
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;
  if (i < node.keys.length && node.keys[i] === key) { node.accessCount[i]++; return true; }
  if (_24isLeaf(node)) return false;
  return _24search(node.children[i], key);
}

function _24merge(parent, i) {
  const l = parent.children[i], r = parent.children[i + 1];
  l.keys.push(parent.keys[i], ...r.keys);
  l.accessCount.push(parent.accessCount[i], ...r.accessCount);
  l.children.push(...r.children);
  parent.keys.splice(i, 1);
  parent.accessCount.splice(i, 1);
  parent.children.splice(i + 1, 1);
}

// t = minimum degree = 2 (each non-root node has at least 1 key)
const _24T = 2;

function _24delete(node, key) {
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;

  if (i < node.keys.length && node.keys[i] === key) {
    if (_24isLeaf(node)) {
      node.keys.splice(i, 1); node.accessCount.splice(i, 1); return;
    }
    if (node.children[i].keys.length >= _24T) {
      let pred = node.children[i];
      while (!_24isLeaf(pred)) pred = pred.children[pred.children.length - 1];
      const pk = pred.keys[pred.keys.length - 1];
      node.keys[i] = pk; node.accessCount[i] = 0;
      _24delete(node.children[i], pk);
    } else if (node.children[i + 1].keys.length >= _24T) {
      let succ = node.children[i + 1];
      while (!_24isLeaf(succ)) succ = succ.children[0];
      const sk = succ.keys[0];
      node.keys[i] = sk; node.accessCount[i] = 0;
      _24delete(node.children[i + 1], sk);
    } else {
      _24merge(node, i);
      _24delete(node.children[i], key);
    }
    return;
  }

  if (_24isLeaf(node)) return;

  const ci = i, child = node.children[ci];
  if (child.keys.length < _24T) {
    const lSib = ci > 0 ? node.children[ci - 1] : null;
    const rSib = ci < node.children.length - 1 ? node.children[ci + 1] : null;
    if (lSib && lSib.keys.length >= _24T) {
      // Borrow from left sibling
      child.keys.unshift(node.keys[ci - 1]); child.accessCount.unshift(0);
      node.keys[ci - 1] = lSib.keys[lSib.keys.length - 1]; node.accessCount[ci - 1] = 0;
      lSib.keys.pop(); lSib.accessCount.pop();
      if (!_24isLeaf(lSib)) { child.children.unshift(lSib.children[lSib.children.length - 1]); lSib.children.pop(); }
    } else if (rSib && rSib.keys.length >= _24T) {
      // Borrow from right sibling
      child.keys.push(node.keys[ci]); child.accessCount.push(0);
      node.keys[ci] = rSib.keys[0]; node.accessCount[ci] = 0;
      rSib.keys.shift(); rSib.accessCount.shift();
      if (!_24isLeaf(rSib)) { child.children.push(rSib.children[0]); rSib.children.shift(); }
    } else {
      if (lSib) { _24merge(node, ci - 1); _24delete(node.children[ci - 1], key); return; }
      else      { _24merge(node, ci);     _24delete(node.children[ci],     key); return; }
    }
  }
  _24delete(node.children[ci], key);
}

class TwoFourTree {
  constructor() { this.root = null; }

  insert(key) {
    if (!this.root) { this.root = _24leaf([key]); return; }
    if (this.root.keys.length === 3) {
      const nr = _24node([], [this.root]);
      _24split(nr, 0);
      this.root = nr;
    }
    _24insertNF(this.root, key);
  }

  delete(key) {
    if (!this.root) return;
    _24delete(this.root, key);
    if (this.root.keys.length === 0 && this.root.children.length > 0) this.root = this.root.children[0];
    if (this.root && this.root.keys.length === 0) this.root = null;
  }

  search(key) { return _24search(this.root, key); }

  // Iterative BFS height — safe for any N
  height() {
    if (!this.root) return 0;
    let maxDepth = 0;
    const queue = [[this.root, 1]];
    let qi = 0;
    while (qi < queue.length) {
      const [node, d] = queue[qi++];
      if (d > maxDepth) maxDepth = d;
      for (const c of node.children) queue.push([c, d + 1]);
    }
    return maxDepth;
  }

  size() {
    let c = 0, s = [this.root];
    while (s.length) {
      const n = s.pop(); if (!n) continue;
      c += n.keys.length;
      for (const ch of n.children) s.push(ch);
    }
    return c;
  }
  clear() { this.root = null; }
}
