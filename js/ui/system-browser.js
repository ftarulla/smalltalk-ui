/**
 * Smalltalk System Browser (Class Browser)
 * Classic 4-pane Cuis-Smalltalk browser:
 * [Categories] [Classes] [Protocols] [Methods]
 * [instance / ? / class / hierarchy toggle]
 * [Source Code Editor with syntax highlighting & line numbers]
 */

class SystemBrowser {
    constructor(client, windowManager, options = {}) {
        this.client = client;
        this.windowManager = windowManager;
        this.options = options;

        // Current state
        this.selectedCategory = options.category || null;
        this.selectedClass = options.className || null;
        this.selectedProtocol = options.protocol || '-- all --';
        this.selectedMethod = options.selector || null;
        this.side = options.side || 'instance'; // 'instance' | 'class'
        this.viewMode = 'code'; // 'code' | 'comment' | 'hierarchy'
        this.hierarchyView = false;

        this.categories = [];
        this.classes = [];
        this.protocols = [];
        this.methods = [];
        this.classDetails = null;

        this.window = this.windowManager.createWindow({
            title: 'System Browser',
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
            width: 860,
            height: 580,
            className: 'window-system-browser'
        });

        this.render();
        this.init();
    }

    render() {
        const body = this.window.body;
        body.innerHTML = `
            <div class="system-browser-layout">
                <!-- Top 4 Panes -->
                <div class="browser-panes">
                    <!-- Pane 1: System Categories -->
                    <div class="browser-pane pane-categories" data-pane="categories">
                        <div class="pane-header">
                            <input type="text" class="pane-search-input" placeholder="Categories..." aria-label="Filter categories">
                            <button class="pane-btn-add btn-add-category" title="New Category">+</button>
                        </div>
                        <ul class="pane-list list-categories"></ul>
                    </div>

                    <!-- Pane 2: Classes -->
                    <div class="browser-pane pane-classes" data-pane="classes">
                        <div class="pane-header">
                            <input type="text" class="pane-search-input" placeholder="Classes..." aria-label="Filter classes">
                            <button class="pane-btn-add btn-add-class" title="New Class">+</button>
                        </div>
                        <ul class="pane-list list-classes"></ul>
                    </div>

                    <!-- Right Section: Tab-enclosed Protocols and Methods -->
                    <div class="browser-side-container">
                        <div class="side-tab-bar">
                            <div class="switch-group side-tab-group">
                                <button class="switch-btn side-tab-btn btn-side-instance active" data-side="instance">instance</button>
                                <button class="switch-btn side-tab-btn btn-side-class" data-side="class">class</button>
                            </div>
                        </div>
                        <div class="side-panes-wrapper">
                            <!-- Pane 3: Protocols -->
                            <div class="browser-pane pane-protocols" data-pane="protocols">
                                <div class="pane-header">
                                    <input type="text" class="pane-search-input" placeholder="Protocols..." aria-label="Filter protocols">
                                    <button class="pane-btn-add btn-add-protocol" title="New Protocol">+</button>
                                </div>
                                <ul class="pane-list list-protocols"></ul>
                            </div>

                            <!-- Pane 4: Methods -->
                            <div class="browser-pane pane-methods" data-pane="methods">
                                <div class="pane-header">
                                    <input type="text" class="pane-search-input" placeholder="Methods..." aria-label="Filter methods">
                                    <button class="pane-btn-add btn-add-method" title="New Method">+</button>
                                </div>
                                <ul class="pane-list list-methods"></ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Middle Switches Bar -->
                <div class="browser-switch-bar">
                    <div class="switch-group mode-switches">
                        <button class="switch-btn btn-mode-comment" data-mode="comment" title="Class Comment">?</button>
                    </div>
                    <div class="switch-group view-switches">
                        <button class="switch-btn btn-toggle-hierarchy" title="Toggle Hierarchy View">hierarchy</button>
                        <button class="switch-btn btn-export-st" title="Export current class to .st file">export .st</button>
                        <button class="switch-btn btn-refresh-browser" title="Refresh browser">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        </button>
                    </div>
                </div>

                <!-- Bottom Editor Area -->
                <div class="browser-editor-container"></div>
            </div>
        `;

        this.dom = {
            layout: body.querySelector('.system-browser-layout'),
            listCategories: body.querySelector('.list-categories'),
            listClasses: body.querySelector('.list-classes'),
            listProtocols: body.querySelector('.list-protocols'),
            listMethods: body.querySelector('.list-methods'),
            searchCategories: body.querySelector('.pane-categories .pane-search-input'),
            searchClasses: body.querySelector('.pane-classes .pane-search-input'),
            searchProtocols: body.querySelector('.pane-protocols .pane-search-input'),
            searchMethods: body.querySelector('.pane-methods .pane-search-input'),
            btnAddCategory: body.querySelector('.btn-add-category'),
            btnAddClass: body.querySelector('.btn-add-class'),
            btnAddProtocol: body.querySelector('.btn-add-protocol'),
            btnAddMethod: body.querySelector('.btn-add-method'),
            btnSideInstance: body.querySelector('.btn-side-instance'),
            btnModeComment: body.querySelector('.btn-mode-comment'),
            btnSideClass: body.querySelector('.btn-side-class'),
            btnToggleHierarchy: body.querySelector('.btn-toggle-hierarchy'),
            btnExportSt: body.querySelector('.btn-export-st'),
            btnRefresh: body.querySelector('.btn-refresh-browser'),
            editorContainer: body.querySelector('.browser-editor-container')
        };

        // Initialize Code Editor
        this.editor = new SmalltalkCodeEditor({
            container: this.dom.editorContainer,
            value: '',
            onAccept: (code, onSaved) => this.handleAccept(code, onSaved),
            onDoIt: (expr) => this.handleDoIt(expr),
            onPrintIt: (expr, callback) => this.handlePrintIt(expr, callback),
            onInspectIt: (expr) => this.handleInspectIt(expr)
        });

        this.bindEvents();
    }

