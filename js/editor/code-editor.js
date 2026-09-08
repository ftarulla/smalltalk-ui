/**
 * Line-numbered Smalltalk Code Editor Component
 * Integrates synchronized textarea overlay with Smalltalk syntax highlighting,
 * auto-indentation, tab insertion, line numbering, and classic Smalltalk hotkeys.
 */

class SmalltalkCodeEditor {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - Container element to attach editor
     * @param {string} [options.value] - Initial code text
     * @param {boolean} [options.readOnly] - Readonly flag
     * @param {Function} [options.onAccept] - Callback for Ctrl+S / Cmd+S (Save/Compile)
     * @param {Function} [options.onDoIt] - Callback for Ctrl+D / Cmd+D
     * @param {Function} [options.onPrintIt] - Callback for Ctrl+P / Cmd+P
     * @param {Function} [options.onInspectIt] - Callback for Ctrl+I / Cmd+I
     * @param {Function} [options.onChange] - Callback for text change
     */
    constructor(options = {}) {
        this.container = options.container;
        this.value = options.value || '';
        this.readOnly = !!options.readOnly;
        this.onAccept = options.onAccept || null;
        this.onDoIt = options.onDoIt || null;
        this.onPrintIt = options.onPrintIt || null;
        this.onInspectIt = options.onInspectIt || null;
        this.onChange = options.onChange || null;

        this.dom = {};
        this.isDirty = false;
        this.originalValue = this.value;

        this.render();
        this.bindEvents();
        this.setValue(this.value);
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'st-code-editor';

        this.element.innerHTML = `
            <div class="editor-header-bar">
                <div class="editor-status-indicator" title="Saved state">
                    <span class="status-dot"></span>
                    <span class="status-text">Clean</span>
                </div>
                <div class="editor-actions">
                    <button class="editor-btn btn-accept" title="Accept (Ctrl+S / Cmd+S)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Accept</span>
                    </button>
                    <button class="editor-btn btn-revert" title="Revert changes">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                        <span>Revert</span>
                    </button>
                    <div class="editor-separator"></div>
                    <button class="editor-btn btn-doit" title="Do It (Ctrl+D / Cmd+D)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <span>Do It</span>
                    </button>
                    <button class="editor-btn btn-printit" title="Print It (Ctrl+P / Cmd+P)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        <span>Print It</span>
                    </button>
                    <button class="editor-btn btn-inspectit" title="Inspect (Ctrl+I / Cmd+I)">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <span>Inspect</span>
                    </button>
                </div>
            </div>
            <div class="editor-main-area">
                <div class="editor-gutter"></div>
                <div class="editor-wrapper">
                    <pre class="editor-highlight" aria-hidden="true"><code></code></pre>
                    <textarea class="editor-input" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
                </div>
            </div>
            <div class="editor-footer-bar">
                <span class="editor-cursor-pos">Ln 1, Col 1</span>
                <span class="editor-selection-info"></span>
                <span class="editor-encoding">Smalltalk / UTF-8</span>
            </div>
        `;

        if (this.container) {
            this.container.appendChild(this.element);
        }

        this.dom = {
            gutter: this.element.querySelector('.editor-gutter'),
            highlight: this.element.querySelector('.editor-highlight code'),
            highlightPre: this.element.querySelector('.editor-highlight'),
            textarea: this.element.querySelector('.editor-input'),
            cursorPos: this.element.querySelector('.editor-cursor-pos'),
            selectionInfo: this.element.querySelector('.editor-selection-info'),
            statusDot: this.element.querySelector('.status-dot'),
            statusText: this.element.querySelector('.status-text'),
            btnAccept: this.element.querySelector('.btn-accept'),
            btnRevert: this.element.querySelector('.btn-revert'),
            btnDoIt: this.element.querySelector('.btn-doit'),
            btnPrintIt: this.element.querySelector('.btn-printit'),
            btnInspectIt: this.element.querySelector('.btn-inspectit')
        };

        if (this.readOnly) {
            this.dom.textarea.setAttribute('readonly', 'true');
            this.element.classList.add('readonly');
        }
    }

    bindEvents() {
        const { textarea, highlightPre, gutter, btnAccept, btnRevert, btnDoIt, btnPrintIt, btnInspectIt } = this.dom;

        // Input sync
        textarea.addEventListener('input', () => {
            this.value = textarea.value;
            this.updateHighlight();
            this.updateGutter();
            this.checkDirty();
            if (this.onChange) this.onChange(this.value);
        });

        // Scroll sync
        const syncScroll = () => {
            highlightPre.scrollTop = textarea.scrollTop;
            highlightPre.scrollLeft = textarea.scrollLeft;
            gutter.scrollTop = textarea.scrollTop;
        };

        textarea.addEventListener('scroll', syncScroll);

        // Cursor & Selection tracking
        const updateCursor = () => {
            const pos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, pos);
            const lines = textBefore.split('\n');
            const row = lines.length;
            const col = lines[lines.length - 1].length + 1;
            this.dom.cursorPos.textContent = `Ln ${row}, Col ${col}`;

            const selLen = Math.abs(textarea.selectionEnd - textarea.selectionStart);
            if (selLen > 0) {
                this.dom.selectionInfo.textContent = `(${selLen} selected)`;
            } else {
                this.dom.selectionInfo.textContent = '';
            }
        };

        textarea.addEventListener('keyup', updateCursor);
        textarea.addEventListener('click', updateCursor);
        textarea.addEventListener('select', updateCursor);

        // Keyboard Shortcuts
        textarea.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

            // Tab handling
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const val = textarea.value;

