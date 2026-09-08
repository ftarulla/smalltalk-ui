/**
 * In-Memory Smalltalk Environment (Mock & Offline Fallback for Cuis Smalltalk)
 * Pre-populated with core Cuis Smalltalk classes so SmalltalkUI is immediately usable out-of-the-box.
 */

class SmalltalkMockEnvironment {
    constructor() {
        this.categories = new Set();
        this.classes = {};
        this.initCoreClasses();
    }

    initCoreClasses() {
        // Sample Counter class
        this.addClass({
            name: 'Counter',
            superclass: 'Object',
            category: 'SmalltalkUI-Samples',
            instanceVariables: ['count', 'step'],
            classVariables: ['DefaultStep'],
            comment: 'A simple Counter demonstration class for SmalltalkUI.\nSupports incrementing, decrementing, and customizable step values.',
            instanceMethods: {
                'initialize': {
                    selector: 'initialize',
                    protocol: 'initialization',
                    stamp: 'cuis 8/26/2026',
                    source: 'initialize\n\tsuper initialize.\n\tcount := 0.\n\tstep := 1.'
                },
                'initializeWith:': {
                    selector: 'initializeWith:',
                    protocol: 'initialization',
                    stamp: 'cuis 8/26/2026',
                    source: 'initializeWith: anInitialValue\n\tself initialize.\n\tcount := anInitialValue.'
                },
                'count': {
                    selector: 'count',
                    protocol: 'accessing',
                    stamp: 'cuis 8/26/2026',
                    source: 'count\n\t"Return current counter value"\n\t^ count'
                },
                'count:': {
                    selector: 'count:',
                    protocol: 'accessing',
                    stamp: 'cuis 8/26/2026',
                    source: 'count: aNumber\n\tcount := aNumber.'
                },
                'step': {
                    selector: 'step',
                    protocol: 'accessing',
                    stamp: 'cuis 8/26/2026',
                    source: 'step\n\t^ step'
                },
                'step:': {
                    selector: 'step:',
                    protocol: 'accessing',
                    stamp: 'cuis 8/26/2026',
                    source: 'step: aNumber\n\tstep := aNumber.'
                },
                'increment': {
                    selector: 'increment',
                    protocol: 'operations',
                    stamp: 'cuis 8/26/2026',
                    source: 'increment\n\t"Increment count by step"\n\tcount := count + step.\n\t^ count'
                },
                'decrement': {
                    selector: 'decrement',
                    protocol: 'operations',
                    stamp: 'cuis 8/26/2026',
                    source: 'decrement\n\t"Decrement count by step"\n\tcount := count - step.\n\t^ count'
                },
                'reset': {
                    selector: 'reset',
                    protocol: 'operations',
                    stamp: 'cuis 8/26/2026',
                    source: 'reset\n\tcount := 0.'
                },
                'printOn:': {
                    selector: 'printOn:',
                    protocol: 'printing',
                    stamp: 'cuis 8/26/2026',
                    source: 'printOn: aStream\n\tsuper printOn: aStream.\n\taStream nextPutAll: \' (count: \'; print: count; nextPutAll: \', step: \'; print: step; nextPut: $).'
                }
            },
            classMethods: {
                'startingAt:': {
                    selector: 'startingAt:',
                    protocol: 'instance creation',
                    stamp: 'cuis 8/26/2026',
                    source: 'startingAt: anInitialValue\n\t^ self new initializeWith: anInitialValue'
                },
                'withStep:': {
                    selector: 'withStep:',
                    protocol: 'instance creation',
                    stamp: 'cuis 8/26/2026',
                    source: 'withStep: aStepValue\n\t^ self new step: aStepValue; yourself'
                }
            }
        });

        // Object
        this.addClass({
            name: 'Object',
            superclass: 'ProtoObject',
            category: 'Kernel-Objects',
            instanceVariables: [],
            classVariables: ['DependentsFields'],
            comment: 'Object is the root class for almost all of the other classes in the class hierarchy.',
            instanceMethods: {
                '=': { selector: '=', protocol: 'comparing', stamp: 'cuis', source: '= anObject\n\t"Answer whether the receiver and anObject represent the same component."\n\t^ self == anObject' },
                '~=': { selector: '~=', protocol: 'comparing', stamp: 'cuis', source: '~= anObject\n\t"Answer whether the receiver and the argument are not equal."\n\t^ (self = anObject) not' },
                'initialize': { selector: 'initialize', protocol: 'initialization', stamp: 'cuis', source: 'initialize\n\t"Subclasses should redefine this method to perform initializations on instance creation."\n\t^ self' },
                'printString': { selector: 'printString', protocol: 'printing', stamp: 'cuis', source: 'printString\n\t"Answer a String whose characters are a description of the receiver."\n\t^ String streamContents: [ :str | self printOn: str ]' },
                'printOn:': { selector: 'printOn:', protocol: 'printing', stamp: 'cuis', source: 'printOn: aStream\n\t| title |\n\ttitle := self class name.\n\taStream\n\t\tnextPutAll: (title first isVowel ifTrue: [ \'an \' ] ifFalse: [ \'a \' ]);\n\t\tnextPutAll: title' },
                'yourself': { selector: 'yourself', protocol: 'accessing', stamp: 'cuis', source: 'yourself\n\t"Answer the receiver."\n\t^ self' },
                'isNil': { selector: 'isNil', protocol: 'testing', stamp: 'cuis', source: 'isNil\n\t^ false' },
                'notNil': { selector: 'notNil', protocol: 'testing', stamp: 'cuis', source: 'notNil\n\t^ true' }
            },
            classMethods: {
                'new': { selector: 'new', protocol: 'instance creation', stamp: 'cuis', source: 'new\n\t"Answer a new instance of the receiver."\n\t^ self basicNew initialize' }
            }
        });

        // Magnitude
        this.addClass({
            name: 'Magnitude',
            superclass: 'Object',
            category: 'Kernel-Numbers',
            instanceVariables: [],
            classVariables: [],
            comment: 'Magnitude represents objects that can be compared along a linear scale.',
            instanceMethods: {
                '<': { selector: '<', protocol: 'comparing', stamp: 'cuis', source: '< aMagnitude\n\t"Answer whether receiver is less than argument."\n\tself subclassResponsibility' },
                '<=': { selector: '<=', protocol: 'comparing', stamp: 'cuis', source: '<= aMagnitude\n\t^ (self > aMagnitude) not' },
                '>': { selector: '>', protocol: 'comparing', stamp: 'cuis', source: '> aMagnitude\n\t^ aMagnitude < self' },
                '>=': { selector: '>=', protocol: 'comparing', stamp: 'cuis', source: '>= aMagnitude\n\t^ (self < aMagnitude) not' },
                'between:and:': { selector: 'between:and:', protocol: 'comparing', stamp: 'cuis', source: 'between: min and: max\n\t^ self >= min and: [ self <= max ]' },
                'min:': { selector: 'min:', protocol: 'comparing', stamp: 'cuis', source: 'min: aMagnitude\n\t^ self < aMagnitude ifTrue: [ self ] ifFalse: [ aMagnitude ]' },
                'max:': { selector: 'max:', protocol: 'comparing', stamp: 'cuis', source: 'max: aMagnitude\n\t^ self > aMagnitude ifTrue: [ self ] ifFalse: [ aMagnitude ]' }
            }
        });

        // Number
        this.addClass({
            name: 'Number',
            superclass: 'Magnitude',
            category: 'Kernel-Numbers',
            instanceVariables: [],
            classVariables: [],
            comment: 'Class Number provides arithmetic and mathematical capabilities.',
            instanceMethods: {
                '+': { selector: '+', protocol: 'arithmetic', stamp: 'cuis', source: '+ aNumber\n\tself subclassResponsibility' },
                '-': { selector: '-', protocol: 'arithmetic', stamp: 'cuis', source: '- aNumber\n\tself subclassResponsibility' },
                '*': { selector: '*', protocol: 'arithmetic', stamp: 'cuis', source: '* aNumber\n\tself subclassResponsibility' },
                '/': { selector: '/', protocol: 'arithmetic', stamp: 'cuis', source: '/ aNumber\n\tself subclassResponsibility' },
                'abs': { selector: 'abs', protocol: 'arithmetic', stamp: 'cuis', source: 'abs\n\t^ self < 0 ifTrue: [ 0 - self ] ifFalse: [ self ]' },
                'negated': { selector: 'negated', protocol: 'arithmetic', stamp: 'cuis', source: 'negated\n\t^ 0 - self' },
                'squared': { selector: 'squared', protocol: 'mathematical functions', stamp: 'cuis', source: 'squared\n\t^ self * self' },
                'sqrt': { selector: 'sqrt', protocol: 'mathematical functions', stamp: 'cuis', source: 'sqrt\n\t^ self asFloat sqrt' },
                'to:do:': { selector: 'to:do:', protocol: 'intervals', stamp: 'cuis', source: 'to: stop do: aBlock\n\t| nextValue |\n\tnextValue := self.\n\t[ nextValue <= stop ] whileTrue: [\n\t\taBlock value: nextValue.\n\t\tnextValue := nextValue + 1\n\t]' }
            }
        });

        // Point
        this.addClass({
            name: 'Point',
            superclass: 'Object',
            category: 'Graphics-Geometry',
            instanceVariables: ['x', 'y'],
            classVariables: [],
            comment: 'A 2D Cartesian point representation with x and y coordinates.',
            instanceMethods: {
                'x': { selector: 'x', protocol: 'accessing', stamp: 'cuis', source: 'x\n\t^ x' },
                'y': { selector: 'y', protocol: 'accessing', stamp: 'cuis', source: 'y\n\t^ y' },
                'setX:setY:': { selector: 'setX:setY:', protocol: 'private', stamp: 'cuis', source: 'setX: xValue setY: yValue\n\tx := xValue.\n\ty := yValue.\n\t^ self' },
                '+': { selector: '+', protocol: 'point functions', stamp: 'cuis', source: '+ arg\n\targ isPoint ifTrue: [ ^ (x + arg x) @ (y + arg y) ].\n\t^ (x + arg) @ (y + arg)' },
                '-': { selector: '-', protocol: 'point functions', stamp: 'cuis', source: '- arg\n\targ isPoint ifTrue: [ ^ (x - arg x) @ (y - arg y) ].\n\t^ (x - arg) @ (y - arg)' },
                'corner:': { selector: 'corner:', protocol: 'converting', stamp: 'cuis', source: 'corner: aPoint\n\t^ Rectangle origin: self corner: aPoint' }
            },
            classMethods: {
                'x:y:': { selector: 'x:y:', protocol: 'instance creation', stamp: 'cuis', source: 'x: xValue y: yValue\n\t^ self basicNew setX: xValue setY: yValue' }
            }
        });

        // Collection
        this.addClass({
            name: 'Collection',
            superclass: 'Object',
            category: 'Collections-Abstract',
            instanceVariables: [],
            classVariables: [],
            comment: 'Abstract superclass for all collection classes.',
            instanceMethods: {
                'do:': { selector: 'do:', protocol: 'enumerating', stamp: 'cuis', source: 'do: aBlock\n\tself subclassResponsibility' },
                'collect:': { selector: 'collect:', protocol: 'enumerating', stamp: 'cuis', source: 'collect: aBlock\n\t| newCollection |\n\tnewCollection := self species new: self size.\n\tself do: [ :each | newCollection add: (aBlock value: each) ].\n\t^ newCollection' },
                'select:': { selector: 'select:', protocol: 'enumerating', stamp: 'cuis', source: 'select: aBlock\n\t| newCollection |\n\tnewCollection := self species new.\n\tself do: [ :each | (aBlock value: each) ifTrue: [ newCollection add: each ] ].\n\t^ newCollection' },
                'reject:': { selector: 'reject:', protocol: 'enumerating', stamp: 'cuis', source: 'reject: aBlock\n\t^ self select: [ :each | (aBlock value: each) not ]' },
                'detect:ifNone:': { selector: 'detect:ifNone:', protocol: 'enumerating', stamp: 'cuis', source: 'detect: aBlock ifNone: exceptionBlock\n\tself do: [ :each | (aBlock value: each) ifTrue: [ ^ each ] ].\n\t^ exceptionBlock value' },
                'isEmpty': { selector: 'isEmpty', protocol: 'testing', stamp: 'cuis', source: 'isEmpty\n\t^ self size = 0' },
                'notEmpty': { selector: 'notEmpty', protocol: 'testing', stamp: 'cuis', source: 'notEmpty\n\t^ self isEmpty not' }
            }
        });

        // Boolean, True, False
        this.addClass({
            name: 'Boolean',
            superclass: 'Object',
            category: 'Kernel-Objects',
            instanceVariables: [],
            classVariables: [],
            comment: 'Boolean is an abstract class for True and False.',
            instanceMethods: {
                '&': { selector: '&', protocol: 'logical operations', stamp: 'cuis', source: '& aBoolean\n\tself subclassResponsibility' },
                '|': { selector: '|', protocol: 'logical operations', stamp: 'cuis', source: '| aBoolean\n\tself subclassResponsibility' },
                'not': { selector: 'not', protocol: 'logical operations', stamp: 'cuis', source: 'not\n\tself subclassResponsibility' },
                'ifTrue:ifFalse:': { selector: 'ifTrue:ifFalse:', protocol: 'controlling', stamp: 'cuis', source: 'ifTrue: trueBlock ifFalse: falseBlock\n\tself subclassResponsibility' }
            }
        });

        // Morph
        this.addClass({
            name: 'Morph',
            superclass: 'Object',
            category: 'Morphic-Kernel',
            instanceVariables: ['location', 'extent', 'color', 'owner', 'submorphs'],
            classVariables: [],
            comment: 'Morphic base visual element in Cuis-Smalltalk.',
            instanceMethods: {
                'drawOn:': { selector: 'drawOn:', protocol: 'drawing', stamp: 'cuis', source: 'drawOn: aCanvas\n\taCanvas fillRectangle: self bounds color: color' },
                'color:': { selector: 'color:', protocol: 'accessing', stamp: 'cuis', source: 'color: aColor\n\tcolor := aColor.\n\tself redrawNeeded.' },
                'position:': { selector: 'position:', protocol: 'geometry', stamp: 'cuis', source: 'position: aPoint\n\tlocation := aPoint.\n\tself redrawNeeded.' },
                'openInWorld': { selector: 'openInWorld', protocol: 'morphic', stamp: 'cuis', source: 'openInWorld\n\tActiveWorld addMorph: self.\n\t^ self' }
            }
        });
    }

