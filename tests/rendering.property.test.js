import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    TreeNode,
    computeNodePositions,
    getAllNodes,
    getAllEdges,
    countNodes
} from '../src/tree-model.js';
import { NodeState } from '../src/execution-step.js';
import {
    TreeRenderer,
    getColorForState,
    hasColorMapping,
    getAllNodeStates,
    isValidHexColor,
    NODE_COLORS
} from '../src/tree-renderer.js';

// ============================================================
// Custom Generators
// ============================================================

/**
 * Generates a random binary tree with 1-15 nodes
 * Values are unique integers
 */
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

/**
 * Generates canvas dimensions
 */
const arbCanvasDimensions = fc.record({
    width: fc.integer({ min: 200, max: 1000 }),
    height: fc.integer({ min: 200, max: 800 })
});

// ============================================================
// Property Tests
// ============================================================

describe('Node Rendering Completeness', () => {
    // **Feature: tree-traversal-visualizer, Property 2: Node Rendering Completeness**
    // *For any* tree with parent-child relationships, the renderer SHALL produce 
    // visual connections for every edge, and *for any* node, the rendered output 
    // SHALL contain that node's value.
    // **Validates: Requirements 1.3, 1.4**

    it('Property 2a: Every node has computed positions after computeNodePositions', () => {
        fc.assert(
            fc.property(
                arbTreeNode,
                arbCanvasDimensions,
                (tree, { width, height }) => {
                    // Compute positions
                    computeNodePositions(tree, width, height);

                    // Get all nodes
                    const nodes = getAllNodes(tree);

                    // Every node should have valid x, y positions
                    for (const node of nodes) {
                        expect(typeof node.x).toBe('number');
                        expect(typeof node.y).toBe('number');
                        expect(node.x).toBeGreaterThanOrEqual(0);
                        expect(node.x).toBeLessThanOrEqual(width);
                        expect(node.y).toBeGreaterThan(0);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 2b: Every node value is accessible for rendering', () => {
        fc.assert(
            fc.property(
                arbTreeNode,
                (tree) => {
                    const nodes = getAllNodes(tree);

                    // Every node should have a value that can be displayed
                    for (const node of nodes) {
                        expect(node.value).toBeDefined();
                        expect(typeof node.value).toBe('number');
                        // Value should be convertible to string for display
                        expect(String(node.value)).toBeTruthy();
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 2c: Every parent-child edge can be identified for drawing connections', () => {
        fc.assert(
            fc.property(
                arbTreeNode,
                arbCanvasDimensions,
                (tree, { width, height }) => {
                    computeNodePositions(tree, width, height);

                    const edges = getAllEdges(tree);
                    const nodeCount = countNodes(tree);

                    // Number of edges should be nodeCount - 1 (tree property)
                    expect(edges.length).toBe(nodeCount - 1);

                    // Every edge should have valid parent and child with positions
                    for (const edge of edges) {
                        expect(edge.parent).toBeDefined();
                        expect(edge.child).toBeDefined();
                        expect(typeof edge.parent.x).toBe('number');
                        expect(typeof edge.parent.y).toBe('number');
                        expect(typeof edge.child.x).toBe('number');
                        expect(typeof edge.child.y).toBe('number');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 2d: Child nodes are positioned below their parents', () => {
        fc.assert(
            fc.property(
                arbTreeNode,
                arbCanvasDimensions,
                (tree, { width, height }) => {
                    computeNodePositions(tree, width, height);

                    const edges = getAllEdges(tree);

                    // Every child should be below its parent (greater y value)
                    for (const edge of edges) {
                        expect(edge.child.y).toBeGreaterThan(edge.parent.y);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 2e: Left children are positioned to the left of their parents', () => {
        fc.assert(
            fc.property(
                arbTreeNode,
                arbCanvasDimensions,
                (tree, { width, height }) => {
                    computeNodePositions(tree, width, height);

                    // Check all nodes with left children
                    function checkLeftChildren(node) {
                        if (!node) return true;
                        if (node.left) {
                            // Left child should be to the left (smaller x)
                            if (node.left.x >= node.x) return false;
                        }
                        return checkLeftChildren(node.left) && checkLeftChildren(node.right);
                    }

                    return checkLeftChildren(tree);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 2f: Right children are positioned to the right of their parents', () => {
        fc.assert(
            fc.property(
                arbTreeNode,
                arbCanvasDimensions,
                (tree, { width, height }) => {
                    computeNodePositions(tree, width, height);

                    // Check all nodes with right children
                    function checkRightChildren(node) {
                        if (!node) return true;
                        if (node.right) {
                            // Right child should be to the right (greater x)
                            if (node.right.x <= node.x) return false;
                        }
                        return checkRightChildren(node.left) && checkRightChildren(node.right);
                    }

                    return checkRightChildren(tree);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ============================================================
// Property 1: Node State Color Mapping
// ============================================================

describe('Node State Color Mapping', () => {
    // **Feature: tree-traversal-visualizer, Property 1: Node State Color Mapping**
    // *For any* tree node and *for any* valid node state (Unvisited, Processing, 
    // Visited, Finished), the rendered node color SHALL match the predefined 
    // color for that state.
    // **Validates: Requirements 1.2**

    const arbNodeState = fc.constantFrom(
        NodeState.UNVISITED,
        NodeState.PROCESSING,
        NodeState.VISITED,
        NodeState.FINISHED
    );

    it('Property 1a: Every valid NodeState has a color mapping', () => {
        fc.assert(
            fc.property(arbNodeState, (state) => {
                expect(hasColorMapping(state)).toBe(true);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 1b: getColorForState returns a valid hex color for any state', () => {
        fc.assert(
            fc.property(arbNodeState, (state) => {
                const color = getColorForState(state);
                expect(isValidHexColor(color)).toBe(true);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 1c: Same state always returns same color (deterministic)', () => {
        fc.assert(
            fc.property(arbNodeState, (state) => {
                const color1 = getColorForState(state);
                const color2 = getColorForState(state);
                expect(color1).toBe(color2);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 1d: Different states have different colors', () => {
        const states = getAllNodeStates();
        const colors = states.map(s => getColorForState(s));
        const uniqueColors = new Set(colors);
        
        // All states should have unique colors
        expect(uniqueColors.size).toBe(states.length);
    });

    it('Property 1e: TreeRenderer.getColorForState matches standalone function', () => {
        fc.assert(
            fc.property(arbNodeState, (state) => {
                const renderer = new TreeRenderer();
                const rendererColor = renderer.getColorForState(state);
                const standaloneColor = getColorForState(state);
                expect(rendererColor).toBe(standaloneColor);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 1f: All predefined colors are valid hex colors', () => {
        const renderer = new TreeRenderer();
        expect(renderer.allColorsAreValid()).toBe(true);
    });

    it('Property 1g: All node states have color mappings', () => {
        const renderer = new TreeRenderer();
        expect(renderer.allStatesHaveColors()).toBe(true);
    });

    it('Property 1h: Color mapping matches expected values', () => {
        expect(NODE_COLORS[NodeState.UNVISITED]).toBe('#4a5568');
        expect(NODE_COLORS[NodeState.PROCESSING]).toBe('#ecc94b');
        expect(NODE_COLORS[NodeState.VISITED]).toBe('#4299e1');
        expect(NODE_COLORS[NodeState.FINISHED]).toBe('#48bb78');
    });

    it('Property 1i: Unknown state falls back to UNVISITED color', () => {
        const unknownState = 'unknown_state';
        const color = getColorForState(unknownState);
        expect(color).toBe(NODE_COLORS[NodeState.UNVISITED]);
    });
});


// ============================================================
// Property 3: Code Line Highlighting Accuracy
// ============================================================

import {
    CodeRenderer,
    CODE_TEMPLATES,
    TRAVERSAL_TYPES,
    getCodeTemplate,
    getLineCount,
    isValidLineNumber,
    isValidTraversalType
} from '../src/code-renderer.js';
import {
    InorderGenerator,
    PreorderGenerator,
    PostorderGenerator,
    getTraversalGenerator
} from '../src/traversal-generators.js';
import { TreeNode as TreeNodeModel, createDefaultTree } from '../src/tree-model.js';

describe('Code Line Highlighting Accuracy', () => {
    // **Feature: tree-traversal-visualizer, Property 3: Code Line Highlighting Accuracy**
    // *For any* execution step with a codeLine property, the highlighted line in 
    // the code panel SHALL equal the step's codeLine value.
    // **Validates: Requirements 2.2**

    const arbTraversalType = fc.constantFrom('inorder', 'preorder', 'postorder');
    
    const arbValidLineNumber = (type) => fc.integer({ min: 1, max: getLineCount(type) });

    it('Property 3a: highlightLine sets the correct line', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 6 }),
                (type, lineNumber) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(type);
                    renderer.highlightLine(lineNumber);
                    
                    expect(renderer.getHighlightedLine()).toBe(lineNumber);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3b: clearHighlight resets highlighted line to 0', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 6 }),
                (type, lineNumber) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(type);
                    renderer.highlightLine(lineNumber);
                    renderer.clearHighlight();
                    
                    expect(renderer.getHighlightedLine()).toBe(0);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3c: isLineHighlighted returns true only for highlighted line', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 6 }),
                fc.integer({ min: 1, max: 6 }),
                (type, highlightedLine, checkLine) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(type);
                    renderer.highlightLine(highlightedLine);
                    
                    if (highlightedLine === checkLine) {
                        expect(renderer.isLineHighlighted(checkLine)).toBe(true);
                    } else {
                        expect(renderer.isLineHighlighted(checkLine)).toBe(false);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3d: Execution step codeLine is always valid for its traversal type', () => {
        fc.assert(
            fc.property(arbTraversalType, (type) => {
                const tree = createDefaultTree();
                const generator = getTraversalGenerator(type);
                const steps = generator.generateSteps(tree);
                const lineCount = getLineCount(type);
                
                for (const step of steps) {
                    expect(step.codeLine).toBeGreaterThanOrEqual(1);
                    expect(step.codeLine).toBeLessThanOrEqual(lineCount);
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 3e: Setting traversal type resets highlight to 0', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                arbTraversalType,
                fc.integer({ min: 1, max: 6 }),
                (initialType, newType, lineNumber) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(initialType);
                    renderer.highlightLine(lineNumber);
                    renderer.setTraversalType(newType);
                    
                    expect(renderer.getHighlightedLine()).toBe(0);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3f: All traversal types have exactly 6 lines', () => {
        for (const type of TRAVERSAL_TYPES) {
            expect(getLineCount(type)).toBe(6);
        }
    });

    it('Property 3g: getLineText returns correct text for valid lines', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 6 }),
                (type, lineNumber) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(type);
                    const text = renderer.getLineText(lineNumber);
                    const template = getCodeTemplate(type);
                    
                    expect(text).toBe(template[lineNumber - 1].text);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3h: getLineText returns null for invalid lines', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 7, max: 100 }),
                (type, lineNumber) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(type);
                    const text = renderer.getLineText(lineNumber);
                    
                    expect(text).toBeNull();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3i: Highlighting line 0 clears highlight', () => {
        fc.assert(
            fc.property(
                arbTraversalType,
                fc.integer({ min: 1, max: 6 }),
                (type, lineNumber) => {
                    const renderer = new CodeRenderer();
                    renderer.setTraversalType(type);
                    renderer.highlightLine(lineNumber);
                    renderer.highlightLine(0);
                    
                    expect(renderer.getHighlightedLine()).toBe(0);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 3j: Code templates have valid structure', () => {
        for (const type of TRAVERSAL_TYPES) {
            const template = getCodeTemplate(type);
            
            for (const line of template) {
                // Each line should have text and tokens
                expect(line.text).toBeDefined();
                expect(typeof line.text).toBe('string');
                expect(line.tokens).toBeDefined();
                expect(Array.isArray(line.tokens)).toBe(true);
                
                // Each token should have type and text
                for (const token of line.tokens) {
                    expect(token.type).toBeDefined();
                    expect(token.text).toBeDefined();
                }
            }
        }
    });
});


// ============================================================
// Property 6 & 7: Stack Rendering
// ============================================================

import {
    StackRenderer,
    createStackFrame,
    isValidStackFrame
} from '../src/stack-renderer.js';
import { StackFrame } from '../src/execution-step.js';

/**
 * Helper to create a StackFrame with the correct constructor
 */
function makeStackFrame(functionName, nodeValue, returnAddress = 'caller') {
    return new StackFrame({ functionName, nodeValue, returnAddress });
}

describe('Stack Frame Contains Node Value', () => {
    // **Feature: tree-traversal-visualizer, Property 6: Stack Frame Contains Node Value**
    // *For any* stack frame in the call stack, the rendered frame SHALL display 
    // the node value (or "null" for null checks) that was passed to that function call.
    // **Validates: Requirements 3.3**

    const arbNodeValue = fc.oneof(
        fc.integer({ min: 1, max: 100 }),
        fc.constant(null)
    );

    const arbFunctionName = fc.constantFrom('inOrder', 'preOrder', 'postOrder');

    it('Property 6a: Stack frame stores node value correctly', () => {
        fc.assert(
            fc.property(
                arbFunctionName,
                arbNodeValue,
                (functionName, nodeValue) => {
                    const frame = makeStackFrame(functionName, nodeValue);
                    expect(frame.nodeValue).toBe(nodeValue);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 6b: Pushed frame contains correct node value', () => {
        fc.assert(
            fc.property(
                arbFunctionName,
                arbNodeValue,
                (functionName, nodeValue) => {
                    const renderer = new StackRenderer();
                    const frame = makeStackFrame(functionName, nodeValue);
                    renderer.push(frame);
                    
                    const topFrame = renderer.getTopFrame();
                    expect(topFrame.nodeValue).toBe(nodeValue);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 6c: createFrameHTML includes node value', () => {
        fc.assert(
            fc.property(
                arbFunctionName,
                arbNodeValue,
                (functionName, nodeValue) => {
                    const renderer = new StackRenderer();
                    const frame = makeStackFrame(functionName, nodeValue);
                    const html = renderer.createFrameHTML(frame, 0);
                    
                    const expectedDisplay = nodeValue !== null ? String(nodeValue) : 'null';
                    expect(html).toContain(expectedDisplay);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 6d: Frame function name is displayed', () => {
        fc.assert(
            fc.property(
                arbFunctionName,
                arbNodeValue,
                (functionName, nodeValue) => {
                    const renderer = new StackRenderer();
                    const frame = makeStackFrame(functionName, nodeValue);
                    const html = renderer.createFrameHTML(frame, 0);
                    
                    expect(html).toContain(functionName);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 6e: hasFrameWithNodeValue finds correct frames', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 1, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    nodeValues.forEach((value, i) => {
                        renderer.push(makeStackFrame('inOrder', value));
                    });
                    
                    // Check that all pushed values can be found
                    for (const value of nodeValues) {
                        expect(renderer.hasFrameWithNodeValue(value)).toBe(true);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 6f: isValidStackFrame validates correctly', () => {
        fc.assert(
            fc.property(
                arbFunctionName,
                arbNodeValue,
                (functionName, nodeValue) => {
                    const frame = makeStackFrame(functionName, nodeValue);
                    expect(isValidStackFrame(frame)).toBe(true);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('Stack Visual Order is LIFO', () => {
    // **Feature: tree-traversal-visualizer, Property 7: Stack Visual Order is LIFO**
    // *For any* call stack with multiple frames, the visual rendering SHALL display 
    // frames in LIFO order with the most recent call at the top.
    // **Validates: Requirements 3.4**

    const arbNodeValue = fc.integer({ min: 1, max: 100 });

    it('Property 7a: Visual order is reverse of push order', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 2, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    nodeValues.forEach((value, i) => {
                        renderer.push(makeStackFrame('inOrder', value));
                    });
                    
                    const visualOrder = renderer.getVisualOrder();
                    
                    // First in visual order should be last pushed
                    expect(visualOrder[0].nodeValue).toBe(nodeValues[nodeValues.length - 1]);
                    // Last in visual order should be first pushed
                    expect(visualOrder[visualOrder.length - 1].nodeValue).toBe(nodeValues[0]);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 7b: isVisualOrderLIFO returns true for valid stacks', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 1, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    nodeValues.forEach(value => {
                        renderer.push(makeStackFrame('inOrder', value));
                    });
                    
                    expect(renderer.isVisualOrderLIFO()).toBe(true);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 7c: Top frame is always most recently pushed', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 1, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    for (const value of nodeValues) {
                        renderer.push(makeStackFrame('inOrder', value));
                        expect(renderer.getTopFrame().nodeValue).toBe(value);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 7d: Pop returns frames in LIFO order', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 1, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    nodeValues.forEach(value => {
                        renderer.push(makeStackFrame('inOrder', value));
                    });
                    
                    // Pop should return in reverse order
                    for (let i = nodeValues.length - 1; i >= 0; i--) {
                        const frame = renderer.pop();
                        expect(frame.nodeValue).toBe(nodeValues[i]);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 7e: Empty stack returns null for getTopFrame', () => {
        const renderer = new StackRenderer();
        expect(renderer.getTopFrame()).toBeNull();
        expect(renderer.isEmpty()).toBe(true);
    });

    it('Property 7f: Clear empties the stack', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 1, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    nodeValues.forEach(value => {
                        renderer.push(makeStackFrame('inOrder', value));
                    });
                    
                    renderer.clear();
                    expect(renderer.isEmpty()).toBe(true);
                    expect(renderer.getStackSize()).toBe(0);
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('Property 7g: setStack restores stack correctly', () => {
        fc.assert(
            fc.property(
                fc.array(arbNodeValue, { minLength: 1, maxLength: 10 }),
                (nodeValues) => {
                    const renderer = new StackRenderer();
                    
                    const frames = nodeValues.map(v => makeStackFrame('inOrder', v));
                    renderer.setStack(frames);
                    
                    expect(renderer.getStackSize()).toBe(nodeValues.length);
                    
                    // Verify order is preserved
                    const stack = renderer.getStack();
                    for (let i = 0; i < nodeValues.length; i++) {
                        expect(stack[i].nodeValue).toBe(nodeValues[i]);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
