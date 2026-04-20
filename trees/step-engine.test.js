import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const enginePath = join(import.meta.dir, "step-engine.js");
eval(readFileSync(enginePath, "utf8"));
const E = globalThis.TreeStepEngine;

test("splay insert produces root with key", () => {
  let r = null;
  for (const k of [5, 3, 8, 1]) {
    const res = E.buildSplayInsertSteps(r, k);
    expect(res.ok).toBe(true);
    r = E.cloneSplay(res.finalRoot);
  }
  expect(r.key).toBe(1);
});

test("AVL insert balances", () => {
  let r = null;
  for (const k of [1, 2, 3]) {
    const res = E.buildAVLInsertSteps(r, k);
    expect(res.ok).toBe(true);
    r = E.cloneAVL(res.finalRoot);
  }
  const bf = (n) => {
    if (!n) return 0;
    const lh = n.left ? n.left.height : 0;
    const rh = n.right ? n.right.height : 0;
    return lh - rh;
  };
  const check = (n) => {
    if (!n) return;
    expect(Math.abs(bf(n))).toBeLessThanOrEqual(1);
    check(n.left);
    check(n.right);
  };
  check(r);
});

test("RB insert leaves valid black root", () => {
  const rec = new E.RBRecorder();
  for (const k of [10, 20, 30, 15, 5, 25]) {
    const res = E.buildRBInsertStepsFrom(rec, k);
    expect(res.ok).toBe(true);
  }
  expect(rec.root.color).toBe("BLACK");
});
