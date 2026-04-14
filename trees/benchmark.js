// Benchmark engine — key generation, per-tree timing, N-sweep.
//
// Critical design decisions:
//
//   1. height() is sampled OUTSIDE the timed loop.
//      Previously sampling RB height() (O(n) BFS) inside the loop added
//      massive overhead to RB but not AVL (whose height() is O(1)).
//      Now: all ops are timed first, then height is measured afterward.
//
//   2. JIT warmup: a short warmup run is executed before each benchmark
//      so V8 has a chance to JIT-compile the hot tree functions.
//      Without this, small-N runs are slow (interpreted) while large-N
//      runs appear fast (compiled), producing the paradoxical throughput
//      curve where 100k > 2k.
//
//   3. All height() implementations are iterative BFS (no recursion).
//      This prevents call-stack overflow on sequential inputs where
//      Splay can degenerate to height = N.

// ─── Key generation ────────────────────────────────────────────────────────

function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateKeys(n, pattern, customData) {
  if (customData && customData.length > 0) {
    const d = [...customData].slice(0, n);
    while (d.length < n) d.push(d[Math.floor(Math.random() * d.length)]);
    return d;
  }
  const base = Array.from({ length: n }, (_, i) => i + 1);
  if (pattern === 'sequential') return base;
  if (pattern === 'uniform') return _shuffle(base);
  // skewed / Zipf: 80 % of ops hit the hottest 20 % of keys
  const hot = base.slice(0, Math.floor(n * 0.2));
  const keys = [];
  const hotCount = Math.floor(n * 0.8), coldCount = n - hotCount;
  for (let i = 0; i < hotCount; i++) keys.push(hot[Math.floor(Math.random() * hot.length)]);
  for (let i = 0; i < coldCount; i++) keys.push(base[Math.floor(Math.random() * base.length)]);
  return _shuffle(keys);
}

// ─── Tree factory ──────────────────────────────────────────────────────────

function makeTree(type) {
  switch (type) {
    case 'avl':      return new AVLTree();
    case 'redblack': return new RedBlackTree();
    case 'splay':    return new SplayTree();
    case 'twofour':  return new TwoFourTree();
  }
}

// ─── JIT warmup ────────────────────────────────────────────────────────────
// Run a short fixed-size benchmark on all enabled trees before measurement.
// This ensures V8 has compiled the hot paths before the real timing starts.

function _warmup(treeTypes) {
  const WN = 512;
  const wkeys = _shuffle(Array.from({ length: WN }, (_, i) => i + 1));
  for (const t of treeTypes) {
    const tree = makeTree(t);
    for (const k of wkeys) tree.insert(k);
    for (const k of wkeys) tree.search(k);
    for (const k of wkeys) tree.delete(k);
  }
}

// ─── Single-tree benchmark ─────────────────────────────────────────────────
// Heights are sampled AFTER the timed loop (not inside it), so RB's O(n)
// height scan doesn't inflate its totalMs vs AVL's O(1) height.

function _benchTree(treeType, keys, operation, numSamples) {
  const tree = makeTree(treeType);
  const n    = keys.length;

  // Pre-populate for lookup / delete
  if (operation !== 'insert') for (const k of keys) tree.insert(k);

  // ── TIMED REGION ──────────────────────────────────────────────
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const k = keys[i];
    if      (operation === 'insert') tree.insert(k);
    else if (operation === 'lookup') tree.search(k);
    else                             tree.delete(k);
  }
  const totalMs = performance.now() - t0;
  // ─────────────────────────────────────────────────────────────

  // Collect splay access counts
  const splayCounts = new Map();
  if (treeType === 'splay') {
    const stk = [tree.root];
    while (stk.length) {
      const nd = stk.pop(); if (!nd) continue;
      if (nd.accessCount > 0) splayCounts.set(nd.key, nd.accessCount);
      stk.push(nd.left, nd.right);
    }
  }

  return { totalMs, finalHeight: tree.height(), splayCounts, treeRef: tree };
}

// ─── Height-over-time sampling (separate pass, not in timed region) ────────
// Rebuilds the tree in a second pass just to collect height snapshots.
// This keeps the timed benchmark clean.

function _heightSamples(treeType, keys, operation, numSamples) {
  const tree = makeTree(treeType);
  const n    = keys.length;
  const step = Math.max(1, Math.floor(n / numSamples));
  const samples = [];

  if (operation !== 'insert') for (const k of keys) tree.insert(k);
  for (let i = 0; i < n; i++) {
    const k = keys[i];
    if      (operation === 'insert') tree.insert(k);
    else if (operation === 'lookup') tree.search(k);
    else                             tree.delete(k);
    if ((i + 1) % step === 0 || i === n - 1) {
      samples.push({ batch: Math.floor((i + 1) / step), height: tree.height() });
    }
  }
  return samples;
}

// ─── Public API ────────────────────────────────────────────────────────────

const NUM_SAMPLES = 40; // height snapshots per run

function runBenchmark(config) {
  const { n, pattern, operation, trees: treeTypes, customData } = config;

  _warmup(treeTypes);

  const keys = generateKeys(n, pattern, customData);
  const results = [];
  const splayAccessCounts = new Map();
  const treeRefs = {};

  for (const treeType of treeTypes) {
    const keyCopy = [...keys];
    const { totalMs, finalHeight, splayCounts, treeRef } =
      _benchTree(treeType, keyCopy, operation, NUM_SAMPLES);

    const heightSamples = _heightSamples(treeType, [...keys], operation, NUM_SAMPLES);

    results.push({
      tree: treeType,
      totalMs,
      opsPerMs: n / Math.max(totalMs, 0.001),
      finalHeight,
      heightSamples,
    });

    if (treeType === 'splay') splayCounts.forEach((v, k) => splayAccessCounts.set(k, v));
    treeRefs[treeType] = treeRef;
  }

  return { config, results, splayAccessCounts, treeRefs };
}

const N_SWEEP = [500, 1000, 2000, 5000, 10000, 20000, 50000];

function runSweep(nValues, pattern, operation, trees) {
  // Warmup once before the whole sweep
  _warmup(trees);
  const points = [];
  for (const n of nValues) {
    const keys = generateKeys(n, pattern);
    for (const t of trees) {
      const { totalMs } = _benchTree(t, [...keys], operation, 0);
      points.push({ n, tree: t, opsPerMs: n / Math.max(totalMs, 0.001) });
    }
  }
  return points;
}
