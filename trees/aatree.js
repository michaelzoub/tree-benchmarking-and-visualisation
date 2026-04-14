// AA Tree — simplified Red-Black variant by Arne Andersson (1993).
// Enforces: red links only on right spine; no two consecutive right-red links.
// Encoded as "level" (equivalent to black-height). Only right children can share
// a parent's level; left children must be strictly lower level.
// All ops: O(log n) worst case. Simpler fixup than Red-Black.

function _aaNode(key) {
  return { key, level: 1, left: null, right: null, accessCount: 0 };
}

// Skew: right-rotate to remove left horizontal link
function _aaSkew(t) {
  if (!t || !t.left || t.left.level !== t.level) return t;
  const l = t.left;
  t.left = l.right;
  l.right = t;
  return l;
}

// Split: left-rotate + level-up to remove two consecutive right horizontal links
function _aaSplit(t) {
  if (!t || !t.right || !t.right.right || t.right.right.level !== t.level) return t;
  const r = t.right;
  t.right = r.left;
  r.left = t;
  r.level++;
  return r;
}

function _aaInsert(node, key) {
  if (!node) return _aaNode(key);
  if (key < node.key)       node.left  = _aaInsert(node.left,  key);
  else if (key > node.key)  node.right = _aaInsert(node.right, key);
  else return node; // duplicate
  node = _aaSkew(node);
  node = _aaSplit(node);
  return node;
}

function _aaLevel(n) { return n ? n.level : 0; }

function _aaDeleteMin(node) {
  if (!node.left) return node.right;
  node.left = _aaDeleteMin(node.left);
  return _aaRebalance(node);
}

function _aaSuccessor(node) {
  let n = node.right;
  while (n.left) n = n.left;
  return n;
}

function _aaDecreaseLevelIfNeeded(t) {
  const should = Math.min(_aaLevel(t.left), _aaLevel(t.right)) + 1;
  if (should < t.level) {
    t.level = should;
    if (t.right && should < t.right.level) t.right.level = should;
  }
  return t;
}

function _aaRebalance(t) {
  if (!t) return null;
  t = _aaDecreaseLevelIfNeeded(t);
  t = _aaSkew(t);
  if (t && t.right) {
    t.right = _aaSkew(t.right);
    if (t.right && t.right.right) t.right.right = _aaSkew(t.right.right);
  }
  t = _aaSplit(t);
  if (t && t.right) t.right = _aaSplit(t.right);
  return t;
}

function _aaDelete(node, key) {
  if (!node) return null;
  if (key < node.key) {
    node.left = _aaDelete(node.left, key);
  } else if (key > node.key) {
    node.right = _aaDelete(node.right, key);
  } else {
    if (!node.left && !node.right) return null;
    if (!node.left) {
      const succ = _aaSuccessor(node);
      node.right = _aaDelete(node.right, succ.key);
      node.key = succ.key;
      node.accessCount = succ.accessCount;
    } else {
      // find predecessor
      let pred = node.left;
      while (pred.right) pred = pred.right;
      node.left = _aaDelete(node.left, pred.key);
      node.key = pred.key;
      node.accessCount = pred.accessCount;
    }
  }
  return _aaRebalance(node);
}

function _aaSearch(node, key) {
  while (node) {
    if (key === node.key) { node.accessCount++; return true; }
    node = key < node.key ? node.left : node.right;
  }
  return false;
}

function _aaHeightIter(root) {
  if (!root) return 0;
  let maxDepth = 0;
  const queue = [[root, 1]];
  let qi = 0;
  while (qi < queue.length) {
    const [node, d] = queue[qi++];
    if (d > maxDepth) maxDepth = d;
    if (node.left)  queue.push([node.left,  d + 1]);
    if (node.right) queue.push([node.right, d + 1]);
  }
  return maxDepth;
}

class AATree {
  constructor() { this.root = null; }
  insert(k)  { this.root = _aaInsert(this.root, k); }
  delete(k)  { this.root = _aaDelete(this.root, k); }
  search(k)  { return _aaSearch(this.root, k); }
  height()   { return _aaHeightIter(this.root); }
  size() {
    let c = 0, s = [this.root];
    while (s.length) { const n = s.pop(); if (!n) continue; c++; s.push(n.left, n.right); }
    return c;
  }
  clear() { this.root = null; }
}