    addClass(cls) {
        if (!cls.definition) {
            cls.definition = `${cls.superclass || 'Object'} subclass: #${cls.name}\n\tinstanceVariableNames: '${(cls.instanceVariables || []).join(' ')}'\n\tclassVariableNames: '${(cls.classVariables || []).join(' ')}'\n\tpoolDictionaries: ''\n\tcategory: '${cls.category}'`;
        }
        cls.instanceMethods = cls.instanceMethods || {};
        cls.classMethods = cls.classMethods || {};
        this.categories.add(cls.category);
        this.classes[cls.name] = cls;
    }

    getCategories() {
        return Array.from(this.categories).sort();
    }

    getClasses(category) {
        let list = Object.values(this.classes);
        if (category) {
            list = list.filter(c => c.category === category);
        }
        return list.sort((a, b) => a.name.localeCompare(b.name)).map(c => ({
            name: c.name,
            superclass: c.superclass,
            category: c.category,
            hasSubclasses: Object.values(this.classes).some(sub => sub.superclass === c.name)
        }));
    }

    getClass(className) {
        return this.classes[className] || null;
    }

    getProtocols(className, side = 'instance') {
        const cls = this.classes[className];
        if (!cls) return [];
        const methods = side === 'class' ? cls.classMethods : cls.instanceMethods;
        const set = new Set(Object.values(methods).map(m => m.protocol || 'as yet unclassified'));
        return Array.from(set).sort();
    }

