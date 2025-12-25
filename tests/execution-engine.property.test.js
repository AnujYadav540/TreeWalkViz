import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ExecutionEngine } from '../src/execution-engine.js';
import { statesEqual, createInitialState } from '../src/state-manager.js';
import { NodeState } from '../src/execution-step.js';

const arbTraversalType = fc.constantFrom('inorder', 'preorder', 'postorder');

describe('Execution Engine Step Navigation Properties', () => {
    // **Feature: tree-traversal-visualizer, Property 8: Next Step Advances by One**
    // *For any* application state where the current step is not the last step, 
    // invoking nextStep() SHALL increment the step index by exactly one.
    // **Validates: Requirements 4.2**

    it('Property 8: nextStep() increments step index by exactly 1', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const engine = new ExecutionEngine();
                engine.initialize(type);

                const totalSteps = engine.getTotalSteps();
                
                // Step through all steps
                for (let i = 0; i < totalSteps; i++) {
                    const indexBefore = engine.getCurrentStepIndex();
                    const result = engine.nextStep();
                    const indexAfter = engine.getCurrentStepIndex();

                    expect(result).toBe(true);
                    expect(indexAfter).toBe(indexBefore + 1);
                }

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 8b: nextStep() returns false at end of traversal', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const engine = new ExecutionEngine();
                engine.initialize(type);

                // Go to the end
                while (engine.nextStep()) {}

                // Should be at end
                expect(engine.isAtEnd()).toBe(true);

                // Next step should return false
                const indexBefore = engine.getCurrentStepIndex();
                const result = engine.nextStep();
                const indexAfter = engine.getCurrentStepIndex();

                expect(result).toBe(false);
                expect(indexAfter).toBe(indexBefore); // Index unchanged

                return true;
            }),
            { numRuns: 100 }
        );
    });

    // **Feature: tree-traversal-visualizer, Property 9: Previous Step Reverts by One**
    // *For any* application state where the current step is not the first step, 
    // invoking previousStep() SHALL decrement the step index by exactly one 
    // and restore the exact prior state.
    // **Validates: Requirements 4.3**

    it('Property 9: previousStep() decrements step index by exactly 1', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 20 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());

                    // Advance some steps
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                    }

                    // Go back and verify index decrements by 1 each time
                    for (let i = 0; i < maxSteps; i++) {
                        const indexBefore = engine.getCurrentStepIndex();
                        const result = engine.previousStep();
                        const indexAfter = engine.getCurrentStepIndex();

                        expect(result).toBe(true);
                        expect(indexAfter).toBe(indexBefore - 1);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 9b: previousStep() returns false at start', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const engine = new ExecutionEngine();
                engine.initialize(type);

                // Should be at start
                expect(engine.isAtStart()).toBe(true);

                // Previous step should return false
                const result = engine.previousStep();
                expect(result).toBe(false);

                // Still at start
                expect(engine.isAtStart()).toBe(true);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 9c: previousStep() restores exact prior state', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 10 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());
                    const stateSnapshots = [];

                    // Capture state at each step
                    stateSnapshots.push(engine.getStateManager().getState());
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                        stateSnapshots.push(engine.getStateManager().getState());
                    }

                    // Go back and verify state matches snapshots
                    for (let i = maxSteps; i > 0; i--) {
                        engine.previousStep();
                        const currentState = engine.getStateManager().getState();
                        const expectedState = stateSnapshots[i - 1];
                        
                        expect(currentState.currentStepIndex).toBe(expectedState.currentStepIndex);
                        expect(currentState.highlightedLine).toBe(expectedState.highlightedLine);
                        expect(currentState.callStack.length).toBe(expectedState.callStack.length);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // **Feature: tree-traversal-visualizer, Property 10: Reset Restores Initial State**
    // *For any* application state after any sequence of operations, invoking reset() 
    // SHALL restore the state to: step index 0, empty call stack, all nodes in 
    // Unvisited state, and no highlighted code line.
    // **Validates: Requirements 4.4**

    it('Property 10: reset() restores step index to -1', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 30 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());

                    // Advance some steps
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                    }

                    // Reset
                    engine.reset();

                    expect(engine.getCurrentStepIndex()).toBe(-1);
                    expect(engine.isAtStart()).toBe(true);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 10b: reset() clears call stack', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 20 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());

                    // Advance some steps (should build up call stack)
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                    }

                    // Reset
                    engine.reset();

                    const state = engine.getStateManager().getState();
                    expect(state.callStack.length).toBe(0);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 10c: reset() sets all nodes to Unvisited', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 30 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());

                    // Advance some steps
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                    }

                    // Reset
                    engine.reset();

                    const state = engine.getStateManager().getState();
                    for (const [nodeValue, nodeState] of state.nodeStates) {
                        expect(nodeState).toBe(NodeState.UNVISITED);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 10d: reset() clears highlighted line', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 20 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());

                    // Advance some steps
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                    }

                    // Reset
                    engine.reset();

                    const state = engine.getStateManager().getState();
                    expect(state.highlightedLine).toBe(0);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 10e: reset() clears traversal output', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 50 }),
                (type, numSteps) => {
                    const engine = new ExecutionEngine();
                    engine.initialize(type);

                    const maxSteps = Math.min(numSteps, engine.getTotalSteps());

                    // Advance some steps
                    for (let i = 0; i < maxSteps; i++) {
                        engine.nextStep();
                    }

                    // Reset
                    engine.reset();

                    const state = engine.getStateManager().getState();
                    expect(state.traversalOutput.length).toBe(0);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 10f: reset() allows starting fresh traversal', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const engine = new ExecutionEngine();
                engine.initialize(type);

                // Complete the traversal
                while (engine.nextStep()) {}

                // Reset
                engine.reset();

                // Should be able to traverse again
                expect(engine.isAtStart()).toBe(true);
                expect(engine.nextStep()).toBe(true);
                expect(engine.getCurrentStepIndex()).toBe(0);

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
