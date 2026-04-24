require('dotenv').config();

const USER_ID = process.env.USER_ID || "your_name_ddmmyyyy";
const EMAIL_ID = process.env.EMAIL_ID || "your@college.edu";
const COLLEGE_ROLL_NUMBER = process.env.COLLEGE_ROLL_NUMBER || "YOUR_ROLL_NUMBER";

const EDGE_PATTERN = /^([A-Z])->([A-Z])$/;

function processData(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const validEdges = []; // [{from, to}]

  const seenEdges = new Set();
  const duplicateTracked = new Set();

  // Step 1 & 2: Validate and deduplicate
  for (const raw of data) {
    const entry = typeof raw === 'string' ? raw.trim() : String(raw).trim();
    const match = entry.match(EDGE_PATTERN);

    if (!match) {
      invalid_entries.push(entry);
      continue;
    }

    const [, from, to] = match;

    if (from === to) {
      invalid_entries.push(entry);
      continue;
    }

    const key = `${from}->${to}`;

    if (seenEdges.has(key)) {
      if (!duplicateTracked.has(key)) {
        duplicate_edges.push(key);
        duplicateTracked.add(key);
      }
    } else {
      seenEdges.add(key);
      validEdges.push({ from, to });
    }
  }

  // Step 3: Build adjacency
  const children = new Map(); // node -> string[]
  const parents = new Map();  // child -> first parent
  const allNodes = new Set();

  for (const { from, to } of validEdges) {
    allNodes.add(from);
    allNodes.add(to);

    if (!children.has(from)) children.set(from, []);
    if (!children.has(to)) children.set(to, []);

    // Diamond: only first-encountered parent wins
    if (!parents.has(to)) {
      parents.set(to, from);
      children.get(from).push(to);
    }
    // else: silently discard (diamond case)
  }

  // Step 4: Find connected components using Union-Find on ALL valid edges (before diamond filter)
  // We need components based on actual edges including filtered-out diamond edges
  // But we process hierarchies based on the parent-filtered graph.
  // Use BFS on parent-filtered children + reverse (parent) edges to find components.
  const componentId = new Map();
  let compCounter = 0;

  function getOrCreate(node) {
    if (!componentId.has(node)) {
      componentId.set(node, compCounter++);
    }
    return componentId.get(node);
  }

  // Union-Find
  const parent = new Map();
  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
    return parent.get(x);
  }
  function union(x, y) {
    const px = find(x), py = find(y);
    if (px !== py) parent.set(px, py);
  }

  for (const node of allNodes) find(node);
  // Union based on parent-filtered edges
  for (const [child, par] of parents) {
    union(child, par);
  }

  // Group nodes by component root
  const components = new Map();
  for (const node of allNodes) {
    const root = find(node);
    if (!components.has(root)) components.set(root, new Set());
    components.get(root).add(node);
  }

  // Step 5: Process each component
  const hierarchies = [];

  for (const [, compNodes] of components) {
    // Find roots: nodes not in parents map (within this component)
    const roots = [];
    for (const node of compNodes) {
      if (!parents.has(node)) roots.push(node);
    }

    roots.sort(); // lexicographic

    if (roots.length === 0) {
      // Pure cycle: use lex smallest node
      const cycleRoot = [...compNodes].sort()[0];
      hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
      continue;
    }

    for (const root of roots) {
      // Determine nodes reachable from this root
      const reachable = new Set();
      const queue = [root];
      reachable.add(root);
      while (queue.length) {
        const node = queue.shift();
        for (const child of (children.get(node) || [])) {
          if (!reachable.has(child)) {
            reachable.add(child);
            queue.push(child);
          }
        }
      }

      // Cycle detection via DFS
      const visiting = new Set();
      const visited = new Set();
      let hasCycle = false;

      function dfs(node) {
        visiting.add(node);
        for (const child of (children.get(node) || [])) {
          if (!reachable.has(child)) continue;
          if (visiting.has(child)) { hasCycle = true; return; }
          if (!visited.has(child)) dfs(child);
          if (hasCycle) return;
        }
        visiting.delete(node);
        visited.add(node);
      }

      dfs(root);

      if (hasCycle) {
        hierarchies.push({ root, tree: {}, has_cycle: true });
        continue;
      }

      // Build nested tree object
      function buildTree(node) {
        const obj = {};
        for (const child of (children.get(node) || [])) {
          if (reachable.has(child)) {
            obj[child] = buildTree(child);
          }
        }
        return obj;
      }

      const treeContent = buildTree(root);
      const tree = { [root]: treeContent };

      // Calculate depth (longest root-to-leaf path, counting nodes)
      function calcDepth(node) {
        const kids = (children.get(node) || []).filter(c => reachable.has(c));
        if (kids.length === 0) return 1;
        return 1 + Math.max(...kids.map(calcDepth));
      }

      const depth = calcDepth(root);
      hierarchies.push({ root, tree, depth });
    }
  }

  // Sort hierarchies: trees first (alphabetically by root), then cycles
  hierarchies.sort((a, b) => {
    const aCycle = 'has_cycle' in a;
    const bCycle = 'has_cycle' in b;
    if (aCycle !== bCycle) return aCycle ? 1 : -1;
    return a.root.localeCompare(b.root);
  });

  // Step 6: Summary
  const trees = hierarchies.filter(h => !('has_cycle' in h));
  const cycles = hierarchies.filter(h => 'has_cycle' in h);

  let largest_tree_root = "";
  if (trees.length > 0) {
    const largest = trees.reduce((best, cur) => {
      if (cur.depth > best.depth) return cur;
      if (cur.depth === best.depth && cur.root < best.root) return cur;
      return best;
    });
    largest_tree_root = largest.root;
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: trees.length,
      total_cycles: cycles.length,
      largest_tree_root,
    },
  };
}

module.exports = { processData };