    bindEvents() {
        // Switch tabs
        this.dom.btnSideInstance.addEventListener('click', async () => {
            this.side = 'instance';
            this.viewMode = 'code';
            this.selectedProtocol = '-- all --';
            this.selectedMethod = null;
            this.updateSwitchState();
            await this.loadProtocolsAndMethods();
            this.updateEditorContent();
        });

        this.dom.btnSideClass.addEventListener('click', async () => {
            this.side = 'class';
            this.viewMode = 'code';
            this.selectedProtocol = '-- all --';
            this.selectedMethod = null;
            this.updateSwitchState();
            await this.loadProtocolsAndMethods();
            this.updateEditorContent();
        });

        this.dom.btnModeComment.addEventListener('click', () => {
            if (this.viewMode === 'comment') {
                this.viewMode = 'code';
            } else {
                this.viewMode = 'comment';
            }
            this.updateSwitchState();
            this.updateEditorContent();
        });

        this.dom.btnToggleHierarchy.addEventListener('click', () => {
            this.hierarchyView = !this.hierarchyView;
            this.dom.btnToggleHierarchy.classList.toggle('active', this.hierarchyView);
            this.renderClassesList();
        });

        this.dom.btnRefresh.addEventListener('click', () => {
            this.refresh();
        });

        this.dom.btnExportSt.addEventListener('click', () => {
            this.exportCurrentClass();
        });

        // Search inputs
        this.dom.searchCategories.addEventListener('input', () => this.renderCategoriesList());
        this.dom.searchClasses.addEventListener('input', () => this.renderClassesList());
        this.dom.searchProtocols.addEventListener('input', () => this.renderProtocolsList());
        this.dom.searchMethods.addEventListener('input', () => this.renderMethodsList());

        // Add buttons
        this.dom.btnAddCategory.addEventListener('click', () => this.promptNewCategory());
        this.dom.btnAddClass.addEventListener('click', () => this.promptNewClass());
        this.dom.btnAddProtocol.addEventListener('click', () => this.promptNewProtocol());
        this.dom.btnAddMethod.addEventListener('click', () => this.promptNewMethod());
    }

