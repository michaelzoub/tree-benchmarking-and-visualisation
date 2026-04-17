package dev.treelab.steps;

import java.util.ArrayList;
import java.util.List;

/** Step-by-step B-tree search (same scan as trees/step-extra.js). */
public final class BTreeSearch {
  private BTreeSearch() {}

  public static List<SearchStep> lookup(BTreeNode root, int key) {
    List<SearchStep> out = new ArrayList<>();
    if (root == null) {
      out.add(new SearchStep("Empty tree", "search", "No root.", key, null, ""));
      return out;
    }
    BTreeNode node = root;
    List<Integer> path = new ArrayList<>();
    while (node != null) {
      int i = 0;
      while (i < node.keys.size() && key > node.keys.get(i)) {
        int k = node.keys.get(i);
        out.add(
            new SearchStep(
                "At node " + node.keys,
                key + " > " + k + "?",
                "Scan: " + key + " greater than " + k + ".",
                key,
                k,
                pathString(path)));
        i++;
      }
      if (i < node.keys.size() && node.keys.get(i) == key) {
        out.add(new SearchStep("Found", "match", "Key at index " + i + ".", key, i, pathString(path)));
        return out;
      }
      if (node.isLeaf) {
        out.add(new SearchStep("Not found", "leaf", "Key not in tree.", key, null, pathString(path)));
        return out;
      }
      path.add(i);
      out.add(
          new SearchStep(
              "Descend",
              "child " + i,
              "Enter subtree for slot " + i + ".",
              key,
              i,
              pathString(path)));
      node = node.children.get(i);
    }
    return out;
  }

  private static String pathString(List<Integer> path) {
    if (path.isEmpty()) {
      return "root";
    }
    StringBuilder sb = new StringBuilder();
    for (int j = 0; j < path.size(); j++) {
      if (j > 0) {
        sb.append('/');
      }
      sb.append(path.get(j));
    }
    return sb.toString();
  }
}
