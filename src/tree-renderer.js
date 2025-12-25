// ============================================================
// TREE RENDERER (Testable Module)
// ============================================================

import { NodeState } from './execution-step.js';

/**
 * Color mappings for each node state
 */
export const NODE_COLORS = {
    [NodeState.UNVISITED]: '#4a5568',
    [NodeState.PROCESSING]: '#ecc94b',
    [NodeState.VISITED]: '#4299e1',
    [NodeState.FINISHED]: '#48bb78'
};

/**
 * Get color for a node state
 * @param {string} state - NodeState value
 * @returns {string} Color hex code
 */
export function getColorForState(state) {
    return NODE_COLORS[state] || NODE_COLORS[NodeState.UNVISITED];
}

/**
 * Validates that a state has a defined color
 * @param {string} state - NodeState value
 * @returns {boolean} True if state has a color mapping
 */
export function hasColorMapping(state) {
    return state in NODE_COLORS;
}

/**
 * Get all valid node states
 * @returns {string[]} Array of valid NodeState values
 */
export function getAllNodeStates() {
    return Object.values(NodeState);
}

/**
 * Validates that a color is a valid hex color
 * @param {string} color - Color string
 * @returns {boolean} True if valid hex color
 */
export function isValidHexColor(color) {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * TreeRenderer class for canvas rendering
 * Note: This is a simplified version for testing. The full implementation
 * is in index.html for browser use.
 */
export class TreeRenderer {
    constructor() {
        this.nodeRadius = 25;
        this.colors = { ...NODE_COLORS };
        this.edgeColor = '#718096';
        this.textColor = '#ffffff';
        this.backgroundColor = '#0f3460';
    }

    /**
     * Get color for a node state
     * @param {string} state - NodeState value
     * @returns {string} Color hex code
     */
    getColorForState(state) {
        return getColorForState(state);
    }

    /**
     * Check if all states have valid colors
     * @returns {boolean}
     */
    allStatesHaveColors() {
        return getAllNodeStates().every(state => hasColorMapping(state));
    }

    /**
     * Check if all colors are valid hex colors
     * @returns {boolean}
     */
    allColorsAreValid() {
        return Object.values(this.colors).every(color => isValidHexColor(color));
    }

    /**
     * Get the color mapping object
     * @returns {Object}
     */
    getColorMapping() {
        return { ...this.colors };
    }
}
