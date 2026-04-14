// Splay Tree — top-down splay algorithm (Allen & Sleator).
// No balance field; every access splays the touched key to the root.
// Amortized O(log n) per operation; excellent locality for skewed patterns.
// height() is iterative BFS — safe for any N (splay trees can be very deep).

function _splayRotR(x) { const y = x.left;  x.left  = y.right; y.right = x; return y; }
function _splayRotL(x) { const y = x.right; x.right = y.left;  y.left  = x; return y; }

// Top-down splay: brings key (or its predecessor/successor) to root.
function _splay(root, key) {
  if (!root) return null;
  const hdr = { key: 0, left: null, right: null, accessCount: 0, recentlyAccessed: false };
  let l = hdr, r = hdr, t = root;
  while (true) {
    if (key < t.key) {
      if (!t.left) break;
      if (key < t.left.key) { t = _splayRotR(t); if (!t.left) break; } // zig-zig
      r.left = t; r = t; t = t.left;                                    // link right
    } else if (key > t.key) {
      if (!t.right) break;
      if (key > t.right.key) { t = _splayRotL(t); if (!t.right) break; } // zig-zig
      l.right = t; l = t; t = t.right;                                    // link left
    } else break;
  }
  l.right = t.left; r.left = t.right; t.left = hdr.right; t.right = hdr.left;
  return t;
}

function _splayNode(key) {
  return { key, left: null, right: null, accessCount: 0, recentlyAccessed: false };
}

class SplayTree {
  constructor() { this.root = null; }

  insert(key) {
    this.root = _splay(this.root, key);
    if (!this.root) { this.root = _splayNode(key); return; }
    if (this.root.key === key) return; // duplicate
    const n = _splayNode(key);
    if (key < this.root.key) {
      n.right = this.root; n.left = this.root.left; this.root.left = null;
    } else {
      n.left = this.root; n.right = this.root.right; this.root.right = null;
    }
    this.root = n;
  }

  delete(key) {
    this.root = _splay(this.root, key);
    if (!this.root || this.root.key !== key) return;
    if (!this.root.left) {
      this.root = this.root.right;
    } else {
      const right = this.root.right;
      this.root = _splay(this.root.left, key);
      if (this.root) this.root.right = right;
    }
  }

  search(key) {
    this.root = _splay(this.root, key);
    if (this.root && this.root.key === key) {
      this.root.accessCount++;
      this.root.recentlyAccessed = true;
      return true;
    }
    return false;
  }

  // Iterative BFS height — safe even when splay tree degenerates to O(n) depth
  height() {
    if (!this.root) return 0;
    let maxDepth = 0;
    const queue = [[this.root, 1]];
    let qi = 0;
    while (qi < queue.length) {
      const [node, d] = queue[qi++];
      if (d > maxDepth) maxDepth = d;
      if (node.left)  queue.push([node.left,  d + 1]);
      if (node.right) queue.push([node.right, d + 1]);
    }
    return maxDepth;
  }

  size() {
    let c = 0, s = [this.root];
    while (s.length) { const n = s.pop(); if (!n) continue; c++; s.push(n.left, n.right); }
    return c;
  }
  clear() { this.root = null; }
}
