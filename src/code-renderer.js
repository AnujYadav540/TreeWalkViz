// ============================================================
// CODE RENDERER MODULE
// ============================================================

/**
 * Code templates for each traversal type with syntax highlighting
 * Each line has tokens for syntax highlighting
 */
export const CODE_TEMPLATES = {
    inorder: [
        { text: 'void inOrder(Node node) {', tokens: [
            { type: 'keyword', text: 'void' },
            { type: 'text', text: ' ' },
            { type: 'method', text: 'inOrder' },
            { type: 'text', text: '(' },
            { type: 'type', text: 'Node' },
            { type: 'text', text: ' ' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: ') {' }
        ]},
        { text: '    if (node == null) return;', tokens: [
            { type: 'text', text: '    ' },
            { type: 'keyword', text: 'if' },
            { type: 'text', text: ' (' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: ' == ' },
            { type: 'keyword', text: 'null' },
            { type: 'text', text: ') ' },
            { type: 'keyword', text: 'return' },
            { type: 'text', text: ';' }
        ]},
        { text: '    inOrder(node.left);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'inOrder' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.left);' }
        ]},
        { text: '    print(node.val);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'print' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.val);' }
        ]},
        { text: '    inOrder(node.right);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'inOrder' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.right);' }
        ]},
        { text: '}', tokens: [
            { type: 'text', text: '}' }
        ]}
    ],
    preorder: [
        { text: 'void preOrder(Node node) {', tokens: [
            { type: 'keyword', text: 'void' },
            { type: 'text', text: ' ' },
            { type: 'method', text: 'preOrder' },
            { type: 'text', text: '(' },
            { type: 'type', text: 'Node' },
            { type: 'text', text: ' ' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: ') {' }
        ]},
        { text: '    if (node == null) return;', tokens: [
            { type: 'text', text: '    ' },
            { type: 'keyword', text: 'if' },
            { type: 'text', text: ' (' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: ' == ' },
            { type: 'keyword', text: 'null' },
            { type: 'text', text: ') ' },
            { type: 'keyword', text: 'return' },
            { type: 'text', text: ';' }
        ]},
        { text: '    print(node.val);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'print' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.val);' }
        ]},
        { text: '    preOrder(node.left);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'preOrder' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.left);' }
        ]},
        { text: '    preOrder(node.right);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'preOrder' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.right);' }
        ]},
        { text: '}', tokens: [
            { type: 'text', text: '}' }
        ]}
    ],
    postorder: [
        { text: 'void postOrder(Node node) {', tokens: [
            { type: 'keyword', text: 'void' },
            { type: 'text', text: ' ' },
            { type: 'method', text: 'postOrder' },
            { type: 'text', text: '(' },
            { type: 'type', text: 'Node' },
            { type: 'text', text: ' ' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: ') {' }
        ]},
        { text: '    if (node == null) return;', tokens: [
            { type: 'text', text: '    ' },
            { type: 'keyword', text: 'if' },
            { type: 'text', text: ' (' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: ' == ' },
            { type: 'keyword', text: 'null' },
            { type: 'text', text: ') ' },
            { type: 'keyword', text: 'return' },
            { type: 'text', text: ';' }
        ]},
        { text: '    postOrder(node.left);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'postOrder' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.left);' }
        ]},
        { text: '    postOrder(node.right);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'postOrder' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.right);' }
        ]},
        { text: '    print(node.val);', tokens: [
            { type: 'text', text: '    ' },
            { type: 'method', text: 'print' },
            { type: 'text', text: '(' },
            { type: 'variable', text: 'node' },
            { type: 'text', text: '.val);' }
        ]},
        { text: '}', tokens: [
            { type: 'text', text: '}' }
        ]}
    ]
};

/**
 * Valid traversal types
 */
export const TRAVERSAL_TYPES = ['inorder', 'preorder', 'postorder'];

/**
 * Get the code template for a traversal type
 * @param {string} type - Traversal type
 * @returns {Array} Code template
 */
export function getCodeTemplate(type) {
    return CODE_TEMPLATES[type] || CODE_TEMPLATES.inorder;
}

/**
 * Get the number of lines for a traversal type
 * @param {string} type - Traversal type
 * @returns {number} Number of lines
 */
export function getLineCount(type) {
    return getCodeTemplate(type).length;
}

/**
 * Check if a line number is valid for a traversal type
 * @param {string} type - Traversal type
 * @param {number} lineNumber - 1-indexed line number
 * @returns {boolean} True if valid
 */
export function isValidLineNumber(type, lineNumber) {
    const lineCount = getLineCount(type);
    return Number.isInteger(lineNumber) && lineNumber >= 1 && lineNumber <= lineCount;
}

/**
 * Check if a traversal type is valid
 * @param {string} type - Traversal type
 * @returns {boolean} True if valid
 */
export function isValidTraversalType(type) {
    return TRAVERSAL_TYPES.includes(type);
}

/**
 * CodeRenderer - Renders code with syntax highlighting and line highlighting
 * Testable version without DOM dependencies
 */
export class CodeRenderer {
    constructor() {
        this.currentType = 'inorder';
        this.highlightedLine = 0;
    }

    /**
     * Get the code template for the current traversal type
     * @returns {Array} Code template
     */
    getTemplate() {
        return getCodeTemplate(this.currentType);
    }

    /**
     * Set the traversal type
     * @param {string} type - 'inorder', 'preorder', or 'postorder'
     */
    setTraversalType(type) {
        if (isValidTraversalType(type)) {
            this.currentType = type;
            this.highlightedLine = 0;
        }
    }

    /**
     * Get the current traversal type
     * @returns {string}
     */
    getTraversalType() {
        return this.currentType;
    }

    /**
     * Highlight a specific line
     * @param {number} lineNumber - 1-indexed line number (0 for none)
     */
    highlightLine(lineNumber) {
        if (lineNumber === 0 || isValidLineNumber(this.currentType, lineNumber)) {
            this.highlightedLine = lineNumber;
        }
    }

    /**
     * Clear line highlighting
     */
    clearHighlight() {
        this.highlightedLine = 0;
    }

    /**
     * Get the current highlighted line
     * @returns {number} 1-indexed line number, or 0 if none
     */
    getHighlightedLine() {
        return this.highlightedLine;
    }

    /**
     * Get the number of lines in the current template
     * @returns {number}
     */
    getLineCount() {
        return getLineCount(this.currentType);
    }

    /**
     * Check if a line is currently highlighted
     * @param {number} lineNumber - 1-indexed line number
     * @returns {boolean}
     */
    isLineHighlighted(lineNumber) {
        return this.highlightedLine === lineNumber;
    }

    /**
     * Get the text content of a specific line
     * @param {number} lineNumber - 1-indexed line number
     * @returns {string|null} Line text or null if invalid
     */
    getLineText(lineNumber) {
        const template = this.getTemplate();
        if (lineNumber >= 1 && lineNumber <= template.length) {
            return template[lineNumber - 1].text;
        }
        return null;
    }
}
