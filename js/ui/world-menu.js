/**
 * World Menu & Top Navigation Bar
 * Handles top menu actions, connection modal, theme toggling, and global search.
 */

class WorldMenu {
    constructor(client, windowManager, app) {
        this.client = client;
        this.windowManager = windowManager;
        this.app = app;

        this.dom = {
            menuBar: document.getElementById('world-menu-bar'),
            btnNewBrowser: document.getElementById('btn-new-browser'),
            btnNewWorkspace: document.getElementById('btn-new-workspace'),
            btnTranscript: document.getElementById('btn-open-transcript'),
            btnLoadSt: document.getElementById('btn-load-st'),
            btnConnection: document.getElementById('btn-connection-status'),
            connectionBadge: document.getElementById('connection-badge'),
            btnTheme: document.getElementById('btn-toggle-theme'),
            btnHelp: document.getElementById('btn-help')
        };

        this.bindEvents();
        this.setupConnectionListener();
    }

    bindEvents() {
        this.dom.btnNewBrowser.addEventListener('click', () => {
            this.app.openBrowser();
        });

        this.dom.btnNewWorkspace.addEventListener('click', () => {
            this.app.openWorkspace();
        });

        this.dom.btnTranscript.addEventListener('click', () => {
            this.app.openTranscript();
        });

        this.dom.btnLoadSt.addEventListener('click', () => {
            this.app.openFileInDialog();
        });

        this.dom.btnConnection.addEventListener('click', () => {
            this.openConnectionSettingsModal();
        });

        this.dom.connectionBadge.addEventListener('click', () => {
            this.openConnectionSettingsModal();
        });

        this.dom.btnTheme.addEventListener('click', () => {
            this.toggleTheme();
        });

        if (this.dom.btnHelp) {
            this.dom.btnHelp.addEventListener('click', () => {
                this.openHelpModal();
            });
        }
    }

    setupConnectionListener() {
        this.client.onStatusChange((isConnected, isMock, info) => {
            const badge = this.dom.connectionBadge;
            if (isConnected) {
                badge.className = 'connection-pill online';
                badge.innerHTML = `<span class="indicator-dot"></span><span>Cuis Live (${info && info.system ? info.system : 'Connected'})</span>`;
            } else if (isMock) {
                badge.className = 'connection-pill mock';
                badge.innerHTML = `<span class="indicator-dot"></span><span>Standalone Mock</span>`;
            } else {
                badge.className = 'connection-pill offline';
                badge.innerHTML = `<span class="indicator-dot"></span><span>Offline (Mock Active)</span>`;
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('st-theme', newTheme);
    }

    openConnectionSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'st-modal-backdrop';
        modal.innerHTML = `
            <div class="st-modal connection-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                        <span>Cuis University Backend Connection</span>
                    </div>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-intro">
                        Connect SmalltalkUI to a running <b>Cuis-Smalltalk</b> or <b>Cuis University</b> image server.
                    </p>

                    <div class="form-group">
                        <label for="server-endpoint-input">Server REST URL:</label>
                        <input type="text" id="server-endpoint-input" class="form-input" value="${this.client.serverUrl}" placeholder="http://localhost:8080" />
                    </div>

                    <div class="connection-mode-toggle">
                        <label class="checkbox-label">
                            <input type="checkbox" id="check-mock-mode" ${this.client.isMockMode ? 'checked' : ''} />
                            <span>Force Standalone Mock Mode (No server required)</span>
                        </label>
                    </div>

                    <div class="connection-guide">
                        <h4>How to run the Cuis backend:</h4>
                        <ol>
                            <li>In Cuis, file in <code>backend/CuisWebServer.st</code></li>
                            <li>In a Workspace, evaluate: <code>SmalltalkUIWebServer startOn: 8080.</code></li>
                            <li>Or run <code>./backend/start-headless.sh</code> in terminal.</li>
                        </ol>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-secondary modal-cancel">Close</button>
                    <button class="modal-btn btn-primary btn-save-connection">Connect & Test</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const btnClose = modal.querySelector('.modal-close-btn');
        const btnCancel = modal.querySelector('.modal-cancel');
        const btnSave = modal.querySelector('.btn-save-connection');
        const inputUrl = modal.querySelector('#server-endpoint-input');
        const checkMock = modal.querySelector('#check-mock-mode');

        const closeModal = () => {
            if (modal.parentElement) modal.parentElement.removeChild(modal);
        };

        btnClose.addEventListener('click', closeModal);
        btnCancel.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        btnSave.addEventListener('click', async () => {
            btnSave.textContent = 'Testing connection...';
            btnSave.setAttribute('disabled', 'true');

            this.client.serverUrl = inputUrl.value.trim() || 'http://localhost:8080';
            this.client.isMockMode = checkMock.checked;

            const connected = await this.client.checkConnection();
            closeModal();

            if (connected) {
                alert(`Connected successfully to Cuis University server at ${this.client.serverUrl}!`);
                if (this.app.browsers) {
                    this.app.browsers.forEach(b => b.refresh());
                }
            } else if (!this.client.isMockMode) {
                alert(`Could not connect to ${this.client.serverUrl}. Operating in offline mock mode.`);
            }
        });
    }

    openHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'st-modal-backdrop';
        modal.innerHTML = `
            <div class="st-modal help-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        <span>SmalltalkUI Guide & Shortcuts</span>
                    </div>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <h4>Smalltalk Keyboard Shortcuts</h4>
                    <table class="shortcuts-table">
                        <tr><td><kbd>Ctrl+S</kbd> / <kbd>Cmd+S</kbd></td><td><b>Accept</b> &mdash; Compile/Save class definition or method</td></tr>
                        <tr><td><kbd>Ctrl+D</kbd> / <kbd>Cmd+D</kbd></td><td><b>Do It</b> &mdash; Evaluate selected Smalltalk code</td></tr>
                        <tr><td><kbd>Ctrl+P</kbd> / <kbd>Cmd+P</kbd></td><td><b>Print It</b> &mdash; Evaluate and print result inline</td></tr>
                        <tr><td><kbd>Ctrl+I</kbd> / <kbd>Cmd+I</kbd></td><td><b>Inspect</b> &mdash; Inspect evaluated expression</td></tr>
                        <tr><td><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd></td><td>Indent / Outdent code line</td></tr>
                    </table>

                    <h4>Features</h4>
                    <ul>
                        <li><b>Class Browser:</b> Classic 4-pane Cuis Smalltalk browser with line numbers, code highlighting, and instance/class method navigation.</li>
                        <li><b>Load .st Files:</b> Drag-and-drop or select any Smalltalk chunk <code>.st</code> fileout.</li>
                        <li><b>Export:</b> Export any class directly back to standard <code>.st</code> format.</li>
                        <li><b>Live Cuis Connection:</b> Connect to headless or GUI Cuis University on <code>http://localhost:8080</code>.</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-primary modal-cancel">Got it</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const btnClose = modal.querySelector('.modal-close-btn');
        const btnCancel = modal.querySelector('.modal-cancel');
        const closeModal = () => {
            if (modal.parentElement) modal.parentElement.removeChild(modal);
        };
        btnClose.addEventListener('click', closeModal);
        btnCancel.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

window.WorldMenu = WorldMenu;
