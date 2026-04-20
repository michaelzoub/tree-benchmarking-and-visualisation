package dev.treelab.steps;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** Mutable 2-4 tree node (1–3 keys, 0 or 2–4 children). */
public final class Node24 {
  public final List<Integer> keys = new ArrayList<>();
  public final List<Node24> children = new ArrayList<>();

  public boolean isLeaf() {
    return children.isEmpty();
  }

  public static Node24 leaf(int... ks) {
    Node24 n = new Node24();
    for (int k : ks) {
      n.keys.add(k);
    }
    return n;
  }

  public static Node24 internal(int[] ks, Node24... ch) {
    Node24 n = new Node24();
    for (int k : ks) {
      n.keys.add(k);
    }
    Collections.addAll(n.children, ch);
    return n;
  }
}
