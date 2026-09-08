/**
 * Smalltalk Transcript Window
 * Displays system logs, DoIt outputs, and Transcript output stream.
 */

class TranscriptWindow {
    constructor(client, windowManager) {
        this.client = client;
        this.windowManager = windowManager;

        this.window = this.windowManager.createWindow({
            title: 'Transcript',
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
            width: 520,
            height: 320,
            x: 60,
            y: 420,
            className: 'window-transcript'
        });

        this.render();
    }

    render() {
        const body = this.window.body;
        body.innerHTML = `
            <div class="transcript-layout">
                <div class="transcript-toolbar">
                    <span class="transcript-title">System Log</span>
                    <button class="btn-clear-transcript">Clear</button>
                </div>
                <div class="transcript-content" tabIndex="0"></div>
            </div>
        `;

        this.dom = {
            content: body.querySelector('.transcript-content'),
            btnClear: body.querySelector('.btn-clear-transcript')
        };

        this.dom.btnClear.addEventListener('click', () => {
            this.clear();
        });

        this.show('Cuis-Smalltalk University WebUI Initialized.\nReady.\n');
    }

    show(text) {
        if (!this.dom || !this.dom.content) return;
        const span = document.createElement('span');
        span.textContent = text;
        this.dom.content.appendChild(span);
        this.dom.content.scrollTop = this.dom.content.scrollHeight;
    }

    clear() {
        if (this.dom && this.dom.content) {
            this.dom.content.innerHTML = '';
        }
    }
}

window.TranscriptWindow = TranscriptWindow;
