/**
 * SmalltalkUI - Main Application Entry Point
 * Bootstraps the desktop environment, window manager, API client, and default Smalltalk tools.
 */

class SmalltalkApp {
    constructor() {
        this.initTheme();

        const desktopElement = document.getElementById('desktop');
        this.client = new SmalltalkClient('http://localhost:8080');
        this.windowManager = new WindowManager(desktopElement);
        this.browsers = [];
        this.workspaces = [];
        this.transcript = null;

        this.fileInDialog = new FileInDialog(this.client, this.windowManager, (parsedData) => {
            this.handleFileInCompleted(parsedData);
        });

        this.worldMenu = new WorldMenu(this.client, this.windowManager, this);

        this.initDefaultWindows();
        this.client.checkConnection();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('st-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    initDefaultWindows() {
        // 1. Open System Browser
        const browser = this.openBrowser({
            category: 'SmalltalkUI-Samples',
            className: 'Counter',
            protocol: 'operations',
            selector: 'increment'
        });

        // 2. Open Workspace
        this.openWorkspace();

        // 3. Open Transcript
        this.openTranscript();

        // Focus the browser initially
        setTimeout(() => {
            if (browser && browser.window) {
                browser.window.focus();
            }
        }, 100);
    }

    openBrowser(options = {}) {
        const browser = new SystemBrowser(this.client, this.windowManager, options);
        this.browsers.push(browser);
        browser.window.onClose = () => {
            this.browsers = this.browsers.filter(b => b !== browser);
        };
        return browser;
    }

    openWorkspace(code = '') {
        const ws = new WorkspaceWindow(this.client, this.windowManager, code);
        this.workspaces.push(ws);
        ws.window.onClose = () => {
            this.workspaces = this.workspaces.filter(w => w !== ws);
        };
        return ws;
    }

    openTranscript() {
        if (this.transcript && this.transcript.window) {
            if (this.transcript.window.isMinimized) {
                this.transcript.window.minimize();
            }
            this.transcript.window.focus();
            return this.transcript;
        }
        this.transcript = new TranscriptWindow(this.client, this.windowManager);
        this.transcript.window.onClose = () => {
            this.transcript = null;
        };
        return this.transcript;
    }

    openFileInDialog() {
        this.fileInDialog.open();
    }

    handleFileInCompleted(parsedData) {
        // Refresh all open system browsers
        for (const b of this.browsers) {
            b.refresh();
        }

        // If classes were loaded, open or focus first class in browser
        const firstClassName = Object.keys(parsedData.classes)[0];
        if (firstClassName) {
            const firstClass = parsedData.classes[firstClassName];
            if (this.browsers.length > 0) {
                const b = this.browsers[0];
                b.selectCategory(firstClass.category).then(() => {
                    b.selectClass(firstClassName);
                });
                b.window.focus();
            } else {
                this.openBrowser({
                    category: firstClass.category,
                    className: firstClassName
                });
            }
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.smalltalkApp = new SmalltalkApp();
});
