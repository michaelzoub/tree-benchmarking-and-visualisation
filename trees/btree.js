// B-Tree with minimum degree t=3 (each non-root node has t-1..2t-1 keys, t..2t children).
// All leaves at the same depth. Splits on overflow, merges/borrows on underflow.
// The 2-4 Tree is a special case with t=2; this uses t=3 (order-6 B-tree).

const _BT = 3; // minimum degree

function _btNode(isLeaf) {
  return { keys: [], children: [], isLeaf, accessCount: [] };
}

function _btSplitChild(parent, i) {
  const full = parent.children[i];
  const mid  = full.keys[_BT - 1];
  const midAC = full.accessCount[_BT - 1];

  const right = _btNode(full.isLeaf);
  right.keys = full.keys.splice(_BT, _BT - 1);   // keys after mid
  right.accessCount = full.accessCount.splice(_BT, _BT - 1);
  if (!full.isLeaf) {
    right.children = full.children.splice(_BT, _BT);
  }
  full.keys.pop();        // remove mid from full (it moves up)
  full.accessCount.pop();

  parent.keys.splice(i, 0, mid);
  parent.accessCount.splice(i, 0, midAC);
  parent.children.splice(i + 1, 0, right);
}

function _btInsertNonFull(node, key) {
  let i = node.keys.length - 1;
  if (node.isLeaf) {
    while (i >= 0 && key < node.keys[i]) i--;
    if (i >= 0 && node.keys[i] === key) return; // duplicate
    node.keys.splice(i + 1, 0, key);
    node.accessCount.splice(i + 1, 0, 0);
  } else {
    while (i >= 0 && key < node.keys[i]) i--;
    if (i >= 0 && node.keys[i] === key) return; // duplicate
    i++;
    if (node.children[i].keys.length === 2 * _BT - 1) {
      _btSplitChild(node, i);
      if (key > node.keys[i]) i++;
      if (key === node.keys[i]) return; // duplicate at split point
    }
    _btInsertNonFull(node.children[i], key);
  }
}

function _btSearch(node, key) {
  if (!node) return false;
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;
  if (i < node.keys.length && node.keys[i] === key) {
    node.accessCount[i]++;
    return true;
  }
  if (node.isLeaf) return false;
  return _btSearch(node.children[i], key);
}

// Returns the node + index that contains key, plus the path for highlight purposes
function _btFind(node, key) {
  if (!node) return null;
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;
  if (i < node.keys.length && node.keys[i] === key) return { node, i };
  if (node.isLeaf) return null;
  return _btFind(node.children[i], key);
}

function _btGetPredecessor(node) {
  while (!node.isLeaf) node = node.children[node.children.length - 1];
  return node.keys[node.keys.length - 1];
}

function _btGetSuccessor(node) {
  while (!node.isLeaf) node = node.children[0];
  return node.keys[0];
}

function _btMerge(parent, i) {
  const left  = parent.children[i];
  const right = parent.children[i + 1];
  left.keys.push(parent.keys[i], ...right.keys);
  left.accessCount.push(parent.accessCount[i], ...right.accessCount);
  if (!left.isLeaf) left.children.push(...right.children);
  parent.keys.splice(i, 1);
  parent.accessCount.splice(i, 1);
  parent.children.splice(i + 1, 1);
}

function _btDelete(node, key) {
  const t = _BT;
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]) i++;

  if (i < node.keys.length && node.keys[i] === key) {
    // Key is in this node
    if (node.isLeaf) {
      node.keys.splice(i, 1);
      node.accessCount.splice(i, 1);
    } else {
      const left  = node.children[i];
      const right = node.children[i + 1];
      if (left.keys.length >= t) {
        const pred = _btGetPredecessor(left);
        node.keys[i] = pred; node.accessCount[i] = 0;
        _btDelete(left, pred);
      } else if (right.keys.length >= t) {
        const succ = _btGetSuccessor(right);
        node.keys[i] = succ; node.accessCount[i] = 0;
        _btDelete(right, succ);
      } else {
        _btMerge(node, i);
        _btDelete(node.children[i], key);
      }
    }
  } else {
    if (node.isLeaf) return; // key not found
    const isLast = (i === node.children.length - 1);
    const child  = node.children[i];

    if (child.keys.length < t) {
      const lSib = i > 0 ? node.children[i - 1] : null;
      const rSib = i < node.children.length - 1 ? node.children[i + 1] : null;
      if (lSib && lSib.keys.length >= t) {
        child.keys.unshift(node.keys[i - 1]);
        child.accessCount.unshift(0);
        node.keys[i - 1] = lSib.keys.pop();
        node.accessCount[i - 1] = lSib.accessCount.pop() ?? 0;
        if (!lSib.isLeaf) child.children.unshift(lSib.children.pop());
      } else if (rSib && rSib.keys.length >= t) {
        child.keys.push(node.keys[i]);
        child.accessCount.push(0);
        node.keys[i] = rSib.keys.shift();
        node.accessCount[i] = rSib.accessCount.shift() ?? 0;
        if (!rSib.isLeaf) child.children.push(rSib.children.shift());
      } else {
        if (lSib) { _btMerge(node, i - 1); _btDelete(node.children[i - 1], key); return; }
        else      { _btMerge(node, i);     _btDelete(node.children[i],     key); return; }
      }
    }
    _btDelete(node.children[i], key);
  }
}

class BTree {
  constructor() { this.root = null; }

  insert(key) {
    if (!this.root) {
      this.root = _btNode(true);
      this.root.keys = [key];
      this.root.accessCount = [0];
      return;
    }
    if (this.root.keys.length === 2 * _BT - 1) {
      const newRoot = _btNode(false);
      newRoot.children = [this.root];
      _btSplitChild(newRoot, 0);
      this.root = newRoot;
    }
    _btInsertNonFull(this.root, key);
  }

  delete(key) {
    if (!this.root) return;
    _btDelete(this.root, key);
    if (this.root.keys.length === 0) {
      this.root = this.root.isLeaf ? null : this.root.children[0];
    }
  }

  search(key) { return _btSearch(this.root, key); }

  // Returns path of nodes visited when searching for key (for highlight)
  searchPath(key) {
    const path = [];
    let node = this.root;
    while (node) {
      path.push(node);
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      if (i < node.keys.length && node.keys[i] === key) return { path, found: true, foundNode: node, foundIdx: i };
      if (node.isLeaf) return { path, found: false };
      node = node.children[i];
    }
    return { path, found: false };
  }

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
