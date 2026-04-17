package dev.treelab.steps;

import java.util.ArrayList;
import java.util.List;

/** Step-by-step 2-4 tree search (same comparisons as trees/step-extra.js). */
public final class TwoFourSearch {
  private TwoFourSearch() {}

  public static List<SearchStep> lookup(Node24 root, int key) {
    List<SearchStep> out = new ArrayList<>();
    if (root == null) {
      out.add(new SearchStep("Empty tree", "search", "No root.", key, null, ""));
      return out;
    }
    Node24 cur = root;
    List<Integer> path = new ArrayList<>();
    while (cur != null) {
      int i = 0;
      boolean descended = false;
      while (i < cur.keys.size()) {
        int sep = cur.keys.get(i);
        out.add(
            new SearchStep(
                "At node " + cur.keys,
                "compare " + key + " with " + sep,
                key > sep
                    ? key + " > " + sep + "; continue in node."
                    : key < sep
                        ? key + " < " + sep + "; descend left of separator."
                        : "Match.",
                key,
                sep,
                pathString(path)));
        if (key == sep) {
          return out;
        }
        if (key < sep) {
          if (cur.isLeaf()) {
            out.add(new SearchStep("Not found", "leaf", "Key absent in leaf.", key, null, pathString(path)));
            return out;
          }
          path.add(i);
          out.add(
              new SearchStep(
                  "Descend",
                  "child " + i,
                  "Child holds keys < " + sep + ".",
                  key,
                  i,
                  pathString(path)));
          cur = cur.children.get(i);
          descended = true;
          break;
        }
        i++;
      }
      if (descended) {
        continue;
      }
      if (i >= cur.keys.size()) {
        if (cur.isLeaf()) {
          out.add(new SearchStep("Not found", "leaf", "Greater than all keys in leaf.", key, null, pathString(path)));
          return out;
        }
        path.add(i);
        out.add(
            new SearchStep(
                "Descend",
                "child " + i,
                "Rightmost child.",
                key,
                i,
                pathString(path)));
        cur = cur.children.get(i);
      }
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
