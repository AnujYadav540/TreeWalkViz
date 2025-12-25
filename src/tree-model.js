// ============================================================
// BINARY TREE MODEL
// ============================================================

/**
 * Represents a node in the binary tree
 */
export class TreeNode {
    constructor(value, left = null, right = null) {
        this.value = value;
        this.left = left;
        this.right = right;
        this.x = 0;  // Computed x position for rendering
        this.y = 0;  // Computed y position for rendering
    }
}

/**
 * Creates the default 7-node binary tree
 * Structure:
 *        4
 *       / \
 *      2   6
 *     / \ / \
 *    1  3 5  7
 */
export function createDefaultTree() {
    const root = new TreeNode(4);
    root.left = new TreeNode(2);
    root.right = new TreeNode(6);
    root.left.left = new TreeNode(1);
    root.left.right = new TreeNode(3);
    root.right.left = new TreeNode(5);
    root.right.right = new TreeNode(7);
    return root;
}

/**
 * Computes x,y positions for all nodes based on canvas dimensions
 * Uses a level-order layout where:
 * - Root is centered horizontally
 * - Each level doubles the horizontal spread
 * - Vertical spacing is fixed between levels
 * 
 * @param {TreeNode} root - The root of the tree
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function computeNodePositions(root, width, height) {
    if (!root) return;

    const verticalSpacing = height / 4;  // Space between levels
    const nodeRadius = 25;
    const topPadding = nodeRadius + 20;

    // Helper function to compute positions recursively
    function computePositions(node, level, leftBound, rightBound) {
        if (!node) return;

        // Center the node horizontally within its bounds
        const x = (leftBound + rightBound) / 2;
        const y = topPadding + level * verticalSpacing;

        node.x = x;
        node.y = y;

        // Recursively position children
        const midpoint = (leftBound + rightBound) / 2;
        computePositions(node.left, level + 1, leftBound, midpoint);
        computePositions(node.right, level + 1, midpoint, rightBound);
    }

    computePositions(root, 0, 0, width);
}

/**
 * Gets all nodes in the tree as a flat array (for iteration)
 * @param {TreeNode} root - The root of the tree
 * @returns {TreeNode[]} Array of all nodes
 */
export function getAllNodes(root) {
    const nodes = [];
    function traverse(node) {
        if (!node) return;
        nodes.push(node);
        traverse(node.left);
        traverse(node.right);
    }
    traverse(root);
    return nodes;
}

/**
 * Finds a node by its value
 * @param {TreeNode} root - The root of the tree
 * @param {number} value - The value to find
 * @returns {TreeNode|null} The found node or null
 */
export function findNode(root, value) {
    if (!root) return null;
    if (root.value === value) return root;
    return findNode(root.left, value) || findNode(root.right, value);
}

/**
 * Gets the depth (height) of the tree
 * @param {TreeNode} root - The root of the tree
 * @returns {number} The depth of the tree
 */
export function getTreeDepth(root) {
    if (!root) return 0;
    return 1 + Math.max(getTreeDepth(root.left), getTreeDepth(root.right));
}

/**
 * Counts the total number of nodes in the tree
 * @param {TreeNode} root - The root of the tree
 * @returns {number} The number of nodes
 */
export function countNodes(root) {
    if (!root) return 0;
    return 1 + countNodes(root.left) + countNodes(root.right);
}

/**
 * Gets all edges (parent-child connections) in the tree
 * @param {TreeNode} root - The root of the tree
 * @returns {Array<{parent: TreeNode, child: TreeNode}>} Array of edges
 */
export function getAllEdges(root) {
    const edges = [];
    function traverse(node) {
        if (!node) return;
        if (node.left) {
            edges.push({ parent: node, child: node.left });
            traverse(node.left);
        }
        if (node.right) {
            edges.push({ parent: node, child: node.right });
            traverse(node.right);
        }
    }
    traverse(root);
    return edges;
}
