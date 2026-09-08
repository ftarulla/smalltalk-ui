/**
 * Smalltalk Workspace Window (Playground)
 * Scratchpad for evaluating Smalltalk code, testing expressions, and inspecting objects.
 */

class WorkspaceWindow {
    constructor(client, windowManager, initialCode = '') {
        this.client = client;
        this.windowManager = windowManager;

        const defaultSample = initialCode || `"Smalltalk Workspace / Playground
Use Ctrl+D (Do It), Ctrl+P (Print It), or Ctrl+I (Inspect It)"

| counter |
counter := Counter startingAt: 10.
counter step: 5.
counter increment.
counter count.`;

        this.window = this.windowManager.createWindow({
            title: 'Workspace',
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
            width: 580,
            height: 380,
            className: 'window-workspace'
        });

        this.render(defaultSample);
    }

    render(initialCode) {
        const body = this.window.body;
        body.innerHTML = `
            <div class="workspace-layout">
                <div class="workspace-toolbar">
                    <span class="workspace-tip">Select code and press <b>Ctrl+D</b> (DoIt) or <b>Ctrl+P</b> (PrintIt)</span>
                </div>
                <div class="workspace-editor-container"></div>
            </div>
        `;

        const container = body.querySelector('.workspace-editor-container');
        this.editor = new SmalltalkCodeEditor({
            container: container,
            value: initialCode,
            onDoIt: (expr) => this.handleDoIt(expr),
            onPrintIt: (expr, callback) => this.handlePrintIt(expr, callback),
            onInspectIt: (expr) => this.handleInspectIt(expr),
            onAccept: (code, onSaved) => {
                if (onSaved) onSaved();
            }
        });
    }

    async handleDoIt(expr) {
        const res = await this.client.evaluate(expr);
        if (window.smalltalkApp && window.smalltalkApp.transcript) {
            window.smalltalkApp.transcript.show(`[DoIt] ${expr}\n`);
            if (res.result) {
                window.smalltalkApp.transcript.show(`-> ${res.result}\n`);
            }
        }
    }

    async handlePrintIt(expr, callback) {
        const res = await this.client.evaluate(expr);
        if (callback && res.result !== undefined) {
            callback(res.result);
        }
    }

    async handleInspectIt(expr) {
        const res = await this.client.evaluate(expr);
        alert(`Inspector:\n\nExpression: ${expr}\nValue: ${res.result || 'nil'}`);
    }
}

window.WorkspaceWindow = WorkspaceWindow;
