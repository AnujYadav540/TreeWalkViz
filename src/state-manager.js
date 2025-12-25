// ============================================================
// STATE MANAGER
// ============================================================

import { NodeState } from './execution-step.js';

/**
 * Creates the initial application state
 * @returns {Object} Initial AppState
 */
export function createInitialState() {
    return {
        currentStepIndex: -1,
        callStack: [],
        nodeStates: new Map(),
        highlightedLine: 0,
        traversalType: 'inorder',
        isPlaying: false,
        animationSpeed: 500,
        traversalOutput: []
    };
}

/**
 * Deep clones an AppState object
 * @param {Object} state - The state to clone
 * @returns {Object} Cloned state
 */
export function cloneState(state) {
    return {
        currentStepIndex: state.currentStepIndex,
        callStack: state.callStack.map(frame => ({ ...frame })),
        nodeStates: new Map(state.nodeStates),
        highlightedLine: state.highlightedLine,
        traversalType: state.traversalType,
        isPlaying: state.isPlaying,
        animationSpeed: state.animationSpeed,
        traversalOutput: [...state.traversalOutput]
    };
}

/**
 * Compares two states for equality
 * @param {Object} state1 - First state
 * @param {Object} state2 - Second state
 * @returns {boolean} True if states are equal
 */
export function statesEqual(state1, state2) {
    if (state1.currentStepIndex !== state2.currentStepIndex) return false;
    if (state1.highlightedLine !== state2.highlightedLine) return false;
    if (state1.traversalType !== state2.traversalType) return false;
    if (state1.isPlaying !== state2.isPlaying) return false;
    if (state1.animationSpeed !== state2.animationSpeed) return false;
    if (state1.callStack.length !== state2.callStack.length) return false;
    if (state1.nodeStates.size !== state2.nodeStates.size) return false;
    if (state1.traversalOutput.length !== state2.traversalOutput.length) return false;

    // Compare call stack
    for (let i = 0; i < state1.callStack.length; i++) {
        const f1 = state1.callStack[i];
        const f2 = state2.callStack[i];
        if (f1.functionName !== f2.functionName || f1.nodeValue !== f2.nodeValue) {
            return false;
        }
    }

    // Compare node states
    for (const [key, value] of state1.nodeStates) {
        if (state2.nodeStates.get(key) !== value) return false;
    }

    // Compare traversal output
    for (let i = 0; i < state1.traversalOutput.length; i++) {
        if (state1.traversalOutput[i] !== state2.traversalOutput[i]) return false;
    }

    return true;
}

/**
 * StateManager class - manages application state with subscriber pattern
 */
export class StateManager {
    constructor() {
        this._state = createInitialState();
        this._subscribers = [];
        this._history = [];
    }

    /**
     * Gets the current state (returns a clone to prevent direct mutation)
     * @returns {Object} Current AppState
     */
    getState() {
        return cloneState(this._state);
    }

    /**
     * Sets the state and notifies subscribers
     * @param {Object} newState - The new state (can be partial)
     */
    setState(newState) {
        // Merge new state with existing state
        this._state = {
            ...this._state,
            ...newState,
            // Handle special cases for complex types
            callStack: newState.callStack !== undefined 
                ? newState.callStack.map(f => ({ ...f }))
                : this._state.callStack,
            nodeStates: newState.nodeStates !== undefined
                ? new Map(newState.nodeStates)
                : this._state.nodeStates,
            traversalOutput: newState.traversalOutput !== undefined
                ? [...newState.traversalOutput]
                : this._state.traversalOutput
        };

        this._notifySubscribers();
    }

    /**
     * Pushes current state to history stack
     */
    pushHistory() {
        this._history.push(cloneState(this._state));
    }

    /**
     * Pops and returns the last state from history
     * @returns {Object|null} Previous state or null if history is empty
     */
    popHistory() {
        if (this._history.length === 0) return null;
        return this._history.pop();
    }

    /**
     * Clears all history
     */
    clearHistory() {
        this._history = [];
    }

    /**
     * Gets the current history length
     * @returns {number} Number of states in history
     */
    getHistoryLength() {
        return this._history.length;
    }

    /**
     * Subscribes a callback to state changes
     * @param {Function} callback - Function to call when state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._subscribers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this._subscribers.indexOf(callback);
            if (index > -1) {
                this._subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Resets state to initial values and clears history
     */
    reset() {
        this._state = createInitialState();
        this._history = [];
        this._notifySubscribers();
    }

    /**
     * Notifies all subscribers of state change
     * @private
     */
    _notifySubscribers() {
        const state = this.getState();
        for (const callback of this._subscribers) {
            callback(state);
        }
    }

    // ============================================================
    // Convenience methods for common state updates
    // ============================================================

    /**
     * Updates the current step index
     * @param {number} index - New step index
     */
    setStepIndex(index) {
        this.setState({ currentStepIndex: index });
    }

    /**
     * Updates the highlighted code line
     * @param {number} line - Line number to highlight (0 for none)
     */
    setHighlightedLine(line) {
        this.setState({ highlightedLine: line });
    }

    /**
     * Updates the traversal type
     * @param {'inorder'|'preorder'|'postorder'} type - Traversal type
     */
    setTraversalType(type) {
        this.setState({ traversalType: type });
    }

    /**
     * Updates the playing state
     * @param {boolean} isPlaying - Whether auto-play is active
     */
    setPlaying(isPlaying) {
        this.setState({ isPlaying });
    }

    /**
     * Updates the animation speed
     * @param {number} speed - Milliseconds per step
     */
    setAnimationSpeed(speed) {
        this.setState({ animationSpeed: speed });
    }

    /**
     * Pushes a frame onto the call stack
     * @param {Object} frame - Stack frame to push
     */
    pushCallStack(frame) {
        const newStack = [...this._state.callStack, { ...frame }];
        this.setState({ callStack: newStack });
    }

    /**
     * Pops a frame from the call stack
     * @returns {Object|undefined} Popped frame or undefined if empty
     */
    popCallStack() {
        if (this._state.callStack.length === 0) return undefined;
        const newStack = this._state.callStack.slice(0, -1);
        const popped = this._state.callStack[this._state.callStack.length - 1];
        this.setState({ callStack: newStack });
        return popped;
    }

    /**
     * Updates a node's visual state
     * @param {number} nodeValue - The node's value
     * @param {string} state - The new NodeState
     */
    setNodeState(nodeValue, state) {
        const newNodeStates = new Map(this._state.nodeStates);
        newNodeStates.set(nodeValue, state);
        this.setState({ nodeStates: newNodeStates });
    }

    /**
     * Resets all node states to unvisited
     * @param {number[]} nodeValues - Array of node values to reset
     */
    resetNodeStates(nodeValues) {
        const newNodeStates = new Map();
        for (const value of nodeValues) {
            newNodeStates.set(value, NodeState.UNVISITED);
        }
        this.setState({ nodeStates: newNodeStates });
    }

    /**
     * Adds a value to the traversal output
     * @param {number} value - Node value to add
     */
    addToOutput(value) {
        const newOutput = [...this._state.traversalOutput, value];
        this.setState({ traversalOutput: newOutput });
    }

    /**
     * Clears the traversal output
     */
    clearOutput() {
        this.setState({ traversalOutput: [] });
    }
}
