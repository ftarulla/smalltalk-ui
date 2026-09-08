/**
 * Smalltalk Chunk Format (.st) Parser and Serializer
 * Handles standard Smalltalk chunk format fileouts (Cuis, Squeak, Pharo, GNU Smalltalk).
 */

class STChunkParser {
    /**
     * Parse raw .st file contents into Smalltalk environment model
     * @param {string} sourceText
     * @returns {Object} { categories: [], classes: {}, doIts: [] }
     */
    static parse(sourceText) {
        const rawChunks = this.splitIntoChunks(sourceText);
        const result = {
            categories: new Set(),
            classes: {}, // className -> classData
            doIts: []
        };

        let i = 0;
        while (i < rawChunks.length) {
            const chunk = rawChunks[i].trim();
            if (!chunk) {
                i++;
                continue;
            }

            // Check for class definition chunk
            // e.g., Object subclass: #MyClass instanceVariableNames: 'a b' ...
            if (chunk.includes('subclass:') && (chunk.includes('instanceVariableNames:') || chunk.includes('classVariableNames:'))) {
                this.parseClassDefinition(chunk, result);
                i++;
                continue;
            }

            // Check for class comment chunk: ClassName commentStamp: ...
            const commentMatch = chunk.match(/^!?([A-Za-z0-9_]+)\s+commentStamp:\s*(?:'([^']*)'|nil)/i);
            if (commentMatch) {
                const className = commentMatch[1];
                i++;
                if (i < rawChunks.length) {
                    const commentText = rawChunks[i].trim();
                    this.ensureClass(result, className);
                    result.classes[className].comment = commentText;
                }
                i++;
                continue;
            }

            // Check for methods header: ClassName [class] methodsFor: 'protocol' [stamp: '...']
            const methodsMatch = chunk.match(/^!?([A-Za-z0-9_]+)(\s+class)?\s+methodsFor:\s*'([^']*)'(?:\s+stamp:\s*'([^']*)')?/i);
            if (methodsMatch) {
                const className = methodsMatch[1];
                const isClassSide = !!methodsMatch[2];
                const protocol = methodsMatch[3] || 'as yet unclassified';
                const stamp = methodsMatch[4] || '';

                this.ensureClass(result, className);
                const classData = result.classes[className];
                const targetMethods = isClassSide ? classData.classMethods : classData.instanceMethods;

                i++;
                // Read subsequent method chunks until an empty terminator chunk
                while (i < rawChunks.length) {
                    const methodChunk = rawChunks[i].trim();
                    if (!methodChunk) {
                        // Empty chunk ends the methodsFor: block
                        i++;
                        break;
                    }
                    if (methodChunk.startsWith('!') || methodChunk.includes('methodsFor:') || methodChunk.includes('subclass:') || methodChunk.includes('commentStamp:')) {
                        // Another header started
                        break;
                    }

                    const selector = this.extractSelector(methodChunk);
                    targetMethods[selector] = {
                        selector: selector,
                        protocol: protocol,
                        stamp: stamp,
                        source: methodChunk,
                        side: isClassSide ? 'class' : 'instance'
                    };
                    i++;
                }
                continue;
            }

            // Check for class initialization or general DoIt
            if (!chunk.startsWith('!')) {
                result.doIts.push(chunk);
            }

            i++;
        }

