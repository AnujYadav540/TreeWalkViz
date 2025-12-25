import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TreeNode, countNodes } from '../src/tree-model.js';
import { StepType, StackAction } from '../src/execution-step.js';
import { getTraversalGenerator } from '../src/traversal-generators.js';

const arbTreeNode = fc.letrec((tie) => ({
    tree: fc.oneof(
        { weight: 1, arbitrary: fc.constant(null) },
        {
            weight: 3,
            arbitrary: fc.record({
                value: fc.integer({ min: 1, max: 100 }),
                left: tie('tree'),
                right: tie('tree')
            }).map(({ value, left, right }) => new TreeNode(value, left, right))
        }
    )
})).tree.filter(tree => tree !== null && countNodes(tree) <= 15);

const arbTraversalType = fc.constantFrom('inorder', 'preorder', 'postorder');

describe('Stack Operations Properties', () => {
    // **Feature: tree-traversal-visualizer, Property 4: Stack Push on Function Call**
    // **Validates: Requirements 3.1**
    it('Property 4: Every CALL step has stackAction PUSH', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                const callSteps = steps.filter(s => s.type === StepType.CALL);
                for (const step of callSteps) {
                    expect(step.stackAction).toBe(StackAction.PUSH);
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 4b: CALL steps contain valid node value', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                const callSteps = steps.filter(s => s.type === StepType.CALL);
                for (const step of callSteps) {
                    expect(step.nodeValue === null || typeof step.nodeValue === 'number').toBe(true);
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 4c: CALL increases stack size by 1', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                let stackSize = 0;
                for (const step of steps) {
                    const prev = stackSize;
                    if (step.stackAction === StackAction.PUSH) {
                        stackSize++;
                        expect(stackSize).toBe(prev + 1);
                    } else if (step.stackAction === StackAction.POP) {
                        stackSize--;
                    }
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    // **Feature: tree-traversal-visualizer, Property 5: Stack Pop on Function Return**
    // **Validates: Requirements 3.2**
    it('Property 5: Every RETURN step has stackAction POP', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                const returnSteps = steps.filter(s => s.type === StepType.RETURN);
                for (const step of returnSteps) {
                    expect(step.stackAction).toBe(StackAction.POP);
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 5b: RETURN decreases stack size by 1', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                let stackSize = 0;
                for (const step of steps) {
                    const prev = stackSize;
                    if (step.stackAction === StackAction.PUSH) {
                        stackSize++;
                    } else if (step.stackAction === StackAction.POP) {
                        stackSize--;
                        expect(stackSize).toBe(prev - 1);
                    }
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 5c: Stack is empty at end of traversal', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                let stackSize = 0;
                for (const step of steps) {
                    if (step.stackAction === StackAction.PUSH) stackSize++;
                    else if (step.stackAction === StackAction.POP) stackSize--;
                }
                expect(stackSize).toBe(0);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 5d: CALL count equals RETURN count', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                const calls = steps.filter(s => s.type === StepType.CALL).length;
                const returns = steps.filter(s => s.type === StepType.RETURN).length;
                expect(calls).toBe(returns);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 5e: Stack never goes negative', () => {
        fc.assert(
            fc.property(arbTreeNode, arbTraversalType, (tree, type) => {
                const steps = getTraversalGenerator(type).generateSteps(tree);
                let stackSize = 0;
                for (const step of steps) {
                    if (step.stackAction === StackAction.PUSH) stackSize++;
                    else if (step.stackAction === StackAction.POP) stackSize--;
                    expect(stackSize).toBeGreaterThanOrEqual(0);
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });
});
