/**
 * Desktop Window Manager
 * Manages draggable, resizable, stackable Smalltalk morphic-style windows.
 */

class WindowManager {
    constructor(desktopElement) {
        this.desktop = desktopElement || document.body;
        this.windows = [];
        this.activeWindow = null;
        this.baseZIndex = 100;
        this.cascadeOffset = { x: 40, y: 40 };
        this.nextCascade = { x: 60, y: 50 };

        this.initTaskbar();
    }

    initTaskbar() {
        this.taskbarItems = document.getElementById('taskbar-items');
    }

    /**
     * Creates and opens a new window
     * @param {Object} options
     * @param {string} options.title - Window title
     * @param {string} [options.icon] - SVG/Emoji icon
     * @param {number} [options.width=750] - Initial width
     * @param {number} [options.height=520] - Initial height
     * @param {number} [options.x] - Initial X
     * @param {number} [options.y] - Initial Y
     * @param {string} [options.className] - Extra CSS class
     * @returns {Object} Window instance
     */
    createWindow(options = {}) {
        const id = 'win-' + Math.random().toString(36).substr(2, 9);
        const title = options.title || 'Smalltalk Window';
        const icon = options.icon || '';
        const width = options.width || 760;
        const height = options.height || 520;

        let x = options.x !== undefined ? options.x : this.nextCascade.x;
        let y = options.y !== undefined ? options.y : this.nextCascade.y;

        // Keep inside desktop bounds
        const maxX = Math.max(50, window.innerWidth - width - 20);
        const maxY = Math.max(50, window.innerHeight - height - 60);
        if (x > maxX) x = 50;
        if (y > maxY) y = 50;

        this.nextCascade.x = (x + 35 > maxX) ? 60 : x + 35;
        this.nextCascade.y = (y + 35 > maxY) ? 50 : y + 35;

        const winEl = document.createElement('div');
        winEl.id = id;
        winEl.className = `st-window ${options.className || ''}`;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;

        winEl.innerHTML = `
            <div class="window-titlebar">
                <div class="window-title-left">
                    <span class="window-icon">${icon}</span>
                    <span class="window-title-text">${title}</span>
                </div>
                <div class="window-controls">
                    <button class="win-btn win-btn-minimize" title="Minimize">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect y="11" width="24" height="2"></rect></svg>
                    </button>
                    <button class="win-btn win-btn-maximize" title="Maximize">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect></svg>
                    </button>
                    <button class="win-btn win-btn-close" title="Close">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
            <div class="window-body"></div>
            <!-- Resize Handles -->
            <div class="resize-handle n"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
            <div class="resize-handle w"></div>
            <div class="resize-handle ne"></div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle sw"></div>
        `;

        this.desktop.appendChild(winEl);

        const winObj = {
            id,
            element: winEl,
            body: winEl.querySelector('.window-body'),
            titleElement: winEl.querySelector('.window-title-text'),
            title,
            isMaximized: false,
            isMinimized: false,
            prevBounds: { x, y, width, height },
            onClose: options.onClose || null,
            setTitle: (newTitle) => {
                winObj.title = newTitle;
                winObj.titleElement.textContent = newTitle;
                if (winObj.taskbarItem) {
                    winObj.taskbarItem.querySelector('.taskbar-text').textContent = newTitle;
                }
            },
            close: () => this.closeWindow(winObj),
            focus: () => this.bringToFront(winObj),
            maximize: () => this.toggleMaximize(winObj),
            minimize: () => this.toggleMinimize(winObj)
        };

        this.setupDragging(winObj);
        this.setupResizing(winObj);
        this.setupControls(winObj);
        this.setupTaskbarItem(winObj, icon);

        this.windows.push(winObj);
        this.bringToFront(winObj);

        return winObj;
    }

