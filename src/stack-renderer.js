// ============================================================
// STACK RENDERER MODULE
// ============================================================

import { StackFrame } from './execution-step.js';

/**
 * StackRenderer - Renders the call stack visualization
 * Testable version with DOM rendering methods
 */
export class StackRenderer {
    constructor(containerElement = null) {
        this.container = containerElement;
        this.stack = [];
        this.animationDuration = 300; // ms
    }

    /**
     * Set the container element for DOM rendering
     * @param {HTMLElement} element
     */
    setContainer(element) {
        this.container = element;
    }

    /**
     * Get the current stack
     * @returns {StackFrame[]}
     */
    getStack() {
        return [...this.stack];
    }

    /**
     * Get the stack size
     * @returns {number}
     */
    getStackSize() {
        return this.stack.length;
    }

    /**
     * Check if stack is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.stack.length === 0;
    }

    /**
     * Get the top frame (most recent call)
     * @returns {StackFrame|null}
     */
    getTopFrame() {
        if (this.stack.length === 0) return null;
        return this.stack[this.stack.length - 1];
    }

    /**
     * Get frame at index (0 = bottom, length-1 = top)
     * @param {number} index
     * @returns {StackFrame|null}
     */
    getFrameAt(index) {
        if (index < 0 || index >= this.stack.length) return null;
        return this.stack[index];
    }

    /**
     * Set the entire stack (for state restoration)
     * @param {StackFrame[]} stack
     */
    setStack(stack) {
        this.stack = stack.map(f => 
            f instanceof StackFrame ? f : new StackFrame({
                functionName: f.functionName,
                nodeValue: f.nodeValue,
                returnAddress: f.returnAddress || 'caller'
            })
        );
        this.render();
    }

    /**
     * Push a frame onto the stack
     * @param {StackFrame} frame
     */
    push(frame) {
        this.stack.push(frame);
        this.render();
    }

    /**
     * Pop a frame from the stack
     * @returns {StackFrame|null}
     */
    pop() {
        if (this.stack.length === 0) return null;
        const frame = this.stack.pop();
        this.render();
        return frame;
    }

    /**
     * Clear the stack
     */
    clear() {
        this.stack = [];
        this.render();
    }

    /**
     * Create HTML for a single stack frame
     * @param {StackFrame} frame
     * @param {number} index
     * @returns {string}
     */
    createFrameHTML(frame, index) {
        const nodeDisplay = frame.nodeValue !== null ? frame.nodeValue : 'null';
        return `
            <div class="stack-frame" data-index="${index}">
                <div class="frame-function">${this.escapeHtml(frame.functionName)}(${nodeDisplay})</div>
                <div class="frame-variable">node.val = ${nodeDisplay}</div>
            </div>
        `;
    }

    /**
     * Escape HTML special characters
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Render the stack to the container
     */
    render() {
        if (!this.container) return;

        if (this.stack.length === 0) {
            this.container.innerHTML = '<div class="stack-empty">Stack is empty</div>';
            return;
        }

        // Render frames in reverse order (top of stack at top of display - LIFO visual)
        let html = '';
        for (let i = this.stack.length - 1; i >= 0; i--) {
            html += this.createFrameHTML(this.stack[i], i);
        }
        this.container.innerHTML = html;
    }

    /**
     * Animate pushing a frame onto the stack
     * @param {StackFrame} frame
     * @returns {Promise<void>}
     */
    async animatePush(frame) {
        this.stack.push(frame);
        
        if (!this.container) {
            return;
        }

        // Re-render with new frame
        this.render();

        // Add animation class to the new frame (top of display)
        const frames = this.container.querySelectorAll('.stack-frame');
        if (frames.length > 0) {
            const newFrame = frames[0]; // Top frame in display
            newFrame.classList.add('pushing');
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, this.animationDuration));
            newFrame.classList.remove('pushing');
        }
    }

    /**
     * Animate popping a frame from the stack
     * @returns {Promise<StackFrame|null>}
     */
    async animatePop() {
        if (this.stack.length === 0) return null;

        if (this.container) {
            // Add animation class to top frame before removing
            const frames = this.container.querySelectorAll('.stack-frame');
            if (frames.length > 0) {
                const topFrame = frames[0];
                topFrame.classList.add('popping');
                
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, this.animationDuration));
            }
        }

        const frame = this.stack.pop();
        this.render();
        return frame;
    }

    /**
     * Get visual order of frames (for testing LIFO display)
     * Returns array from top of display to bottom
     * @returns {StackFrame[]}
     */
    getVisualOrder() {
        // Visual order is reverse of stack order (top of stack shown first)
        return [...this.stack].reverse();
    }

    /**
     * Check if visual order is LIFO (most recent at top)
     * @returns {boolean}
     */
    isVisualOrderLIFO() {
        if (this.stack.length <= 1) return true;
        
        const visualOrder = this.getVisualOrder();
        // First element in visual order should be the last pushed (top of stack)
        return visualOrder[0] === this.stack[this.stack.length - 1];
    }

    /**
     * Get frame containing a specific node value
     * @param {number|null} nodeValue
     * @returns {StackFrame|null}
     */
    findFrameByNodeValue(nodeValue) {
        return this.stack.find(f => f.nodeValue === nodeValue) || null;
    }

    /**
     * Check if stack contains a frame with the given node value
     * @param {number|null} nodeValue
     * @returns {boolean}
     */
    hasFrameWithNodeValue(nodeValue) {
        return this.stack.some(f => f.nodeValue === nodeValue);
    }
}

/**
 * Create a StackFrame from raw data
 * @param {string} functionName
 * @param {number|null} nodeValue
 * @param {string} returnAddress
 * @returns {StackFrame}
 */
export function createStackFrame(functionName, nodeValue, returnAddress = 'caller') {
    return new StackFrame({ functionName, nodeValue, returnAddress });
}

/**
 * Validate that a frame contains required properties
 * @param {StackFrame} frame
 * @returns {boolean}
 */
export function isValidStackFrame(frame) {
    return frame !== null &&
           typeof frame.functionName === 'string' &&
           frame.functionName.length > 0 &&
           (frame.nodeValue === null || typeof frame.nodeValue === 'number');
}
