import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { StateManager, createInitialState, statesEqual } from '../src/state-manager.js';
import { NodeState } from '../src/execution-step.js';

// ============================================================
// Custom Generators
// ============================================================

const arbNodeState = fc.constantFrom(
    NodeState.UNVISITED,
    NodeState.PROCESSING,
    NodeState.VISITED,
    NodeState.FINISHED
);

const arbTraversalType = fc.constantFrom('inorder', 'preorder', 'postorder');

const arbStackFrame = fc.record({
    functionName: arbTraversalType,
    nodeValue: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 100 })),
    returnAddress: fc.constantFrom('line 2', 'line 3', 'line 4', 'line 5', 'caller')
});

const arbCallStack = fc.array(arbStackFrame, { minLength: 0, maxLength: 10 });

const arbNodeStates = fc.array(
    fc.tuple(fc.integer({ min: 1, max: 100 }), arbNodeState),
    { minLength: 0, maxLength: 15 }
).map(pairs => new Map(pairs));

const arbTraversalOutput = fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 0, maxLength: 15 });

const arbAppState = fc.record({
    currentStepIndex: fc.integer({ min: -1, max: 100 }),
    callStack: arbCallStack,
    nodeStates: arbNodeStates,
    highlightedLine: fc.integer({ min: 0, max: 6 }),
    traversalType: arbTraversalType,
    isPlaying: fc.boolean(),
    animationSpeed: fc.integer({ min: 100, max: 2000 }),
    traversalOutput: arbTraversalOutput
});

// ============================================================
// Property Tests
// ============================================================

