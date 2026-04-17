package dev.treelab.steps;

/** One narrated step in a search (matches JS step shape loosely). */
public record SearchStep(String title, String opLabel, String reason, int key, Integer comparedTo, String path) {}
