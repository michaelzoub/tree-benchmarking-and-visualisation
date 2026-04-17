# TreeLab — Formal Documentation

This document describes the **TreeLab** project: purpose, architecture, modules, execution model, and extension points. It is intended for instructors, contributors, and auditors.

---

## 1. Purpose and scope

**TreeLab** is a static web application for:

1. **Benchmarking** several tree implementations under configurable workloads (size, access pattern, operation type).
2. **Live visualisation** of tree shapes after insertions and simple lookups.
3. **Step-by-step educational visualisation** of insert and lookup algorithms for multiple structures, with explicit operation labels and before/after tree snapshots.

The project does **not** ship a backend server; all runtime logic in the browser is JavaScript. A **Java reference module** (`java/tree-steps/`) documents parallel algorithms and is testable with Maven; it is not compiled to the browser by default.

---

## 2. Repository layout

| Path | Role |
|------|------|
| `index.html` | Main application: benchmark mode, live insert mode, course navigation. |
| `interactive.html` | Standalone step-by-step visualiser for balanced and multi-way trees. |
| `adts.html` | ADT simulations (stacks, queues, etc.) — separate course track. |
| `graphs.html` | Graph representations and traversals — separate course track. |
| `trees/*.js` | Core tree implementations used by benchmarks and live mode. |
| `trees/benchmark.js` | Benchmark harness and key generation. |
| `trees/step-engine.js` | Step recorders: Splay (zig/zag terminology), AVL insert, Red–Black insert, BST-style lookups where applicable. |
| `trees/step-extra.js` | Step recorders: 2–4 tree, B-tree (degree *t* = 3), Treap, AA-tree. |
| `trees/interactive-app.js` | UI controller for `interactive.html` (tabs, D3 rendering, navigation). |
| `trees/*.test.js` | Unit tests runnable with **Bun**. |
| `java/tree-steps/` | Maven project: reference search steps for 2–4 and B-tree structures in Java. |

---

## 3. Runtime architecture (browser)

### 3.1 Dependencies

- **D3.js** (v7) loaded from CDN for hierarchy layout and SVG rendering.
- No bundler is required for production use; files are loaded as plain scripts in document order.

### 3.2 Script load order (`interactive.html`)

1. `d3.min.js`  
2. `trees/step-engine.js` → attaches `globalThis.TreeStepEngine`  
3. `trees/step-extra.js` → attaches `globalThis.TreeStepExtra`  
4. `trees/interactive-app.js` → initialises UI and binds controls  

### 3.3 Step model (pedagogical contract)

Each **step** is a plain object intended for UI consumption. Common fields include:

| Field | Meaning |
|-------|---------|
| `kind` | Logical structure: `splay`, `avl`, `rb`, `twofour`, `btree`, `treap`, `aa`. |
| `title`, `op`, `opLabel` | Short headings for the sidebar. |
| `reason`, `alignment` | Plain-language explanation and invariant / alignment commentary. |
| `before`, `after` | **Immutable snapshots** of the whole tree (or subtree context) before and after the micro-operation. |
| `x`, `y`, `z` | Pedagogical roles (e.g. focus node, parent, grandparent) where relevant; for multi-way trees, `highlightPath` may identify the active node in the hierarchy. |

Snapshots for BST-shaped trees mirror in-memory node shape without parent pointers in JSON. Red–Black snapshots omit sentinel identity but preserve colours. Multi-way snapshots use `{ type, root }` with `root.keys[]` and `root.children[]`.

---

## 4. Core tree implementations (`trees/*.js`)

These classes are optimised for **large *N*** in benchmark mode (iterative height, iterative search where noted). They are **not** automatically instrumented; the step engines in `step-engine.js` and `step-extra.js` implement **parallel** logic on **cloned** structures so recording does not corrupt benchmark instances.

