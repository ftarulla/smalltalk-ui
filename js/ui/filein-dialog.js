/**
 * Smalltalk FileIn Modal & Drag-and-Drop Handler
 * Parses .st fileouts, provides structured preview, and files in to Cuis environment.
 */

class FileInDialog {
    constructor(client, windowManager, onFiledIn = null) {
        this.client = client;
        this.windowManager = windowManager;
        this.onFiledIn = onFiledIn;

        this.initDropZone();
    }

    initDropZone() {
        // Handle global drag and drop of .st files on the desktop
        window.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.add('drag-over-active');
        });

        window.addEventListener('dragleave', (e) => {
            if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                document.body.classList.remove('drag-over-active');
            }
        });

        window.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.body.classList.remove('drag-over-active');

            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (file.name.endsWith('.st') || file.name.endsWith('.txt') || file.type.includes('text')) {
                    this.readFileAndOpen(file);
                }
            }
        });
    }

    open() {
        const modal = document.createElement('div');
        modal.className = 'st-modal-backdrop';
        modal.innerHTML = `
            <div class="st-modal filein-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <span>Load Smalltalk (.st) File</span>
                    </div>
                    <button class="modal-close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="file-drop-area">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        <p class="drop-text">Drag & drop your <code>.st</code> file here</p>
                        <span class="drop-subtext">or click to browse files</span>
                        <input type="file" class="file-input-hidden" accept=".st,.txt" />
                    </div>

                    <div class="sample-loader">
                        <span>Or test with built-in sample:</span>
                        <button class="btn-load-sample">Load Counter.st</button>
                    </div>

                    <div class="file-preview-section" style="display: none;">
                        <div class="preview-header">
                            <span class="preview-filename"></span>
                            <span class="preview-badge">Ready to File In</span>
                        </div>
                        <div class="preview-stats"></div>
                        <div class="preview-classes-list"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn btn-secondary modal-cancel">Cancel</button>
                    <button class="modal-btn btn-primary btn-do-filein" disabled>File In to Cuis</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const dropArea = modal.querySelector('.file-drop-area');
        const fileInput = modal.querySelector('.file-input-hidden');
        const btnClose = modal.querySelector('.modal-close-btn');
        const btnCancel = modal.querySelector('.modal-cancel');
        const btnFileIn = modal.querySelector('.btn-do-filein');
        const btnLoadSample = modal.querySelector('.btn-load-sample');
        const previewSection = modal.querySelector('.file-preview-section');
        const previewFilename = modal.querySelector('.preview-filename');
        const previewStats = modal.querySelector('.preview-stats');
        const previewClassesList = modal.querySelector('.preview-classes-list');

        let loadedContent = null;
        let loadedFileName = '';
        let parsedData = null;

        const closeModal = () => {
            if (modal.parentElement) modal.parentElement.removeChild(modal);
        };

        btnClose.addEventListener('click', closeModal);
        btnCancel.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        dropArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (re) => {
                    handleFileLoaded(file.name, re.target.result);
                };
                reader.readAsText(file);
            }
        });

        btnLoadSample.addEventListener('click', async () => {
            try {
                const res = await fetch('samples/Counter.st');
                if (res.ok) {
                    const text = await res.text();
                    handleFileLoaded('Counter.st', text);
                }
            } catch (err) {
                console.error('Failed to load sample Counter.st', err);
            }
        });

        const handleFileLoaded = (filename, content) => {
            loadedFileName = filename;
            loadedContent = content;
            parsedData = STChunkParser.parse(content);

            previewFilename.textContent = filename;
            const classNames = Object.keys(parsedData.classes);
            let totalMethods = 0;
            for (const cls of Object.values(parsedData.classes)) {
                totalMethods += Object.keys(cls.instanceMethods || {}).length + Object.keys(cls.classMethods || {}).length;
            }

            previewStats.innerHTML = `
                <span class="stat-badge"><b>${classNames.length}</b> classes</span>
                <span class="stat-badge"><b>${totalMethods}</b> methods</span>
                <span class="stat-badge"><b>${parsedData.categories.length}</b> categories</span>
            `;

            let classesHtml = '<ul class="parsed-classes">';
            for (const [cName, cData] of Object.entries(parsedData.classes)) {
                const instCount = Object.keys(cData.instanceMethods || {}).length;
                const classCount = Object.keys(cData.classMethods || {}).length;
                classesHtml += `
                    <li>
                        <b>${cName}</b> (subclass of ${cData.superclass || 'Object'})
                        <div class="class-meta">${cData.category} &bull; ${instCount} instance methods &bull; ${classCount} class methods</div>
                    </li>
                `;
            }
            classesHtml += '</ul>';
            previewClassesList.innerHTML = classesHtml;

            previewSection.style.display = 'block';
            btnFileIn.removeAttribute('disabled');
        };

        btnFileIn.addEventListener('click', async () => {
            if (!loadedContent) return;
            btnFileIn.textContent = 'Filing In...';
            btnFileIn.setAttribute('disabled', 'true');

            const res = await this.client.fileIn(loadedContent);
            closeModal();

            if (window.smalltalkApp && window.smalltalkApp.transcript) {
                window.smalltalkApp.transcript.show(`[FileIn] Filed in "${loadedFileName}"\n`);
                if (res.live) {
                    window.smalltalkApp.transcript.show(`-> Successfully installed in live Cuis image.\n`);
                } else {
                    window.smalltalkApp.transcript.show(`-> Loaded in SmalltalkUI local environment.\n`);
                }
            }

            if (this.onFiledIn) {
                this.onFiledIn(parsedData);
            }
        });
    }

    readFileAndOpen(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const parsed = STChunkParser.parse(content);
            this.client.fileIn(content).then((res) => {
                if (window.smalltalkApp && window.smalltalkApp.transcript) {
                    window.smalltalkApp.transcript.show(`[FileIn] Auto filed-in "${file.name}"\n`);
                }
                if (this.onFiledIn) {
                    this.onFiledIn(parsed);
                }
            });
        };
        reader.readAsText(file);
    }
}

window.FileInDialog = FileInDialog;