    getMethods(className, protocol, side = 'instance') {
        const cls = this.classes[className];
        if (!cls) return [];
        const methods = side === 'class' ? cls.classMethods : cls.instanceMethods;
        let list = Object.values(methods);
        if (protocol && protocol !== '-- all --' && protocol !== 'all') {
            list = list.filter(m => m.protocol === protocol);
        }
        return list.map(m => m.selector).sort();
    }

    getMethod(className, selector, side = 'instance') {
        const cls = this.classes[className];
        if (!cls) return null;
        const methods = side === 'class' ? cls.classMethods : cls.instanceMethods;
        return methods[selector] || null;
    }

    compileMethod(className, side, protocol, source) {
        let cls = this.classes[className];
        if (!cls) {
            throw new Error(`Class ${className} not found`);
        }
        const selector = STChunkParser.extractSelector(source);
        const target = side === 'class' ? cls.classMethods : cls.instanceMethods;
        target[selector] = {
            selector: selector,
            protocol: protocol || 'as yet unclassified',
            stamp: 'cuis ' + new Date().toLocaleDateString(),
            source: source,
            side: side
        };
        return selector;
    }

    fileInChunks(sourceText) {
        const parsed = STChunkParser.parse(sourceText);
        for (const cat of parsed.categories) {
            this.categories.add(cat);
        }
        for (const [name, data] of Object.entries(parsed.classes)) {
            if (this.classes[name]) {
                // Merge
                Object.assign(this.classes[name].instanceMethods, data.instanceMethods);
                Object.assign(this.classes[name].classMethods, data.classMethods);
                if (data.comment) this.classes[name].comment = data.comment;
                if (data.definition) this.classes[name].definition = data.definition;
            } else {
                this.addClass(data);
            }
        }
        return { success: true, classCount: Object.keys(parsed.classes).length };
    }

    evaluateExpression(expr) {
        const trimmed = expr.trim();
        // Safe mock evaluations for common Smalltalk expressions
        try {
            if (/^\d+\s*[\+\-\*\/]\s*\d+$/.test(trimmed)) {
                return String(Function(`return ${trimmed}`)());
            }
            if (trimmed === 'Transcript show: \'Hello Smalltalk!\'; cr.') {
                return 'Transcript';
            }
            if (trimmed.startsWith('Counter new') || trimmed.includes('startingAt:')) {
                return 'a Counter (count: 0, step: 1)';
            }
            if (trimmed === 'Smalltalk allClasses size') {
                return String(Object.keys(this.classes).length);
            }
            if (trimmed === 'Point x: 10 y: 20') {
                return '10@20';
            }
            if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                return trimmed;
            }
            return `"${trimmed}" -> evaluated in SmalltalkUI Mock Environment`;
        } catch (e) {
            return `Error: ${e.message}`;
        }
    }
}

window.SmalltalkMockEnvironment = SmalltalkMockEnvironment;
