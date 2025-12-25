// ============================================================
// EXECUTION STEP MODEL
// ============================================================

/**
 * Types of execution steps
 * @enum {string}
 */
export const StepType = {
    CALL: 'CALL',                   // Entering a function (push stack frame)
    CHECK_NULL: 'CHECK_NULL',       // Checking if node is null
    PROCESS_NODE: 'PROCESS_NODE',   // Processing/visiting the current node
    RECURSE_LEFT: 'RECURSE_LEFT',   // About to recurse left
    RECURSE_RIGHT: 'RECURSE_RIGHT', // About to recurse right
    RETURN: 'RETURN'                // Returning from function (pop stack frame)
};

/**
 * Node visual states
 * @enum {string}
 */
export const NodeState = {
    UNVISITED: 'unvisited',
    PROCESSING: 'processing',
    VISITED: 'visited',
    FINISHED: 'finished'
};

/**
 * Stack actions that can occur during a step
 * @enum {string}
 */
export const StackAction = {
    PUSH: 'push',
    POP: 'pop',
    NONE: 'none'
};

/**
 * Represents a single execution step in the traversal
 */
export class ExecutionStep {
    /**
     * @param {Object} params - Step parameters
     * @param {string} params.type - The type of step (from StepType enum)
     * @param {number|null} params.nodeValue - The value of the node being processed (null for null checks)
     * @param {number} params.codeLine - 1-indexed line number to highlight
     * @param {string} params.stackAction - Stack action to perform (from StackAction enum)
     * @param {string} params.nodeState - State to set on the tree node (from NodeState enum)
     * @param {string} [params.description] - Human-readable description of the step
     */
    constructor({ type, nodeValue, codeLine, stackAction, nodeState, description = '' }) {
        this.type = type;
        this.nodeValue = nodeValue;
        this.codeLine = codeLine;
        this.stackAction = stackAction;
        this.nodeState = nodeState;
        this.description = description;
    }

    /**
     * Creates a CALL step (entering a function)
     * @param {number|null} nodeValue - The node value being called with
     * @param {number} codeLine - The line number
     * @returns {ExecutionStep}
     */
    static call(nodeValue, codeLine) {
        return new ExecutionStep({
            type: StepType.CALL,
            nodeValue,
            codeLine,
            stackAction: StackAction.PUSH,
            nodeState: nodeValue !== null ? NodeState.PROCESSING : NodeState.UNVISITED,
            description: nodeValue !== null 
                ? `Call function with node ${nodeValue}` 
                : 'Call function with null'
        });
    }

    /**
     * Creates a CHECK_NULL step
     * @param {number|null} nodeValue - The node value being checked
     * @param {number} codeLine - The line number
     * @returns {ExecutionStep}
     */
    static checkNull(nodeValue, codeLine) {
        return new ExecutionStep({
            type: StepType.CHECK_NULL,
            nodeValue,
            codeLine,
            stackAction: StackAction.NONE,
            nodeState: nodeValue !== null ? NodeState.PROCESSING : NodeState.UNVISITED,
            description: nodeValue !== null 
                ? `Check if node ${nodeValue} is null (false)` 
                : 'Check if node is null (true)'
        });
    }

    /**
     * Creates a PROCESS_NODE step (visiting/printing the node)
     * @param {number} nodeValue - The node value being processed
     * @param {number} codeLine - The line number
     * @returns {ExecutionStep}
     */
    static processNode(nodeValue, codeLine) {
        return new ExecutionStep({
            type: StepType.PROCESS_NODE,
            nodeValue,
            codeLine,
            stackAction: StackAction.NONE,
            nodeState: NodeState.VISITED,
            description: `Process/print node ${nodeValue}`
        });
    }

    /**
     * Creates a RECURSE_LEFT step
     * @param {number} nodeValue - The current node value
     * @param {number} codeLine - The line number
     * @returns {ExecutionStep}
     */
    static recurseLeft(nodeValue, codeLine) {
        return new ExecutionStep({
            type: StepType.RECURSE_LEFT,
            nodeValue,
            codeLine,
            stackAction: StackAction.NONE,
            nodeState: NodeState.PROCESSING,
            description: `Recurse to left child of node ${nodeValue}`
        });
    }

    /**
     * Creates a RECURSE_RIGHT step
     * @param {number} nodeValue - The current node value
     * @param {number} codeLine - The line number
     * @returns {ExecutionStep}
     */
    static recurseRight(nodeValue, codeLine) {
        return new ExecutionStep({
            type: StepType.RECURSE_RIGHT,
            nodeValue,
            codeLine,
            stackAction: StackAction.NONE,
            nodeState: NodeState.PROCESSING,
            description: `Recurse to right child of node ${nodeValue}`
        });
    }

    /**
     * Creates a RETURN step (exiting a function)
     * @param {number|null} nodeValue - The node value returning from
     * @param {number} codeLine - The line number
     * @param {boolean} isNullReturn - Whether this is a return from a null check
     * @returns {ExecutionStep}
     */
    static return(nodeValue, codeLine, isNullReturn = false) {
        return new ExecutionStep({
            type: StepType.RETURN,
            nodeValue,
            codeLine,
            stackAction: StackAction.POP,
            nodeState: isNullReturn ? NodeState.UNVISITED : NodeState.FINISHED,
            description: nodeValue !== null 
                ? `Return from node ${nodeValue}` 
                : 'Return from null check'
        });
    }
}

/**
 * Represents a stack frame in the call stack
 */
export class StackFrame {
    /**
     * @param {Object} params - Frame parameters
     * @param {string} params.functionName - Name of the function (e.g., 'inOrder')
     * @param {number|null} params.nodeValue - The node value passed to this call
     * @param {string} params.returnAddress - Where to return to (e.g., 'line 4')
     */
    constructor({ functionName, nodeValue, returnAddress }) {
        this.functionName = functionName;
        this.nodeValue = nodeValue;
        this.returnAddress = returnAddress;
    }

    /**
     * Creates a string representation for display
     * @returns {string}
     */
    toString() {
        const nodeStr = this.nodeValue !== null ? this.nodeValue : 'null';
        return `${this.functionName}(${nodeStr})`;
    }
}
