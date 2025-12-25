// ============================================================
// TRAVERSAL GENERATORS
// ============================================================

import { ExecutionStep } from './execution-step.js';

/**
 * Code line numbers for Inorder traversal:
 * 1: void inOrder(Node node) {
 * 2:     if (node == null) return;
 * 3:     inOrder(node.left);
 * 4:     print(node.val);
 * 5:     inOrder(node.right);
 * 6: }
 */
const INORDER_LINES = {
    FUNCTION_ENTRY: 1,
    NULL_CHECK: 2,
    RECURSE_LEFT: 3,
    PROCESS: 4,
    RECURSE_RIGHT: 5,
    FUNCTION_EXIT: 6
};

/**
 * Code line numbers for Preorder traversal:
 * 1: void preOrder(Node node) {
 * 2:     if (node == null) return;
 * 3:     print(node.val);
 * 4:     preOrder(node.left);
 * 5:     preOrder(node.right);
 * 6: }
 */
const PREORDER_LINES = {
    FUNCTION_ENTRY: 1,
    NULL_CHECK: 2,
    PROCESS: 3,
    RECURSE_LEFT: 4,
    RECURSE_RIGHT: 5,
    FUNCTION_EXIT: 6
};

/**
 * Code line numbers for Postorder traversal:
 * 1: void postOrder(Node node) {
 * 2:     if (node == null) return;
 * 3:     postOrder(node.left);
 * 4:     postOrder(node.right);
 * 5:     print(node.val);
 * 6: }
 */
const POSTORDER_LINES = {
    FUNCTION_ENTRY: 1,
    NULL_CHECK: 2,
    RECURSE_LEFT: 3,
    RECURSE_RIGHT: 4,
    PROCESS: 5,
    FUNCTION_EXIT: 6
};

/**
 * Generates execution steps for Inorder traversal (Left -> Root -> Right)
 */
export class InorderGenerator {
    /**
     * Generates all execution steps for inorder traversal
     * @param {Object} root - The root TreeNode
     * @returns {ExecutionStep[]} Array of execution steps
     */
    generateSteps(root) {
        const steps = [];
        this._traverse(root, steps);
        return steps;
    }

    /**
     * Recursively generates steps for inorder traversal
     * @param {Object|null} node - Current node
     * @param {ExecutionStep[]} steps - Array to collect steps
     * @private
     */
    _traverse(node, steps) {
        const nodeValue = node ? node.value : null;

        // Step 1: Function call (entering the function)
        steps.push(ExecutionStep.call(nodeValue, INORDER_LINES.FUNCTION_ENTRY));

        // Step 2: Null check
        steps.push(ExecutionStep.checkNull(nodeValue, INORDER_LINES.NULL_CHECK));

        // If node is null, return early
        if (node === null) {
            steps.push(ExecutionStep.return(null, INORDER_LINES.NULL_CHECK, true));
            return;
        }

        // Step 3: Recurse left
        steps.push(ExecutionStep.recurseLeft(nodeValue, INORDER_LINES.RECURSE_LEFT));
        this._traverse(node.left, steps);

        // Step 4: Process node (print)
        steps.push(ExecutionStep.processNode(nodeValue, INORDER_LINES.PROCESS));

        // Step 5: Recurse right
        steps.push(ExecutionStep.recurseRight(nodeValue, INORDER_LINES.RECURSE_RIGHT));
        this._traverse(node.right, steps);

        // Step 6: Return from function
        steps.push(ExecutionStep.return(nodeValue, INORDER_LINES.FUNCTION_EXIT));
    }
}

/**
 * Generates execution steps for Preorder traversal (Root -> Left -> Right)
 */
export class PreorderGenerator {
    /**
     * Generates all execution steps for preorder traversal
     * @param {Object} root - The root TreeNode
     * @returns {ExecutionStep[]} Array of execution steps
     */
    generateSteps(root) {
        const steps = [];
        this._traverse(root, steps);
        return steps;
    }

    /**
     * Recursively generates steps for preorder traversal
     * @param {Object|null} node - Current node
     * @param {ExecutionStep[]} steps - Array to collect steps
     * @private
     */
    _traverse(node, steps) {
        const nodeValue = node ? node.value : null;

        // Step 1: Function call
        steps.push(ExecutionStep.call(nodeValue, PREORDER_LINES.FUNCTION_ENTRY));

        // Step 2: Null check
        steps.push(ExecutionStep.checkNull(nodeValue, PREORDER_LINES.NULL_CHECK));

        if (node === null) {
            steps.push(ExecutionStep.return(null, PREORDER_LINES.NULL_CHECK, true));
            return;
        }

        // Step 3: Process node first (preorder)
        steps.push(ExecutionStep.processNode(nodeValue, PREORDER_LINES.PROCESS));

        // Step 4: Recurse left
        steps.push(ExecutionStep.recurseLeft(nodeValue, PREORDER_LINES.RECURSE_LEFT));
        this._traverse(node.left, steps);

        // Step 5: Recurse right
        steps.push(ExecutionStep.recurseRight(nodeValue, PREORDER_LINES.RECURSE_RIGHT));
        this._traverse(node.right, steps);

        // Step 6: Return
        steps.push(ExecutionStep.return(nodeValue, PREORDER_LINES.FUNCTION_EXIT));
    }
}

/**
 * Generates execution steps for Postorder traversal (Left -> Right -> Root)
 */
export class PostorderGenerator {
    /**
     * Generates all execution steps for postorder traversal
     * @param {Object} root - The root TreeNode
     * @returns {ExecutionStep[]} Array of execution steps
     */
    generateSteps(root) {
        const steps = [];
        this._traverse(root, steps);
        return steps;
    }

    /**
     * Recursively generates steps for postorder traversal
     * @param {Object|null} node - Current node
     * @param {ExecutionStep[]} steps - Array to collect steps
     * @private
     */
    _traverse(node, steps) {
        const nodeValue = node ? node.value : null;

        // Step 1: Function call
        steps.push(ExecutionStep.call(nodeValue, POSTORDER_LINES.FUNCTION_ENTRY));

        // Step 2: Null check
        steps.push(ExecutionStep.checkNull(nodeValue, POSTORDER_LINES.NULL_CHECK));

        if (node === null) {
            steps.push(ExecutionStep.return(null, POSTORDER_LINES.NULL_CHECK, true));
            return;
        }

        // Step 3: Recurse left
        steps.push(ExecutionStep.recurseLeft(nodeValue, POSTORDER_LINES.RECURSE_LEFT));
        this._traverse(node.left, steps);

        // Step 4: Recurse right
        steps.push(ExecutionStep.recurseRight(nodeValue, POSTORDER_LINES.RECURSE_RIGHT));
        this._traverse(node.right, steps);

        // Step 5: Process node last (postorder)
        steps.push(ExecutionStep.processNode(nodeValue, POSTORDER_LINES.PROCESS));

        // Step 6: Return
        steps.push(ExecutionStep.return(nodeValue, POSTORDER_LINES.FUNCTION_EXIT));
    }
}

/**
 * Factory function to get the appropriate generator
 * @param {'inorder'|'preorder'|'postorder'} type - Traversal type
 * @returns {InorderGenerator|PreorderGenerator|PostorderGenerator}
 */
export function getTraversalGenerator(type) {
    switch (type) {
        case 'preorder':
            return new PreorderGenerator();
        case 'postorder':
            return new PostorderGenerator();
        case 'inorder':
        default:
            return new InorderGenerator();
    }
}