    async init() {
        await this.loadCategories();
        if (this.selectedCategory) {
            await this.loadClasses();
            if (this.selectedClass) {
                await this.loadClassDetails(this.selectedClass);
                await this.loadProtocolsAndMethods();
                if (this.selectedMethod) {
                    await this.selectMethod(this.selectedMethod);
                } else {
                    this.updateEditorContent();
                }
            }
        } else if (this.categories.length > 0) {
            await this.selectCategory(this.categories[0]);
        }
    }

    updateSwitchState() {
        this.dom.btnSideInstance.classList.toggle('active', this.side === 'instance' && this.viewMode !== 'comment');
        this.dom.btnSideClass.classList.toggle('active', this.side === 'class' && this.viewMode !== 'comment');
        this.dom.btnModeComment.classList.toggle('active', this.viewMode === 'comment');
    }

    async loadCategories() {
        this.categories = await this.client.getCategories();
        this.renderCategoriesList();
    }

    renderCategoriesList() {
        const filter = this.dom.searchCategories.value.toLowerCase();
        const list = this.dom.listCategories;
        list.innerHTML = '';

        const visible = this.categories.filter(c => c.toLowerCase().includes(filter));
        for (const cat of visible) {
            const li = document.createElement('li');
            li.className = `pane-item ${cat === this.selectedCategory ? 'selected' : ''}`;
            li.textContent = cat;
            li.addEventListener('click', () => this.selectCategory(cat));
            list.appendChild(li);
        }
    }

    async selectCategory(cat) {
        this.selectedCategory = cat;
        this.selectedClass = null;
        this.selectedProtocol = '-- all --';
        this.selectedMethod = null;
        this.classDetails = null;
        this.protocols = [];
        this.methods = [];

        this.renderCategoriesList();
        this.renderClassesList();
        this.renderProtocolsList();
        this.renderMethodsList();
        this.window.setTitle(`Browser: ${cat}`);
        await this.loadClasses();

        // If no class selected, display class definition template for this category
        this.showClassTemplate(cat);
    }

    async loadClasses() {
        this.classes = await this.client.getClasses(this.selectedCategory);
        this.renderClassesList();

        if (this.selectedClass) {
            await this.loadClassDetails(this.selectedClass);
        }
    }

    renderClassesList() {
        const filter = this.dom.searchClasses.value.toLowerCase();
        const list = this.dom.listClasses;
        list.innerHTML = '';

        let visible = this.classes.filter(c => c.name.toLowerCase().includes(filter));

        for (const cls of visible) {
            const li = document.createElement('li');
            li.className = `pane-item ${cls.name === this.selectedClass ? 'selected' : ''}`;

            const label = this.hierarchyView && cls.superclass
                ? `${cls.superclass} > ${cls.name}`
                : cls.name;

            li.innerHTML = `
                <span class="class-item-name">${label}</span>
                ${cls.hasSubclasses ? '<span class="has-subclasses" title="Has subclasses">▾</span>' : ''}
            `;

            li.addEventListener('click', () => this.selectClass(cls.name));
            list.appendChild(li);
        }
    }

    async selectClass(className) {
        this.selectedClass = className;
        this.selectedProtocol = '-- all --';
        this.selectedMethod = null;
        this.renderClassesList();
        this.renderProtocolsList();
        this.renderMethodsList();
        this.window.setTitle(`Browser: ${this.selectedCategory} >> ${className}`);

        await this.loadClassDetails(className);
        await this.loadProtocolsAndMethods();
        this.updateEditorContent();
    }

    async loadClassDetails(className) {
        this.classDetails = await this.client.getClassDetails(className);
    }

