// ============================================================
// EXECUTION ENGINE
// ============================================================

import { StateManager } from './state-manager.js';
import { getTraversalGenerator } from './traversal-generators.js';
import { StepType, StackAction, NodeState, StackFrame } from './execution-step.js';
import { createDefaultTree, getAllNodes } from './tree-model.js';

/**
 * ExecutionEngine - Controls the traversal execution flow
 * Coordinates between state management, step generation, and UI updates
 */
export class ExecutionEngine {
    constructor(tree = null) {
        this._stateManager = new StateManager();
        this._tree = tree || createDefaultTree();
        this._steps = [];
        this._playIntervalId = null;
    }

    /**
     * Gets the state manager instance
     * @returns {StateManager}
     */
    getStateManager() {
        return this._stateManager;
    }

    /**
     * Gets the tree instance
     * @returns {Object} TreeNode root
     */
    getTree() {
        return this._tree;
    }

    /**
     * Gets all generated steps
     * @returns {Array} ExecutionStep array
     */
    getSteps() {
        return this._steps;
    }

    /**
     * Initialize the engine with a traversal type
     * Generates all execution steps and resets state
     * @param {'inorder'|'preorder'|'postorder'} type - Traversal type
     */
    initialize(type = 'inorder') {
        // Stop any ongoing playback
        this.pause();

        // Generate steps for the traversal
        const generator = getTraversalGenerator(type);
        this._steps = generator.generateSteps(this._tree);

        // Reset state
        this._stateManager.reset();
        this._stateManager.setTraversalType(type);

        // Initialize all nodes to unvisited
        const nodeValues = getAllNodes(this._tree).map(n => n.value);
        this._stateManager.resetNodeStates(nodeValues);
    }

    /**
     * Advance to the next execution step
     * @returns {boolean} True if advanced, false if at end
     */
    nextStep() {
        const state = this._stateManager.getState();
        const nextIndex = state.currentStepIndex + 1;

        // Check if we're at the end
        if (nextIndex >= this._steps.length) {
            return false;
        }

        // Save current state to history before advancing
        this._stateManager.pushHistory();

        // Get the next step
        const step = this._steps[nextIndex];

        // Apply the step
        this._applyStep(step, nextIndex);

        return true;
    }

    /**
     * Revert to the previous execution step
     * @returns {boolean} True if reverted, false if at start
     */
    previousStep() {
        const state = this._stateManager.getState();

        // Check if we're at the start
        if (state.currentStepIndex < 0) {
            return false;
        }

        // Pop the previous state from history
        const previousState = this._stateManager.popHistory();

        if (previousState) {
            this._stateManager.setState(previousState);
            return true;
        }

        return false;
    }

    /**
     * Reset the visualization to initial state
     */
    reset() {
        // Stop any ongoing playback
        this.pause();

        // Reset state manager (clears history too)
        this._stateManager.reset();

        // Preserve traversal type and reinitialize node states
        const state = this._stateManager.getState();
        const nodeValues = getAllNodes(this._tree).map(n => n.value);
        this._stateManager.resetNodeStates(nodeValues);
    }

    /**
     * Check if at the start of traversal
     * @returns {boolean}
     */
    isAtStart() {
        return this._stateManager.getState().currentStepIndex < 0;
    }

    /**
     * Check if at the end of traversal
     * @returns {boolean}
     */
    isAtEnd() {
        const state = this._stateManager.getState();
        return state.currentStepIndex >= this._steps.length - 1;
    }

    /**
     * Get the current execution step
     * @returns {Object|null} Current ExecutionStep or null
     */
    getCurrentStep() {
        const state = this._stateManager.getState();
        if (state.currentStepIndex < 0 || state.currentStepIndex >= this._steps.length) {
            return null;
        }
        return this._steps[state.currentStepIndex];
    }

    /**
     * Get the current step index
     * @returns {number}
     */
    getCurrentStepIndex() {
        return this._stateManager.getState().currentStepIndex;
    }

    /**
     * Get the current state
     * @returns {Object} Current application state
     */
    getState() {
        return this._stateManager.getState();
    }

    /**
     * Get the current traversal type
     * @returns {string}
     */
    getTraversalType() {
        return this._stateManager.getState().traversalType;
    }

    /**
     * Get total number of steps
     * @returns {number}
     */
    getTotalSteps() {
        return this._steps.length;
    }

    /**
     * Start auto-play
     */
    play() {
        if (this._playIntervalId !== null) return;

        this._stateManager.setPlaying(true);
        const speed = this._stateManager.getState().animationSpeed;

        this._playIntervalId = setInterval(() => {
            if (!this.nextStep()) {
                this.pause();
            }
        }, speed);
    }

    /**
     * Pause auto-play
     */
    pause() {
        if (this._playIntervalId !== null) {
            clearInterval(this._playIntervalId);
            this._playIntervalId = null;
        }
        this._stateManager.setPlaying(false);
    }

    /**
     * Check if currently playing
     * @returns {boolean}
     */
    isPlaying() {
        return this._stateManager.getState().isPlaying;
    }

    /**
     * Set animation speed
     * @param {number} ms - Milliseconds per step
     */
    setSpeed(ms) {
        this._stateManager.setAnimationSpeed(ms);

        // If playing, restart with new speed
        if (this.isPlaying()) {
            this.pause();
            this.play();
        }
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        return this._stateManager.subscribe(callback);
    }

    /**
     * Apply an execution step to the state
     * @param {Object} step - ExecutionStep to apply
     * @param {number} stepIndex - Index of the step
     * @private
     */
    _applyStep(step, stepIndex) {
        // Update step index
        this._stateManager.setStepIndex(stepIndex);

        // Update highlighted line
        this._stateManager.setHighlightedLine(step.codeLine);

        // Handle stack action
        if (step.stackAction === StackAction.PUSH) {
            const traversalType = this._stateManager.getState().traversalType;
            const functionName = this._getFunctionName(traversalType);
            const frame = new StackFrame({
                functionName,
                nodeValue: step.nodeValue,
                returnAddress: `line ${step.codeLine}`
            });
            this._stateManager.pushCallStack(frame);
        } else if (step.stackAction === StackAction.POP) {
            this._stateManager.popCallStack();
        }

        // Update node state (only for non-null nodes)
        if (step.nodeValue !== null) {
            this._stateManager.setNodeState(step.nodeValue, step.nodeState);
        }

        // Track output for PROCESS_NODE steps
        if (step.type === StepType.PROCESS_NODE && step.nodeValue !== null) {
            this._stateManager.addToOutput(step.nodeValue);
        }
    }

    /**
     * Get function name for traversal type
     * @param {string} type - Traversal type
     * @returns {string} Function name
     * @private
     */
    _getFunctionName(type) {
        switch (type) {
            case 'preorder': return 'preOrder';
            case 'postorder': return 'postOrder';
            case 'inorder':
            default: return 'inOrder';
        }
    }
}
