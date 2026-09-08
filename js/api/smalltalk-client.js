/**
 * Smalltalk API Client Bridge
 * Communicates with Cuis Smalltalk HTTP/REST Server (http://localhost:8080)
 * with automatic fallback to client-side Mock Environment when disconnected.
 */

class SmalltalkClient {
    constructor(serverUrl = 'http://localhost:8080') {
        this.serverUrl = serverUrl;
        this.mockEnv = new SmalltalkMockEnvironment();
        this.isConnected = false;
        this.isMockMode = false;
        this.listeners = new Set();
        this.pollInterval = null;

        this.startHeartbeat();
    }

    startHeartbeat() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => {
            if (!this.isConnected && !this.isMockMode) {
                this.checkConnection();
            }
        }, 2500);
    }

    /**
     * Subscribe to connection status changes
     * @param {Function} callback (isConnected, isMockMode, serverInfo)
     */
    onStatusChange(callback) {
        this.listeners.add(callback);
        // Call immediately with current state
        callback(this.isConnected, this.isMockMode, this.serverInfo);
    }

    notifyStatus(serverInfo = null) {
        const wasConnected = this.isConnected;
        this.serverInfo = serverInfo;
        for (const cb of this.listeners) {
            cb(this.isConnected, this.isMockMode, this.serverInfo);
        }

        // If newly connected, refresh any active browsers
        if (!wasConnected && this.isConnected && window.smalltalkApp && window.smalltalkApp.browsers) {
            window.smalltalkApp.browsers.forEach(b => b.refresh());
        }
    }

    /**
     * Check connection to Cuis server
     */
    async checkConnection() {
        if (this.isMockMode) {
            this.isConnected = false;
            this.notifyStatus({ name: 'Standalone Mock Mode' });
            return false;
        }

        const urlsToTry = [this.serverUrl];
        if (this.serverUrl.includes('localhost')) {
            urlsToTry.push(this.serverUrl.replace('localhost', '127.0.0.1'));
        }

        for (const url of urlsToTry) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1500);

                const res = await fetch(`${url}/api/status`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    this.serverUrl = url; // adopt working URL
                    const isFirstConnect = !this.isConnected;
                    this.isConnected = true;
                    this.notifyStatus(data);
                    if (isFirstConnect && window.smalltalkApp && window.smalltalkApp.transcript) {
                        window.smalltalkApp.transcript.show(`[Connected] Cuis University Server active @ ${url}\n`);
                    }
                    return true;
                }
            } catch (e) {
                // Connection failed for this candidate URL
            }
        }

        this.isConnected = false;
        this.notifyStatus(null);
        return false;
    }

    setServerUrl(url) {
        this.serverUrl = url;
        return this.checkConnection();
    }

    setMockMode(enable) {
        this.isMockMode = enable;
        return this.checkConnection();
    }

    async getCategories() {
        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/categories`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API fetch failed, falling back to mock env', e);
            }
        }
        return this.mockEnv.getCategories();
    }

    async getClasses(category) {
        if (this.isConnected) {
            try {
                const url = category
                    ? `${this.serverUrl}/api/classes?category=${encodeURIComponent(category)}`
                    : `${this.serverUrl}/api/classes`;
                const res = await fetch(url);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API fetch failed, falling back to mock env', e);
            }
        }
        return this.mockEnv.getClasses(category);
    }

    async getClassDetails(className) {
        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/class/${encodeURIComponent(className)}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API fetch failed, falling back to mock env', e);
            }
        }
        return this.mockEnv.getClass(className);
    }

    async getProtocols(className, side = 'instance') {
        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/class/${encodeURIComponent(className)}/protocols?side=${side}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API fetch failed, falling back to mock env', e);
            }
        }
        return this.mockEnv.getProtocols(className, side);
    }

    async getMethods(className, protocol, side = 'instance') {
        if (this.isConnected) {
            try {
                const p = protocol ? `&protocol=${encodeURIComponent(protocol)}` : '';
                const res = await fetch(`${this.serverUrl}/api/class/${encodeURIComponent(className)}/methods?side=${side}${p}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API fetch failed, falling back to mock env', e);
            }
        }
        return this.mockEnv.getMethods(className, protocol, side);
    }

    async getMethodSource(className, selector, side = 'instance') {
        if (this.isConnected) {
            try {
                const url = `${this.serverUrl}/api/method?class=${encodeURIComponent(className)}&selector=${encodeURIComponent(selector)}&side=${side}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data.source === 'string') {
                        return data;
                    }
                }
            } catch (e) {
                console.warn('API getMethodSource fetch failed, falling back to mock env', e);
            }
        }
        const method = this.mockEnv.getMethod(className, selector, side);
        if (!method) return null;
        return {
            className,
            selector,
            side,
            protocol: method.protocol,
            stamp: method.stamp,
            source: method.source
        };
    }

    async compileMethod(className, side, protocol, source) {
        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/compile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        class: className,
                        side: side,
                        protocol: protocol,
                        source: source
                    })
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API compile failed, falling back to mock env', e);
            }
        }
        try {
            const sel = this.mockEnv.compileMethod(className, side, protocol, source);
            return { success: true, selector: sel };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    async fileIn(sourceText) {
        // Always update mock environment so offline preview is synced
        const mockResult = this.mockEnv.fileInChunks(sourceText);

        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/filein`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: sourceText })
                });
                if (res.ok) {
                    const data = await res.json();
                    return { ...data, live: true };
                }
            } catch (e) {
                console.warn('API filein failed', e);
            }
        }
        return { ...mockResult, live: false };
    }

    async evaluate(expression) {
        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/eval`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ expression: expression })
                });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API eval failed, falling back to mock env', e);
            }
        }
        const result = this.mockEnv.evaluateExpression(expression);
        return { success: true, result: result };
    }

    async search(query) {
        if (this.isConnected) {
            try {
                const res = await fetch(`${this.serverUrl}/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('API search failed', e);
            }
        }
        const q = query.toLowerCase();
        const classes = Object.keys(this.mockEnv.classes).filter(c => c.toLowerCase().includes(q));
        const methods = [];
        for (const [cName, cData] of Object.entries(this.mockEnv.classes)) {
            for (const sel of Object.keys(cData.instanceMethods)) {
                if (sel.toLowerCase().includes(q)) methods.push(`${cName}>>#${sel}`);
            }
            for (const sel of Object.keys(cData.classMethods)) {
                if (sel.toLowerCase().includes(q)) methods.push(`${cName} class>>#${sel}`);
            }
        }
        return { classes, methods };
    }
}

window.SmalltalkClient = SmalltalkClient;