    async loadProtocolsAndMethods() {
        if (!this.selectedClass) {
            this.protocols = [];
            this.methods = [];
            this.renderProtocolsList();
            this.renderMethodsList();
            return;
        }

        this.protocols = await this.client.getProtocols(this.selectedClass, this.side);
        this.renderProtocolsList();

        await this.loadMethods();
    }

    renderProtocolsList() {
        const filter = this.dom.searchProtocols.value.toLowerCase();
        const list = this.dom.listProtocols;
        list.innerHTML = '';

        if (!this.selectedClass) return;

        // Add '-- all --' protocol option
        const allItem = document.createElement('li');
        allItem.className = `pane-item ${this.selectedProtocol === '-- all --' ? 'selected' : ''}`;
        allItem.textContent = '-- all --';
        allItem.addEventListener('click', () => this.selectProtocol('-- all --'));
        list.appendChild(allItem);

        const visible = this.protocols.filter(p => p.toLowerCase().includes(filter));
        for (const prot of visible) {
            const li = document.createElement('li');
            li.className = `pane-item ${prot === this.selectedProtocol ? 'selected' : ''}`;
            li.textContent = prot;
            li.addEventListener('click', () => this.selectProtocol(prot));
            list.appendChild(li);
        }
    }

    async selectProtocol(prot) {
        this.selectedProtocol = prot;
        this.selectedMethod = null;
        this.renderProtocolsList();
        await this.loadMethods();

        if (prot !== '-- all --') {
            // Show method template for this protocol
            this.showMethodTemplate(prot);
        } else {
            this.updateEditorContent();
        }
    }

    async loadMethods() {
        if (!this.selectedClass) {
            this.methods = [];
            this.renderMethodsList();
            return;
        }

        this.methods = await this.client.getMethods(this.selectedClass, this.selectedProtocol, this.side);
        this.renderMethodsList();
    }

    renderMethodsList() {
        const filter = this.dom.searchMethods.value.toLowerCase();
        const list = this.dom.listMethods;
        list.innerHTML = '';

        if (!this.selectedClass) return;

        const visible = this.methods.filter(m => m.toLowerCase().includes(filter));
        for (const meth of visible) {
            const li = document.createElement('li');
            li.className = `pane-item ${meth === this.selectedMethod ? 'selected' : ''}`;
            li.textContent = meth;
            li.addEventListener('click', () => this.selectMethod(meth));
            list.appendChild(li);
        }
    }

    async selectMethod(selector) {
        this.selectedMethod = selector;
        this.viewMode = 'code';
        this.updateSwitchState();
        this.renderMethodsList();
        this.window.setTitle(`Browser: ${this.selectedClass} ${this.side === 'class' ? 'class' : ''}>>${selector}`);

        try {
            const methodData = await this.client.getMethodSource(this.selectedClass, selector, this.side);
            if (methodData && typeof methodData.source === 'string') {
                this.editor.setValue(methodData.source, true);
            } else if (methodData && methodData.error) {
                console.warn('Method source error:', methodData.error);
            }
        } catch (err) {
            console.error('Failed to load method source:', err);
        }
    }

    updateEditorContent() {
        if (this.viewMode === 'comment') {
            const comment = (this.classDetails && this.classDetails.comment) || '';
            this.editor.setValue(comment, true);
            return;
        }

        if (this.selectedMethod) {
            this.selectMethod(this.selectedMethod);
        } else if (this.classDetails) {
            const def = this.classDetails.definition || `${this.classDetails.superclass || 'Object'} subclass: #${this.classDetails.name}\n\tinstanceVariableNames: '${(this.classDetails.instanceVariables || []).join(' ')}'\n\tclassVariableNames: '${(this.classDetails.classVariables || []).join(' ')}'\n\tpoolDictionaries: ''\n\tcategory: '${this.classDetails.category}'`;
            this.editor.setValue(def, true);
        } else if (this.selectedCategory) {
            this.showClassTemplate(this.selectedCategory);
        }
    }

