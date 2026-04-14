// Red-Black Tree — classic Cormen algorithm with parent pointers.
// Invariants: (1) every node RED or BLACK, (2) root BLACK,
// (3) no two consecutive RED nodes, (4) equal black-height on all paths.
// Height guaranteed ≤ 2·log₂(n+1).
// height() is iterative (BFS) — no call-stack overflow.

function _rbNIL() {
  const n = {};
  n.key = 0; n.color = 'BLACK'; n.isNIL = true;
  n.accessCount = 0; n.left = n; n.right = n; n.parent = n;
  return n;
}
function _rbNode(key, NIL) {
  return { key, color: 'RED', left: NIL, right: NIL, parent: NIL, accessCount: 0, isNIL: false };
}

class RedBlackTree {
  constructor() {
    this.NIL = _rbNIL();
    this.root = this.NIL;
  }

  _rotL(x) {
    const y = x.right; x.right = y.left;
    if (!y.left.isNIL) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent.isNIL) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x; x.parent = y;
  }
  _rotR(y) {
    const x = y.left; y.left = x.right;
    if (!x.right.isNIL) x.right.parent = y;
    x.parent = y.parent;
    if (y.parent.isNIL) this.root = x;
    else if (y === y.parent.right) y.parent.right = x;
    else y.parent.left = x;
    x.right = y; y.parent = x;
  }

  _insertFix(z) {
    while (z.parent.color === 'RED') {
      if (z.parent === z.parent.parent.left) {
        const y = z.parent.parent.right;
        if (y.color === 'RED') {
          z.parent.color = 'BLACK'; y.color = 'BLACK';
          z.parent.parent.color = 'RED'; z = z.parent.parent;
        } else {
          if (z === z.parent.right) { z = z.parent; this._rotL(z); }
          z.parent.color = 'BLACK'; z.parent.parent.color = 'RED';
          this._rotR(z.parent.parent);
        }
      } else {
        const y = z.parent.parent.left;
        if (y.color === 'RED') {
          z.parent.color = 'BLACK'; y.color = 'BLACK';
          z.parent.parent.color = 'RED'; z = z.parent.parent;
        } else {
          if (z === z.parent.left) { z = z.parent; this._rotR(z); }
          z.parent.color = 'BLACK'; z.parent.parent.color = 'RED';
          this._rotL(z.parent.parent);
        }
      }
    }
    this.root.color = 'BLACK';
  }

  insert(key) {
    const z = _rbNode(key, this.NIL);
    let y = this.NIL, x = this.root;
    while (!x.isNIL) {
      y = x;
      if (z.key < x.key) x = x.left;
      else if (z.key > x.key) x = x.right;
      else return; // duplicate
    }
    z.parent = y;
    if (y.isNIL) this.root = z;
    else if (z.key < y.key) y.left = z;
    else y.right = z;
    this._insertFix(z);
  }

  _transplant(u, v) {
    if (u.parent.isNIL) this.root = v;
    else if (u === u.parent.left) u.parent.left = v;
    else u.parent.right = v;
    v.parent = u.parent;
  }

  _deleteFix(x) {
    while (x !== this.root && x.color === 'BLACK') {
      if (x === x.parent.left) {
        let w = x.parent.right;
        if (w.color === 'RED') {
          w.color = 'BLACK'; x.parent.color = 'RED';
          this._rotL(x.parent); w = x.parent.right;
        }
        if (w.left.color === 'BLACK' && w.right.color === 'BLACK') {
          w.color = 'RED'; x = x.parent;
        } else {
          if (w.right.color === 'BLACK') {
            w.left.color = 'BLACK'; w.color = 'RED';
            this._rotR(w); w = x.parent.right;
          }
          w.color = x.parent.color; x.parent.color = 'BLACK';
          w.right.color = 'BLACK'; this._rotL(x.parent); x = this.root;
        }
      } else {
        let w = x.parent.left;
        if (w.color === 'RED') {
          w.color = 'BLACK'; x.parent.color = 'RED';
          this._rotR(x.parent); w = x.parent.left;
        }
        if (w.right.color === 'BLACK' && w.left.color === 'BLACK') {
          w.color = 'RED'; x = x.parent;
        } else {
          if (w.left.color === 'BLACK') {
            w.right.color = 'BLACK'; w.color = 'RED';
            this._rotL(w); w = x.parent.left;
          }
          w.color = x.parent.color; x.parent.color = 'BLACK';
          w.left.color = 'BLACK'; this._rotR(x.parent); x = this.root;
        }
      }
    }
    x.color = 'BLACK';
  }

  delete(key) {
    let z = this.root;
    while (!z.isNIL) {
      if (key < z.key) z = z.left;
      else if (key > z.key) z = z.right;
      else break;
    }
    if (z.isNIL) return;
    let y = z, yOrig = y.color, x;
    if (z.left.isNIL) { x = z.right; this._transplant(z, z.right); }
    else if (z.right.isNIL) { x = z.left; this._transplant(z, z.left); }
    else {
      y = z.right; while (!y.left.isNIL) y = y.left;
      yOrig = y.color; x = y.right;
      if (y.parent === z) x.parent = y;
      else {
        this._transplant(y, y.right); y.right = z.right; y.right.parent = y;
      }
      this._transplant(z, y); y.left = z.left; y.left.parent = y; y.color = z.color;
    }
    if (yOrig === 'BLACK') this._deleteFix(x);
  }

  // Iterative search — O(log n), no call-stack risk
  search(key) {
    let x = this.root;
    while (!x.isNIL) {
      if (key < x.key) x = x.left;
      else if (key > x.key) x = x.right;
      else { x.accessCount++; return true; }
    }
    return false;
  }

  // Iterative BFS height — O(n) but no recursion, safe for any N
  height() {
    if (this.root.isNIL) return 0;
    let maxDepth = 0;
    const queue = [[this.root, 1]];
    let qi = 0;
    while (qi < queue.length) {
      const [node, d] = queue[qi++];
      if (d > maxDepth) maxDepth = d;
      if (!node.left.isNIL)  queue.push([node.left,  d + 1]);
      if (!node.right.isNIL) queue.push([node.right, d + 1]);
    }
    return maxDepth;
  }

  size() {
    let c = 0, s = [this.root];
    while (s.length) { const n = s.pop(); if (n.isNIL) continue; c++; s.push(n.left, n.right); }
    return c;
  }
  clear() { this.root = this.NIL; }
  getNIL() { return this.NIL; }
}
