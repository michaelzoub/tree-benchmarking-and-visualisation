package dev.treelab.steps;

import java.util.ArrayList;
import java.util.List;

/** Minimal B-tree node for teaching (keys + children + isLeaf). */
public final class BTreeNode {
  public final List<Integer> keys = new ArrayList<>();
  public final List<BTreeNode> children = new ArrayList<>();
  public boolean isLeaf = true;

  public static BTreeNode leaf(int... ks) {
    BTreeNode n = new BTreeNode();
    n.isLeaf = true;
    for (int k : ks) {
      n.keys.add(k);
    }
    return n;
  }

  public static BTreeNode internal(int[] ks, BTreeNode... ch) {
    BTreeNode n = new BTreeNode();
    n.isLeaf = false;
    for (int k : ks) {
      n.keys.add(k);
    }
    for (BTreeNode c : ch) {
      n.children.add(c);
    }
    return n;
  }
}