    showClassTemplate(category) {
        const template = `Object subclass: #NameOfSubclass\n\tinstanceVariableNames: ''\n\tclassVariableNames: ''\n\tpoolDictionaries: ''\n\tcategory: '${category}'`;
        this.editor.setValue(template, true);
    }

    showMethodTemplate(protocol = 'as yet unclassified') {
        const template = `messageSelectorAndArgumentNames\n\t"comment stating purpose of message"\n\n\t| temporary variable names |\n\tstatements`;
        this.editor.setValue(template, true);
    }

    async handleAccept(code, onSaved) {
        // Determine whether user is compiling a class definition, class comment, or method
        if (this.viewMode === 'comment') {
            if (this.classDetails) {
                this.classDetails.comment = code;
                if (onSaved) onSaved();
            }
            return;
        }

        if (code.includes('subclass:') && (code.includes('instanceVariableNames:') || code.includes('classVariableNames:'))) {
            // Class definition compile
            const res = await this.client.fileIn(code);
            if (res.success || !res.error) {
                if (onSaved) onSaved();
                await this.refresh();
            } else {
                alert('Compile Error: ' + (res.error || 'Failed to save class'));
            }
            return;
        }

        // Method compile
        if (!this.selectedClass) {
            alert('Please select a class first to compile a method.');
            return;
        }

        const protocol = (this.selectedProtocol && this.selectedProtocol !== '-- all --')
            ? this.selectedProtocol
            : 'as yet unclassified';

        const res = await this.client.compileMethod(this.selectedClass, this.side, protocol, code);
        if (res.success) {
            if (onSaved) onSaved();
            this.selectedMethod = res.selector;
            await this.loadProtocolsAndMethods();
            this.selectMethod(res.selector);
        } else {
            alert('Compile Error: ' + (res.error || 'Syntax or compilation error'));
        }
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

    handleInspectIt(expr) {
        this.handleDoIt(expr);
    }

    async exportCurrentClass() {
        if (!this.selectedClass || !this.classDetails) {
            alert('Please select a class to export.');
            return;
        }

        const chunkText = STChunkParser.exportClassToChunk(this.classDetails);
        const blob = new Blob([chunkText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.selectedClass}.st`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    promptNewCategory() {
        const catName = prompt('Enter new category name:', 'My-Category');
        if (catName && catName.trim()) {
            const clean = catName.trim();
            if (!this.categories.includes(clean)) {
                this.categories.push(clean);
                this.categories.sort();
            }
            this.selectCategory(clean);
        }
    }

    promptNewClass() {
        if (!this.selectedCategory) {
            alert('Please select a category first.');
            return;
        }
        this.selectedClass = null;
        this.selectedMethod = null;
        this.renderClassesList();
        this.showClassTemplate(this.selectedCategory);
    }

    promptNewProtocol() {
        if (!this.selectedClass) {
            alert('Please select a class first.');
            return;
        }
        const protoName = prompt('Enter new protocol / category name:', 'accessing');
        if (protoName && protoName.trim()) {
            const clean = protoName.trim();
            if (!this.protocols.includes(clean)) {
                this.protocols.push(clean);
                this.protocols.sort();
            }
            this.selectProtocol(clean);
        }
    }

    promptNewMethod() {
        if (!this.selectedClass) {
            alert('Please select a class first.');
            return;
        }
        const protocol = (this.selectedProtocol && this.selectedProtocol !== '-- all --') ? this.selectedProtocol : 'as yet unclassified';
        this.selectedMethod = null;
        this.renderMethodsList();
        this.showMethodTemplate(protocol);
    }

    async refresh() {
        await this.loadCategories();
        if (this.selectedCategory) {
            await this.loadClasses();
            if (this.selectedClass) {
                await this.loadClassDetails(this.selectedClass);
                await this.loadProtocolsAndMethods();
                this.updateEditorContent();
            }
        }
    }
}

window.SystemBrowser = SystemBrowser;