| File | Structure | Notes |
|------|-----------|--------|
| `avl.js` | AVL tree | Height field; iterative insert. |
| `redblack.js` | Red–Black tree | Cormen-style; sentinel NIL. |
| `splay.js` | Splay tree | Top-down splay (Sleator/Tarjan style) for production; **step visualiser uses bottom-up splay** with zig/zig-zig/zig-zag for teaching alignment. |
| `twofour.js` | 2–4 tree | Order 4 B-tree variant. |
| `btree.js` | B-tree | Minimum degree `t = 3`. |
| `treap.js` | Treap | Random priorities in production code. |
| `aatree.js` | AA tree | Skew/split rebalancing. |

---

## 5. Step engines

### 5.1 `trees/step-engine.js` (`TreeStepEngine`)

- **Splay:** Insert then splay; lookup then splay (found node or last visited on miss). Single-step macro-operations use **zig** / **zag** naming for single rotations at the parent when it is the root, and **zig-zig** / **zig-zag** for the two-macro-rotation cases.
- **AVL:** Insert with post-path height updates; at most one restructuring site per insertion in the recorded trace. Lookup is BST walk only (no rotations).
- **Red–Black:** Insert with fixup steps (recolour vs rotation cases). Lookup is BST walk with node colour in snapshots.

Exported helpers include **deep clone** functions for replayable state in the UI.

### 5.2 `trees/step-extra.js` (`TreeStepExtra`)

- **2–4 tree:** Lookup steps compare the search key against separators in order, then descend by child index; insert steps include full-child splits before descent where applicable.
- **B-tree:** Same pattern with arity governed by `t = 3`.
- **Treap:** Deterministic priority derived from the key for **reproducible** step sequences in the UI (distinct from `Math.random()` in `treap.js` used elsewhere).
- **AA tree:** Insert with skew/split steps when they change structure; lookup is BST walk.

---

## 6. Interactive application (`interactive.html` + `interactive-app.js`)

- **Mode tabs** select which structure’s state machine is active. **Reset** clears all in-memory roots for every structure (isolated didactic sessions per mode switch).
- **Operations:** Insert and Lookup dispatch to the appropriate builder; results are a linear **list of steps** navigated with **Previous** / **Next**.
- **Rendering:** Binary trees use circular nodes; 2–4 and B-tree nodes use **rounded rectangles** and wider horizontal spacing. Zoom/pan is bound via D3 on each SVG panel.

---

## 7. Java reference module (`java/tree-steps/`)

- **Build:** `mvn test` (requires JDK 17+).
- **Contents:** Immutable-style records for narrated search steps; `TwoFourSearch` and `BTreeSearch` mirror the comparison order used in `step-extra.js` for teaching alignment.
- **Browser integration:** Not enabled by default. Optional approaches: compile a subset with **TeaVM**, expose JSON over a small HTTP service, or keep Java as audit-only reference.

---

## 8. Testing

| Command | Scope |
|---------|--------|
| `bun test trees/step-engine.test.js` | Splay, AVL, RB step smoke tests. |
| `bun test trees/step-extra.test.js` | 2–4, B-tree, Treap, AA step smoke tests. |
| `mvn -q test` inside `java/tree-steps/` | Java unit tests. |

---

## 9. Pedagogical positioning (informative)

The step visualiser supports learning objectives commonly associated with **ordered maps and balanced BSTs**: distinguishing **height** from **size**, observing **degenerate** vs **balanced** behaviour, and separating **splay** macro-steps from **AVL** rotation cases. Multi-way trees illustrate **search by index within a node** and **descent by child pointer**, which relates informally to the notion of a **logical position** in a tree (distinct from a contiguous array index).

---

## 10. Versioning and contribution

- **Style:** Prefer minimal, task-scoped diffs; match existing naming and layout patterns in HTML/CSS/JS.
- **External course packs:** Dropbox or other private URLs are not fetched by maintainers; if algorithms must match a specific handout, supply files or excerpts in-repo or in issue text.

---

## 11. Licence and attribution

Refer to the repository root **LICENSE** (if present) or project metadata for licence terms. Third-party **D3** is used under its licence; retain CDN attribution in distributed copies.

---

*Document version: 1.0 — maintained with the codebase.*
