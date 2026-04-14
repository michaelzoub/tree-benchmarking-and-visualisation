// Treap — randomized BST with heap-ordered priorities.
// Each node has a key (BST order) and a random priority (max-heap order).
// Expected O(log n) for all ops; no worst-case degeneration under random priorities.
// No explicit balancing code — the random priorities implicitly balance the tree.

function _treapNode(key) {
  return {
    key,
    priority: Math.random(),
    left: null,
    right: null,
    height: 1,
    accessCount: 0,
  };
}

function _treapH(n) { return n ? n.height : 0; }
function _treapUpdH(n) { if (n) n.height = 1 + Math.max(_treapH(n.left), _treapH(n.right)); }

function _treapRotR(y) {
  const x = y.left;
  y.left = x.right;
  x.right = y;
  _treapUpdH(y);
  _treapUpdH(x);
  return x;
}

function _treapRotL(x) {
  const y = x.right;
  x.right = y.left;
  y.left = x;
  _treapUpdH(x);
  _treapUpdH(y);
  return y;
}

function _treapInsert(node, key) {
  if (!node) return _treapNode(key);
  if (key === node.key) return node; // duplicate
  if (key < node.key) {
    node.left = _treapInsert(node.left, key);
    if (node.left.priority > node.priority) node = _treapRotR(node);
  } else {
    node.right = _treapInsert(node.right, key);
    if (node.right.priority > node.priority) node = _treapRotL(node);
  }
  _treapUpdH(node);
  return node;
}

function _treapDelete(node, key) {
  if (!node) return null;
  if (key < node.key) {
    node.left = _treapDelete(node.left, key);
  } else if (key > node.key) {
    node.right = _treapDelete(node.right, key);
  } else {
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    if (node.left.priority > node.right.priority) {
      node = _treapRotR(node);
      node.right = _treapDelete(node.right, key);
    } else {
      node = _treapRotL(node);
      node.left = _treapDelete(node.left, key);
    }
  }
  _treapUpdH(node);
  return node;
}

function _treapSearch(node, key) {
  while (node) {
    if (key === node.key) { node.accessCount++; return true; }
    node = key < node.key ? node.left : node.right;
  }
  return false;
}

class TreapTree {
  constructor() { this.root = null; }
  insert(k)  { this.root = _treapInsert(this.root, k); }
  delete(k)  { this.root = _treapDelete(this.root, k); }
  search(k)  { return _treapSearch(this.root, k); }
  height()   { return _treapH(this.root); }
  size() {
    let c = 0, s = [this.root];
    while (s.length) { const n = s.pop(); if (!n) continue; c++; s.push(n.left, n.right); }
    return c;
  }
  clear() { this.root = null; }
}
