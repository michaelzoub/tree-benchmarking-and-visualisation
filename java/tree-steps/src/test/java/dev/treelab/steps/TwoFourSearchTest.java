package dev.treelab.steps;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;

class TwoFourSearchTest {
  @Test
  void findsKeyInSampleTree() {
    Node24 root =
        Node24.internal(
            new int[] {10, 20},
            Node24.leaf(5, 8),
            Node24.leaf(15),
            Node24.leaf(25, 30));
    List<SearchStep> steps = TwoFourSearch.lookup(root, 15);
    assertTrue(steps.stream().anyMatch(s -> s.reason().contains("Match")));
  }
}
