// AVL Tree — height-balanced BST
// Balance invariant: |height(left) - height(right)| ≤ 1 at every node.
// height is stored on every node (O(1) per node), so tree.height() is O(1).
// All ops: O(log n) worst case.

function _avlH(n) { return n ? n.height : 0; }
function _avlBF(n) { return _avlH(n.left) - _avlH(n.right); }
function _avlUpd(n) { n.height = 1 + Math.max(_avlH(n.left), _avlH(n.right)); }

function _avlRotR(y) {
  const x = y.left, t = x.right;
  x.right = y; y.left = t;
  _avlUpd(y); _avlUpd(x);
  return x;
}
function _avlRotL(x) {
  const y = x.right, t = y.left;
  y.left = x; x.right = t;
  _avlUpd(x); _avlUpd(y);
  return y;
}
function _avlBal(n) {
  _avlUpd(n);
  const bf = _avlBF(n);
  if (bf > 1)  { if (_avlBF(n.left)  < 0) n.left  = _avlRotL(n.left);  return _avlRotR(n); }
  if (bf < -1) { if (_avlBF(n.right) > 0) n.right = _avlRotR(n.right); return _avlRotL(n); }
  return n;
}

// Iterative insert — avoids call-stack overflow on large sequential inputs
function _avlInsert(root, key) {
  // Find insertion path iteratively, then rebalance on the way up via a stack
  const path = [];
  let cur = root;
  while (cur) {
    if (key === cur.key) return root; // duplicate
    path.push(cur);
    cur = key < cur.key ? cur.left : cur.right;
  }
  const leaf = { key, height: 1, left: null, right: null, accessCount: 0 };
  if (!path.length) return leaf;
  const parent = path[path.length - 1];
  if (key < parent.key) parent.left = leaf; else parent.right = leaf;
  // Rebalance bottom-up
  for (let i = path.length - 1; i >= 0; i--) {
    const balanced = _avlBal(path[i]);
    if (i === 0) return balanced;
    const p = path[i - 1];
    if (p.left === path[i]) p.left = balanced;
    else p.right = balanced;
  }
  return root;
}

function _avlDelete(node, key) {
  if (!node) return null;
  if (key < node.key) node.left = _avlDelete(node.left, key);
  else if (key > node.key) node.right = _avlDelete(node.right, key);
  else {
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let m = node.right; while (m.left) m = m.left;
    node.key = m.key;
    node.right = _avlDelete(node.right, m.key);
  }
  return _avlBal(node);
}

// Iterative search — no call-stack risk
function _avlSearch(root, key) {
  let n = root;
  while (n) {
    if (key === n.key) { n.accessCount++; return true; }
    n = key < n.key ? n.left : n.right;
  }
  return false;
}

// Iterative height via BFS — O(n) but no stack overflow risk
function _avlHeightIter(root) {
  if (!root) return 0;
  // height is stored on root node — O(1)
  return root.height;
}

class AVLTree {
  constructor() { this.root = null; }
  insert(k)  { this.root = _avlInsert(this.root, k); }
  delete(k)  { this.root = _avlDelete(this.root, k); }
  search(k)  { return _avlSearch(this.root, k); }
  // O(1) — stored on root node
  height()   { return _avlH(this.root); }
  size() {
    let c = 0, s = [this.root];
    while (s.length) { const n = s.pop(); if (!n) continue; c++; s.push(n.left, n.right); }
    return c;
  }
  clear() { this.root = null; }
}