    setupControls(winObj) {
        const titlebar = winObj.element.querySelector('.window-titlebar');
        const btnMin = winObj.element.querySelector('.win-btn-minimize');
        const btnMax = winObj.element.querySelector('.win-btn-maximize');
        const btnClose = winObj.element.querySelector('.win-btn-close');

        btnMin.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize(winObj);
        });

        btnMax.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize(winObj);
        });

        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(winObj);
        });

        // Double click titlebar to toggle maximize
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.toggleMaximize(winObj);
        });

        // Click window to focus
        winObj.element.addEventListener('mousedown', () => {
            this.bringToFront(winObj);
        });
    }

    setupDragging(winObj) {
        const titlebar = winObj.element.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.win-btn') || winObj.isMaximized) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const desktopRect = this.desktop.getBoundingClientRect();
            const winRect = winObj.element.getBoundingClientRect();
            startLeft = winRect.left - desktopRect.left;
            startTop = winRect.top - desktopRect.top;

            document.body.style.userSelect = 'none';

            const onMouseMove = (moveEvent) => {
                if (!isDragging) return;
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                const newLeft = startLeft + dx;
                const newTop = Math.max(2, startTop + dy); // Can drag all the way to 0px (top of desktop)
                winObj.element.style.left = `${newLeft}px`;
                winObj.element.style.top = `${newTop}px`;
            };

            const onMouseUp = () => {
                isDragging = false;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    setupResizing(winObj) {
        const handles = winObj.element.querySelectorAll('.resize-handle');

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (winObj.isMaximized) return;
                e.stopPropagation();
                e.preventDefault();

                const direction = Array.from(handle.classList).find(c => ['n','s','e','w','ne','nw','se','sw'].includes(c));
                const startX = e.clientX;
                const startY = e.clientY;

                const desktopRect = this.desktop.getBoundingClientRect();
                const winRect = winObj.element.getBoundingClientRect();
                const startLeft = winRect.left - desktopRect.left;
                const startTop = winRect.top - desktopRect.top;
                const startWidth = winRect.width;
                const startHeight = winRect.height;

                const minWidth = 350;
                const minHeight = 250;

                const onMouseMove = (moveEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;

                    if (direction.includes('e')) {
                        winObj.element.style.width = `${Math.max(minWidth, startWidth + dx)}px`;
                    }
                    if (direction.includes('s')) {
                        winObj.element.style.height = `${Math.max(minHeight, startHeight + dy)}px`;
                    }
                    if (direction.includes('w')) {
                        const newWidth = Math.max(minWidth, startWidth - dx);
                        if (newWidth !== minWidth || startWidth - dx >= minWidth) {
                            winObj.element.style.width = `${newWidth}px`;
                            winObj.element.style.left = `${startLeft + (startWidth - newWidth)}px`;
                        }
                    }
                    if (direction.includes('n')) {
                        const newHeight = Math.max(minHeight, startHeight - dy);
                        if (newHeight !== minHeight || startHeight - dy >= minHeight) {
                            winObj.element.style.height = `${newHeight}px`;
                            winObj.element.style.top = `${Math.max(0, startTop + (startHeight - newHeight))}px`;
                        }
                    }
                };

                const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }

    setupTaskbarItem(winObj, icon) {
        if (!this.taskbarItems) return;
        const item = document.createElement('div');
        item.className = 'taskbar-item active';
        item.innerHTML = `
            <span class="taskbar-icon">${icon}</span>
            <span class="taskbar-text">${winObj.title}</span>
        `;
        item.addEventListener('click', () => {
            if (winObj.isMinimized) {
                this.toggleMinimize(winObj);
                this.bringToFront(winObj);
            } else if (this.activeWindow === winObj) {
                this.toggleMinimize(winObj);
            } else {
                this.bringToFront(winObj);
            }
        });
        this.taskbarItems.appendChild(item);
        winObj.taskbarItem = item;
    }

    bringToFront(winObj) {
        this.baseZIndex += 2;
        winObj.element.style.zIndex = this.baseZIndex;

        this.windows.forEach(w => {
            w.element.classList.remove('active');
            if (w.taskbarItem) w.taskbarItem.classList.remove('active');
        });

        winObj.element.classList.add('active');
        if (winObj.taskbarItem) winObj.taskbarItem.classList.add('active');
        this.activeWindow = winObj;
    }

    toggleMaximize(winObj) {
        if (!winObj.isMaximized) {
            winObj.prevBounds = {
                x: winObj.element.offsetLeft,
                y: winObj.element.offsetTop,
                width: winObj.element.offsetWidth,
                height: winObj.element.offsetHeight
            };
            winObj.element.classList.add('maximized');
            winObj.element.style.left = '0px';
            winObj.element.style.top = '0px';
            winObj.element.style.width = '100vw';
            winObj.element.style.height = 'calc(100vh - 72px)';
            winObj.isMaximized = true;
        } else {
            winObj.element.classList.remove('maximized');
            winObj.element.style.left = `${winObj.prevBounds.x}px`;
            winObj.element.style.top = `${winObj.prevBounds.y}px`;
            winObj.element.style.width = `${winObj.prevBounds.width}px`;
            winObj.element.style.height = `${winObj.prevBounds.height}px`;
            winObj.isMaximized = false;
        }
        this.bringToFront(winObj);
    }

    toggleMinimize(winObj) {
        if (!winObj.isMinimized) {
            winObj.element.style.display = 'none';
            winObj.isMinimized = true;
            if (winObj.taskbarItem) winObj.taskbarItem.classList.remove('active');
            // Switch focus to next window
            const visible = this.windows.filter(w => !w.isMinimized && w !== winObj);
            if (visible.length > 0) {
                this.bringToFront(visible[visible.length - 1]);
            }
        } else {
            winObj.element.style.display = 'flex';
            winObj.isMinimized = false;
            this.bringToFront(winObj);
        }
    }

    closeWindow(winObj) {
        if (winObj.onClose) {
            const allow = winObj.onClose();
            if (allow === false) return;
        }
        if (winObj.taskbarItem && winObj.taskbarItem.parentElement) {
            winObj.taskbarItem.parentElement.removeChild(winObj.taskbarItem);
        }
        if (winObj.element && winObj.element.parentElement) {
            winObj.element.parentElement.removeChild(winObj.element);
        }
        this.windows = this.windows.filter(w => w !== winObj);
        if (this.activeWindow === winObj) {
            const visible = this.windows.filter(w => !w.isMinimized);
            if (visible.length > 0) {
                this.bringToFront(visible[visible.length - 1]);
            } else {
                this.activeWindow = null;
            }
        }
    }
}

window.WindowManager = WindowManager;
