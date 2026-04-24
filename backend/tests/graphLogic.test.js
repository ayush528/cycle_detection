const { processData } = require('../src/graphLogic');

describe('processData', () => {
  test('full spec example', () => {
    const input = [
      "A->B", "A->C", "B->D", "C->E", "E->F",
      "X->Y", "Y->Z", "Z->X",
      "P->Q", "Q->R",
      "G->H", "G->H", "G->I",
      "hello", "1->2", "A->"
    ];
    const result = processData(input);

    expect(result.invalid_entries).toEqual(["hello", "1->2", "A->"]);
    expect(result.duplicate_edges).toEqual(["G->H"]);

    // hierarchies order: trees (A, G, P) then cycles (X)
    const hA = result.hierarchies.find(h => h.root === 'A');
    const hX = result.hierarchies.find(h => h.root === 'X');
    const hP = result.hierarchies.find(h => h.root === 'P');
    const hG = result.hierarchies.find(h => h.root === 'G');

    expect(hA).toBeDefined();
    expect(hA.depth).toBe(4);
    expect(hA.tree).toEqual({ A: { B: { D: {} }, C: { E: { F: {} } } } });
    expect(hA.has_cycle).toBeUndefined();

    expect(hX).toBeDefined();
    expect(hX.has_cycle).toBe(true);
    expect(hX.tree).toEqual({});
    expect(hX.depth).toBeUndefined();

    expect(hP).toBeDefined();
    expect(hP.depth).toBe(3);
    expect(hP.tree).toEqual({ P: { Q: { R: {} } } });

    expect(hG).toBeDefined();
    expect(hG.depth).toBe(2);
    expect(hG.tree).toEqual({ G: { H: {}, I: {} } });

    expect(result.summary.total_trees).toBe(3);
    expect(result.summary.total_cycles).toBe(1);
    expect(result.summary.largest_tree_root).toBe('A');
  });

  test('pure cycle detection (no root)', () => {
    const result = processData(["X->Y", "Y->Z", "Z->X"]);
    expect(result.hierarchies).toHaveLength(1);
    expect(result.hierarchies[0].root).toBe('X');
    expect(result.hierarchies[0].has_cycle).toBe(true);
    expect(result.hierarchies[0].tree).toEqual({});
    expect(result.summary.total_cycles).toBe(1);
    expect(result.summary.total_trees).toBe(0);
  });

  test('diamond case (multi-parent): second edge discarded', () => {
    const result = processData(["A->D", "B->D", "A->B"]);
    // A->D first, so D's parent = A; B->D discarded
    // Component: A, B, D all connected
    const hA = result.hierarchies.find(h => h.root === 'A');
    expect(hA).toBeDefined();
    expect(hA.tree).toEqual({ A: { D: {}, B: {} } });
    expect(result.duplicate_edges).toEqual([]);
  });

  test('self-loop is invalid', () => {
    const result = processData(["A->A", "B->C"]);
    expect(result.invalid_entries).toContain("A->A");
    expect(result.hierarchies).toHaveLength(1);
    expect(result.hierarchies[0].root).toBe('B');
  });

  test('duplicate edges tracked once', () => {
    const result = processData(["A->B", "A->B", "A->B"]);
    expect(result.duplicate_edges).toEqual(["A->B"]);
    expect(result.hierarchies[0].tree).toEqual({ A: { B: {} } });
  });

  test('empty input', () => {
    const result = processData([]);
    expect(result.hierarchies).toEqual([]);
    expect(result.invalid_entries).toEqual([]);
    expect(result.duplicate_edges).toEqual([]);
    expect(result.summary.total_trees).toBe(0);
    expect(result.summary.total_cycles).toBe(0);
    expect(result.summary.largest_tree_root).toBe('');
  });

  test('single node pair', () => {
    const result = processData(["A->B"]);
    expect(result.hierarchies).toHaveLength(1);
    expect(result.hierarchies[0].root).toBe('A');
    expect(result.hierarchies[0].depth).toBe(2);
    expect(result.hierarchies[0].tree).toEqual({ A: { B: {} } });
  });

  test('depth calculation', () => {
    const result = processData(["A->B", "B->C", "C->D"]);
    expect(result.hierarchies[0].depth).toBe(4);
  });

  test('multiple independent trees', () => {
    const result = processData(["A->B", "C->D"]);
    expect(result.hierarchies).toHaveLength(2);
    const roots = result.hierarchies.map(h => h.root).sort();
    expect(roots).toEqual(['A', 'C']);
    expect(result.summary.total_trees).toBe(2);
  });

  test('mixed trees and cycles', () => {
    const result = processData(["A->B", "X->Y", "Y->X"]);
    expect(result.summary.total_trees).toBe(1);
    expect(result.summary.total_cycles).toBe(1);
    expect(result.summary.largest_tree_root).toBe('A');
  });

  test('largest_tree_root tie-break lex smaller', () => {
    const result = processData(["A->B", "C->D"]);
    expect(result.summary.largest_tree_root).toBe('A');
  });

  test('invalid patterns', () => {
    const result = processData(["hello", "1->2", "A->", "->B", "a->b", "AB->C"]);
    expect(result.invalid_entries).toEqual(["hello", "1->2", "A->", "->B", "a->b", "AB->C"]);
    expect(result.hierarchies).toHaveLength(0);
  });
});