                if (e.shiftKey) {
                    // Outdent
                    // Find start of line
                    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
                    if (val.substr(lineStart, 1) === '\t') {
                        textarea.value = val.substring(0, lineStart) + val.substring(lineStart + 1);
                        textarea.selectionStart = textarea.selectionEnd = Math.max(start - 1, lineStart);
                    } else if (val.substr(lineStart, 4) === '    ') {
                        textarea.value = val.substring(0, lineStart) + val.substring(lineStart + 4);
                        textarea.selectionStart = textarea.selectionEnd = Math.max(start - 4, lineStart);
                    }
                } else {
                    // Indent with tab character (Smalltalk standard)
                    textarea.value = val.substring(0, start) + '\t' + val.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + 1;
                }
                textarea.dispatchEvent(new Event('input'));
                return;
            }

            // Auto indentation on Enter
            if (e.key === 'Enter') {
                const start = textarea.selectionStart;
                const val = textarea.value;
                const lineStart = val.lastIndexOf('\n', start - 1) + 1;
                const currentLine = val.substring(lineStart, start);
                const indentMatch = currentLine.match(/^[\t ]+/);
                const indent = indentMatch ? indentMatch[0] : '';

                if (indent) {
                    e.preventDefault();
                    textarea.value = val.substring(0, start) + '\n' + indent + val.substring(textarea.selectionEnd);
                    textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
                    textarea.dispatchEvent(new Event('input'));
                    return;
                }
            }

            // Smalltalk Hotkeys
            if (ctrlOrCmd) {
                const key = e.key.toLowerCase();
                if (key === 's') {
                    // Accept (Save)
                    e.preventDefault();
                    this.triggerAccept();
                } else if (key === 'd') {
                    // Do It
                    e.preventDefault();
                    this.triggerDoIt();
                } else if (key === 'p') {
                    // Print It
                    e.preventDefault();
                    this.triggerPrintIt();
                } else if (key === 'i') {
                    // Inspect It
                    e.preventDefault();
                    this.triggerInspectIt();
                }
            }
        });

        // Button clicks
        btnAccept.addEventListener('click', () => this.triggerAccept());
        btnRevert.addEventListener('click', () => this.triggerRevert());
        btnDoIt.addEventListener('click', () => this.triggerDoIt());
        btnPrintIt.addEventListener('click', () => this.triggerPrintIt());
        btnInspectIt.addEventListener('click', () => this.triggerInspectIt());
    }

    setValue(text, isOriginal = true) {
        this.value = text || '';
        if (isOriginal) {
            this.originalValue = this.value;
            this.isDirty = false;
        }
        this.dom.textarea.value = this.value;
        this.updateHighlight();
        this.updateGutter();
        this.checkDirty();
    }

    getValue() {
        return this.dom.textarea.value;
    }

    getSelectedText() {
        const { textarea } = this.dom;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== end) {
            return textarea.value.substring(start, end);
        }
        // If nothing selected, get current line
        const val = textarea.value;
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = val.indexOf('\n', start);
        if (lineEnd === -1) lineEnd = val.length;
        return val.substring(lineStart, lineEnd);
    }

    insertTextAtSelection(text) {
        const { textarea } = this.dom;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        textarea.value = val.substring(0, end) + text + val.substring(end);
        textarea.selectionStart = end;
        textarea.selectionEnd = end + text.length;
        textarea.dispatchEvent(new Event('input'));
        textarea.focus();
    }

    updateHighlight() {
        const highlighted = SmalltalkSyntaxHighlighter.highlight(this.value);
        // Ensure trailing newline is rendered
        this.dom.highlight.innerHTML = highlighted + (this.value.endsWith('\n') ? ' ' : '');
    }

    updateGutter() {
        const lineCount = (this.value.match(/\n/g) || []).length + 1;
        let gutterHtml = '';
        for (let i = 1; i <= lineCount; i++) {
            gutterHtml += `<div class="gutter-num">${i}</div>`;
        }
        this.dom.gutter.innerHTML = gutterHtml;
    }

    checkDirty() {
        this.isDirty = (this.value !== this.originalValue);
        if (this.isDirty) {
            this.dom.statusDot.className = 'status-dot dirty';
            this.dom.statusText.textContent = 'Modified';
            this.dom.btnAccept.classList.add('highlight-save');
        } else {
            this.dom.statusDot.className = 'status-dot clean';
            this.dom.statusText.textContent = 'Clean';
            this.dom.btnAccept.classList.remove('highlight-save');
        }
    }

    markSaved(savedValue) {
        if (savedValue !== undefined) {
            this.value = savedValue;
            this.dom.textarea.value = savedValue;
        }
        this.originalValue = this.value;
        this.checkDirty();
    }

    triggerAccept() {
        if (this.onAccept) {
            this.onAccept(this.getValue(), () => this.markSaved());
        }
    }

    triggerRevert() {
        this.setValue(this.originalValue, true);
    }

    triggerDoIt() {
        const text = this.getSelectedText();
        if (this.onDoIt) this.onDoIt(text);
    }

    triggerPrintIt() {
        const text = this.getSelectedText();
        if (this.onPrintIt) {
            this.onPrintIt(text, (result) => {
                this.insertTextAtSelection(' "' + result + '" ');
            });
        }
    }

    triggerInspectIt() {
        const text = this.getSelectedText();
        if (this.onInspectIt) this.onInspectIt(text);
    }

    focus() {
        this.dom.textarea.focus();
    }
}

window.SmalltalkCodeEditor = SmalltalkCodeEditor;