        return {
            categories: Array.from(result.categories).sort(),
            classes: result.classes,
            doIts: result.doIts
        };
    }

    /**
     * Splits chunked source string into an array of chunks.
     * In Smalltalk chunk format, '!' is the delimiter, and '!!' denotes an escaped bang.
     */
    static splitIntoChunks(text) {
        const chunks = [];
        let current = '';
        let i = 0;
        const len = text.length;

        while (i < len) {
            const ch = text[i];
            if (ch === '!') {
                if (i + 1 < len && text[i + 1] === '!') {
                    // Escaped bang '!!' -> single '!'
                    current += '!';
                    i += 2;
                } else {
                    // Chunk delimiter
                    chunks.push(current);
                    current = '';
                    i++;
                }
            } else {
                current += ch;
                i++;
            }
        }

        if (current.trim()) {
            chunks.push(current);
        }

        return chunks;
    }

    /**
     * Parses standard Smalltalk class definition message send
     */
    static parseClassDefinition(chunk, result) {
        // e.g.: Object subclass: #Counter instanceVariableNames: 'count step' classVariableNames: '' poolDictionaries: '' category: 'SmalltalkUI-Samples'
        const superclassMatch = chunk.match(/^([A-Za-z0-9_]+)\s+subclass:\s*#([A-Za-z0-9_]+)/);
        if (!superclassMatch) return;

        const superclassName = superclassMatch[1];
        const className = superclassMatch[2];

        const instVarsMatch = chunk.match(/instanceVariableNames:\s*'([^']*)'/);
        const instVars = instVarsMatch ? instVarsMatch[1].trim().split(/\s+/).filter(Boolean) : [];

        const classVarsMatch = chunk.match(/classVariableNames:\s*'([^']*)'/);
        const classVars = classVarsMatch ? classVarsMatch[1].trim().split(/\s+/).filter(Boolean) : [];

        const catMatch = chunk.match(/category:\s*(?:#'([^']*)'|'([^']*)')/);
        const category = catMatch ? (catMatch[1] || catMatch[2]) : 'Unclassified';

        result.categories.add(category);
        this.ensureClass(result, className);

        const classData = result.classes[className];
        classData.name = className;
        classData.superclass = superclassName;
        classData.category = category;
        classData.instanceVariables = instVars;
        classData.classVariables = classVars;
        classData.definition = chunk;
    }

    /**
     * Ensures class entry exists in result
     */
    static ensureClass(result, className) {
        if (!result.classes[className]) {
            result.classes[className] = {
                name: className,
                superclass: 'Object',
                category: 'Unclassified',
                definition: `${className} subclass: #${className}\n\tinstanceVariableNames: ''\n\tclassVariableNames: ''\n\tpoolDictionaries: ''\n\tcategory: 'Unclassified'`,
                comment: '',
                instanceVariables: [],
                classVariables: [],
                instanceMethods: {}, // selector -> { selector, protocol, stamp, source, side }
                classMethods: {}
            };
        }
    }

    /**
     * Extract selector from method source code header
     */
    static extractSelector(source) {
        if (!source) return 'unknown';
        // Strip leading whitespace and comments
        let text = source.trim();

        // 1. Binary selector (e.g. + aNumber, <= aMagnitude, // aNumber, @ aPoint)
        const binaryMatch = text.match(/^([+\-*/\\~<>=@,%|&?!]+)\s+([A-Za-z0-9_]+)/);
        if (binaryMatch) {
            return binaryMatch[1];
        }

        // 2. Keyword selector (e.g. startingAt: anInitialValue withStep: aStepValue)
        // In Smalltalk, the method header starts with keyword: arg keyword: arg ...
        // We match alternating keyword: and argument identifier at the start of the method
        const keywordHeaderMatch = text.match(/^((?:[A-Za-z0-9_]+:\s*(?:\([^\)]+\)|[A-Za-z0-9_]+)\s*)+)/);
        if (keywordHeaderMatch) {
            const headerStr = keywordHeaderMatch[1];
            const keywords = Array.from(headerStr.matchAll(/([A-Za-z0-9_]+:)/g)).map(m => m[1]);
            if (keywords.length > 0) {
                return keywords.join('');
            }
        }

        // 3. Unary selector (e.g. initialize, count, reset)
        const unaryMatch = text.match(/^([A-Za-z0-9_]+)(\s|$)/);
        if (unaryMatch) {
            return unaryMatch[1];
        }

        return 'unknownSelector';
    }

    /**
     * Generate .st Chunk formatted text from a class object
     */
    static exportClassToChunk(classData) {
        let out = '';
        // Class Definition
        out += `!classDefinition: #${classData.name} category: #'${classData.category}'!\n`;
        out += `${classData.definition || `${classData.superclass} subclass: #${classData.name}\n\tinstanceVariableNames: '${(classData.instanceVariables || []).join(' ')}'\n\tclassVariableNames: '${(classData.classVariables || []).join(' ')}'\n\tpoolDictionaries: ''\n\tcategory: '${classData.category}'`}`;
        out += '!\n\n';

        // Comment
        if (classData.comment) {
            out += `!${classData.name} commentStamp: '<historical>' prior: 0!\n`;
            out += `${classData.comment.replace(/!/g, '!!')}!\n\n`;
        }

        // Group Class Methods by Protocol
        const classMethodsByProtocol = {};
        for (const m of Object.values(classData.classMethods || {})) {
            const p = m.protocol || 'as yet unclassified';
            if (!classMethodsByProtocol[p]) classMethodsByProtocol[p] = [];
            classMethodsByProtocol[p].push(m);
        }

        for (const [protocol, methods] of Object.entries(classMethodsByProtocol)) {
            out += `!${classData.name} class methodsFor: '${protocol}' stamp: 'cuis'!\n`;
            for (const m of methods) {
                out += `${m.source.replace(/!/g, '!!')}!\n\n`;
            }
            out += '! !\n\n';
        }

        // Group Instance Methods by Protocol
        const instMethodsByProtocol = {};
        for (const m of Object.values(classData.instanceMethods || {})) {
            const p = m.protocol || 'as yet unclassified';
            if (!instMethodsByProtocol[p]) instMethodsByProtocol[p] = [];
            instMethodsByProtocol[p].push(m);
        }

        for (const [protocol, methods] of Object.entries(instMethodsByProtocol)) {
            out += `!${classData.name} methodsFor: '${protocol}' stamp: 'cuis'!\n`;
            for (const m of methods) {
                out += `${m.source.replace(/!/g, '!!')}!\n\n`;
            }
            out += '! !\n\n';
        }

        return out;
    }
}

window.STChunkParser = STChunkParser;
