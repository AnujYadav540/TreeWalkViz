import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TreeNode, createDefaultTree, getAllNodes } from '../src/tree-model.js';
import { NodeState, StepType, StackAction, ExecutionStep, StackFrame } from '../src/execution-step.js';
import { InorderGenerator, PreorderGenerator, PostorderGenerator, getTraversalGenerator } from '../src/traversal-generators.js';
import { StateManager } from '../src/state-manager.js';
import { ExecutionEngine } from '../src/execution-engine.js';

// ============================================================
// Property 11: Synchronized Component State
// ============================================================

describe('Synchronized Component State', () => {
    // **Feature: tree-traversal-visualizer, Property 11: Synchronized Component State**
    // *For any* execution step, after applying that step, the tree node states, 
    // code line highlight, and call stack contents SHALL all reflect the same 
    // moment in the traversal execution.
    // **Validates: Requirements 5.1, 5.2, 5.3**

    const arbTraversalType = fc.constantFrom('inorder', 'preorder', 'postorder');

    it('Property 11a: Step index matches across all components after nextStep', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 20 }),
                (type, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(type);
                    
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                    }
                    
                    // Verify step index is consistent
                    expect(engine.getCurrentStepIndex()).toBe(stepsToTake - 1);
                    
                    // Verify current step matches
                    const currentStep = engine.getCurrentStep();
                    if (currentStep) {
                        expect(currentStep.codeLine).toBeGreaterThanOrEqual(1);
                        expect(currentStep.codeLine).toBeLessThanOrEqual(6);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 11b: Code line matches step codeLine property', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 30 }),
                (type, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(type);
                    
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                        const step = engine.getCurrentStep();
                        const state = engine.getState();
                        
                        // The highlighted line should match the step's codeLine
                        expect(state.highlightedLine).toBe(step.codeLine);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 11c: Stack size changes correctly with PUSH/POP actions', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const tree = createDefaultTree();
                const engine = new ExecutionEngine(tree);
                engine.initialize(type);
                
                let expectedStackSize = 0;
                
                while (!engine.isAtEnd()) {
                    const prevSize = engine.getState().callStack.length;
                    engine.nextStep();
                    const step = engine.getCurrentStep();
                    const newSize = engine.getState().callStack.length;
                    
                    if (step.stackAction === StackAction.PUSH) {
                        expect(newSize).toBe(prevSize + 1);
                    } else if (step.stackAction === StackAction.POP) {
                        expect(newSize).toBe(prevSize - 1);
                    } else {
                        expect(newSize).toBe(prevSize);
                    }
                }
                
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 11d: Node states are consistent with step nodeState', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const tree = createDefaultTree();
                const engine = new ExecutionEngine(tree);
                engine.initialize(type);
                
                while (!engine.isAtEnd()) {
                    engine.nextStep();
                    const step = engine.getCurrentStep();
                    const state = engine.getState();
                    
                    // If step has a nodeValue, verify its state matches
                    if (step.nodeValue !== null) {
                        const nodeState = state.nodeStates.get(step.nodeValue);
                        expect(nodeState).toBe(step.nodeState);
                    }
                }
                
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 11e: All components reset together', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 20 }),
                (type, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(type);
                    
                    // Take some steps
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                    }
                    
                    // Reset
                    engine.reset();
                    const state = engine.getState();
                    
                    // Verify all components are reset
                    expect(engine.getCurrentStepIndex()).toBe(-1);
                    expect(state.callStack.length).toBe(0);
                    expect(state.highlightedLine).toBe(0);
                    
                    // All nodes should be UNVISITED
                    const allNodes = getAllNodes(tree);
                    for (const node of allNodes) {
                        expect(state.nodeStates.get(node.value)).toBe(NodeState.UNVISITED);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ============================================================
// Property 12: Traversal Type Switch Resets State
// ============================================================

describe('Traversal Type Switch Resets State', () => {
    // **Feature: tree-traversal-visualizer, Property 12: Traversal Type Switch Resets State**
    // *For any* traversal type change, the visualization SHALL reset to initial 
    // state and the code panel SHALL display the algorithm corresponding to 
    // the newly selected type.
    // **Validates: Requirements 6.2**

    const arbTraversalType = fc.constantFrom('inorder', 'preorder', 'postorder');

    it('Property 12a: Switching traversal type resets step index', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                arbTraversalType,
                fc.integer({ min: 1, max: 20 }),
                (initialType, newType, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(initialType);
                    
                    // Take some steps
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                    }
                    
                    // Switch traversal type
                    engine.initialize(newType);
                    
                    // Verify reset
                    expect(engine.getCurrentStepIndex()).toBe(-1);
                    expect(engine.getState().callStack.length).toBe(0);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 12b: Switching traversal type clears call stack', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                arbTraversalType,
                fc.integer({ min: 5, max: 30 }),
                (initialType, newType, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(initialType);
                    
                    // Take steps to build up stack
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                    }
                    
                    // Switch traversal type
                    engine.initialize(newType);
                    
                    // Stack should be empty
                    expect(engine.getState().callStack.length).toBe(0);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 12c: Switching traversal type resets node states', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                arbTraversalType,
                fc.integer({ min: 5, max: 30 }),
                (initialType, newType, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(initialType);
                    
                    // Take steps to change node states
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                    }
                    
                    // Switch traversal type
                    engine.initialize(newType);
                    
                    // All nodes should be UNVISITED
                    const state = engine.getState();
                    const allNodes = getAllNodes(tree);
                    for (const node of allNodes) {
                        expect(state.nodeStates.get(node.value)).toBe(NodeState.UNVISITED);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 12d: New traversal type generates correct steps', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const tree = createDefaultTree();
                const engine = new ExecutionEngine(tree);
                engine.initialize(type);
                
                // Get expected generator
                const generator = getTraversalGenerator(type);
                const expectedSteps = generator.generateSteps(tree);
                
                // Verify step count matches
                expect(engine.getTotalSteps()).toBe(expectedSteps.length);
                
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 12e: Traversal type is stored correctly', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const tree = createDefaultTree();
                const engine = new ExecutionEngine(tree);
                engine.initialize(type);
                
                expect(engine.getTraversalType()).toBe(type);
                
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 12f: Switching to same type still resets', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 5, max: 20 }),
                (type, numSteps) => {
                    const tree = createDefaultTree();
                    const engine = new ExecutionEngine(tree);
                    engine.initialize(type);
                    
                    // Take some steps
                    const totalSteps = engine.getTotalSteps();
                    const stepsToTake = Math.min(numSteps, totalSteps);
                    for (let i = 0; i < stepsToTake; i++) {
                        engine.nextStep();
                    }
                    
                    // Re-initialize with same type
                    engine.initialize(type);
                    
                    // Should still reset
                    expect(engine.getCurrentStepIndex()).toBe(-1);
                    expect(engine.getState().callStack.length).toBe(0);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