describe('State Manager Properties', () => {
    // **Feature: tree-traversal-visualizer, Property 13: State Snapshot Round-Trip**
    // *For any* sequence of N forward steps followed by N backward steps, 
    // the final state SHALL be identical to the initial state.
    // **Validates: Requirements 8.1, 8.2**

    it('Property 13: pushHistory then popHistory returns equivalent state', () => {
        fc.assert(
            fc.property(arbAppState, (state) => {
                const manager = new StateManager();
                manager.setState(state);
                
                const stateBefore = manager.getState();
                manager.pushHistory();
                const stateAfter = manager.popHistory();

                expect(statesEqual(stateBefore, stateAfter)).toBe(true);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 13b: Multiple push/pop operations preserve state order', () => {
        fc.assert(
            fc.property(
                fc.array(arbAppState, { minLength: 1, maxLength: 10 }),
                (states) => {
                    const manager = new StateManager();
                    
                    // Push all states
                    for (const state of states) {
                        manager.setState(state);
                        manager.pushHistory();
                    }

                    // Pop all states in reverse order
                    for (let i = states.length - 1; i >= 0; i--) {
                        const popped = manager.popHistory();
                        expect(statesEqual(popped, states[i])).toBe(true);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13c: N forward steps then N backward steps returns to initial state', () => {
        fc.assert(
            fc.property(
                fc.array(arbAppState, { minLength: 1, maxLength: 10 }),
                (stateSequence) => {
                    const manager = new StateManager();
                    const initialState = manager.getState();

                    // Simulate N forward steps
                    for (const state of stateSequence) {
                        manager.pushHistory();
                        manager.setState(state);
                    }

                    // Simulate N backward steps
                    for (let i = 0; i < stateSequence.length; i++) {
                        const previousState = manager.popHistory();
                        if (previousState) {
                            manager.setState(previousState);
                        }
                    }

                    const finalState = manager.getState();
                    expect(statesEqual(initialState, finalState)).toBe(true);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13d: History length increases by 1 on each push', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 20 }),
                (numPushes) => {
                    const manager = new StateManager();
                    
                    for (let i = 0; i < numPushes; i++) {
                        const lengthBefore = manager.getHistoryLength();
                        manager.pushHistory();
                        expect(manager.getHistoryLength()).toBe(lengthBefore + 1);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13e: History length decreases by 1 on each pop', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 20 }),
                (numPushes) => {
                    const manager = new StateManager();
                    
                    // Push some states
                    for (let i = 0; i < numPushes; i++) {
                        manager.pushHistory();
                    }

                    // Pop and verify length decreases
                    for (let i = numPushes; i > 0; i--) {
                        expect(manager.getHistoryLength()).toBe(i);
                        manager.popHistory();
                        expect(manager.getHistoryLength()).toBe(i - 1);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 13f: popHistory returns null when history is empty', () => {
        const manager = new StateManager();
        expect(manager.popHistory()).toBeNull();
        
        // Push and pop, then try again
        manager.pushHistory();
        manager.popHistory();
        expect(manager.popHistory()).toBeNull();
    });

    it('Property 13g: Cloned state is independent of original', () => {
        fc.assert(
            fc.property(arbAppState, (state) => {
                const manager = new StateManager();
                manager.setState(state);
                
                const cloned = manager.getState();
                
                // Modify the cloned state
                cloned.currentStepIndex = 9999;
                cloned.callStack.push({ functionName: 'test', nodeValue: 999, returnAddress: 'test' });
                cloned.nodeStates.set(9999, NodeState.FINISHED);
                
                // Original should be unchanged
                const original = manager.getState();
                expect(original.currentStepIndex).not.toBe(9999);
                expect(original.callStack.length).toBe(state.callStack.length);
                expect(original.nodeStates.has(9999)).toBe(false);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    // **Feature: tree-traversal-visualizer, Property 14: Reset Clears History**
    // *For any* application state with stored history snapshots, 
    // invoking reset() SHALL clear all stored snapshots.
    // **Validates: Requirements 8.3**

    it('Property 14: reset() clears all history snapshots', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 20 }),
                (numPushes) => {
                    const manager = new StateManager();
                    
                    // Push some history
                    for (let i = 0; i < numPushes; i++) {
                        manager.pushHistory();
                    }
                    
                    expect(manager.getHistoryLength()).toBe(numPushes);
                    
                    // Reset should clear history
                    manager.reset();
                    
                    expect(manager.getHistoryLength()).toBe(0);
                    expect(manager.popHistory()).toBeNull();

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 14b: reset() restores initial state values', () => {
        fc.assert(
            fc.property(arbAppState, (state) => {
                const manager = new StateManager();
                const initialState = createInitialState();
                
                // Set some non-initial state
                manager.setState(state);
                manager.pushHistory();
                
                // Reset
                manager.reset();
                
                const afterReset = manager.getState();
                
                // Should match initial state
                expect(afterReset.currentStepIndex).toBe(initialState.currentStepIndex);
                expect(afterReset.callStack.length).toBe(0);
                expect(afterReset.nodeStates.size).toBe(0);
                expect(afterReset.highlightedLine).toBe(0);
                expect(afterReset.isPlaying).toBe(false);
                expect(afterReset.traversalOutput.length).toBe(0);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 14c: reset() followed by operations works correctly', () => {
        fc.assert(
            fc.property(
                fc.array(arbAppState, { minLength: 1, maxLength: 5 }),
                (states) => {
                    const manager = new StateManager();
                    
                    // Do some operations
                    for (const state of states) {
                        manager.setState(state);
                        manager.pushHistory();
                    }
                    
                    // Reset
                    manager.reset();
                    
                    // Should be able to use normally after reset
                    manager.pushHistory();
                    expect(manager.getHistoryLength()).toBe(1);
                    
                    manager.setState(states[0]);
                    manager.pushHistory();
                    expect(manager.getHistoryLength()).toBe(2);
                    
                    const popped = manager.popHistory();
                    expect(statesEqual(popped, states[0])).toBe(true);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 14d: clearHistory() only clears history, not current state', () => {
        fc.assert(
            fc.property(arbAppState, (state) => {
                const manager = new StateManager();
                
                manager.setState(state);
                manager.pushHistory();
                manager.pushHistory();
                
                const stateBefore = manager.getState();
                manager.clearHistory();
                const stateAfter = manager.getState();
                
                // History should be cleared
                expect(manager.getHistoryLength()).toBe(0);
                
                // But current state should be unchanged
                expect(statesEqual(stateBefore, stateAfter)).toBe(true);

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
