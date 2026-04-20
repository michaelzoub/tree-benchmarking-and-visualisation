import { test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

for (const f of ["step-engine.js", "step-extra.js"]) {
  eval(readFileSync(join(import.meta.dir, f), "utf8"));
}
const X = globalThis.TreeStepExtra;

test("2-4 lookup finds key", () => {
  const root = { keys: [10, 20], children: [{ keys: [5, 8], children: [] }, { keys: [15], children: [] }, { keys: [25, 30], children: [] }], accessCount: [0, 0] };
  const r = X.buildTwoFourLookupSteps(root, 15);
  expect(r.ok).toBe(true);
  expect(r.steps.some((s) => s.title === "Key found" || s.reason.includes("Match"))).toBe(true);
});

test("B-tree lookup", () => {
  const root = {
    keys: [20, 40],
    isLeaf: false,
    accessCount: [0, 0],
    children: [
      { keys: [10], isLeaf: true, accessCount: [0], children: [] },
      { keys: [30], isLeaf: true, accessCount: [0], children: [] },
      { keys: [50], isLeaf: true, accessCount: [0], children: [] },
    ],
  };
  const r = X.buildBTreeLookupSteps(root, 30);
  expect(r.ok).toBe(true);
  expect(r.steps.length).toBeGreaterThan(0);
});

test("treap insert", () => {
  let t = null;
  const a = X.buildTreapInsertSteps(t, 5);
  expect(a.ok).toBe(true);
  t = X.cloneTreap(a.finalRoot);
  const b = X.buildTreapInsertSteps(t, 3);
  expect(b.ok).toBe(true);
});

test("AA insert", () => {
  let t = null;
  const a = X.buildAAInsertSteps(t, 10);
  expect(a.ok).toBe(true);
  t = X.cloneAA(a.finalRoot);
  const b = X.buildAAInsertSteps(t, 5);
  expect(b.ok).toBe(true);
});
