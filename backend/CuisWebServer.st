'From CuisUniversity of Smalltalk [latest] on 08 August 2026 at 08:48:00 am'!
!classDefinition: #SmalltalkUIWebServer category: #'SmalltalkUI-Server'!
Object subclass: #SmalltalkUIWebServer
	instanceVariableNames: 'serverSocket isRunning port workerProcess'
	classVariableNames: 'DefaultInstance'
	poolDictionaries: ''
	category: 'SmalltalkUI-Server'!

!SmalltalkUIWebServer commentStamp: 'cuis 8/8/2026 08:48' prior: 0!
A lightweight HTTP/REST server for Cuis-Smalltalk and Cuis University.
Provides REST API endpoints for SmalltalkUI web client to inspect categories, classes, methods,
compile code, evaluate Smalltalk expressions, and file in .st chunks.!

!SmalltalkUIWebServer class methodsFor: 'instance creation' stamp: 'cuis 8/8/2026 08:48'!
default
	DefaultInstance ifNil: [ DefaultInstance := self onPort: 8080 ].
	^ DefaultInstance! !

!SmalltalkUIWebServer class methodsFor: 'instance creation' stamp: 'cuis 8/8/2026 08:48'!
onPort: aPortNumber
	^ self new initializeWithPort: aPortNumber! !

!SmalltalkUIWebServer class methodsFor: 'starting / stopping' stamp: 'cuis 8/8/2026 08:48'!
start
	"Start the default server instance on port 8080"
	self default start.! !

!SmalltalkUIWebServer class methodsFor: 'starting / stopping' stamp: 'cuis 8/8/2026 08:48'!
startOn: aPortNumber
	"Start default server on a custom port"
	self stop.
	DefaultInstance := self onPort: aPortNumber.
	DefaultInstance start.! !

!SmalltalkUIWebServer class methodsFor: 'starting / stopping' stamp: 'cuis 8/8/2026 08:48'!
stop
	"Stop the running server"
	DefaultInstance ifNotNil: [
		DefaultInstance stop.
		DefaultInstance := nil.
	].! !

!SmalltalkUIWebServer methodsFor: 'initialization' stamp: 'cuis 8/8/2026 08:48'!
initializeWithPort: aPortNumber
	port := aPortNumber.
	isRunning := false.! !

!SmalltalkUIWebServer methodsFor: 'control' stamp: 'cuis 8/8/2026 08:48'!
start
	isRunning ifTrue: [
		Transcript show: ('[SmalltalkUI] Server is already running on port ' , port printString).
		^ self
	].
	isRunning := true.
	Socket initializeNetwork.
	serverSocket := Socket newTCP.
	serverSocket listenOn: port backlogSize: 10.
	
	Transcript show: '=================================================='.
	Transcript show: ('[SmalltalkUI] WebServer started & LISTENING on http://localhost:' , port printString).
	Transcript show: '[SmalltalkUI] Ready to accept WebUI connections.'.
	Transcript show: '=================================================='.

	workerProcess := [
		[ isRunning ] whileTrue: [
			| clientSocket |
			clientSocket := serverSocket waitForAcceptFor: 1.
			clientSocket ifNotNil: [
				[ self handleClient: clientSocket ] fork.
			].
		].
	] forkAt: Processor userBackgroundPriority named: 'SmalltalkUI-Server-Worker'.! !

!SmalltalkUIWebServer methodsFor: 'control' stamp: 'cuis 8/8/2026 08:48'!
stop
	isRunning := false.
	serverSocket ifNotNil: [
		serverSocket closeAndDestroy.
		serverSocket := nil.
	].
	workerProcess ifNotNil: [
		workerProcess terminate.
		workerProcess := nil.
	].
	Transcript show: '[SmalltalkUI] WebServer STOPPED.'.! !

!SmalltalkUIWebServer methodsFor: 'request handling' stamp: 'cuis 8/8/2026 08:48'!
handleClient: clientSocket
	| stream requestLine parts method path body contentLength line |
	stream := SocketStream on: clientSocket.
	stream timeout: 10.
	[
		[
			requestLine := stream nextLine.
			(requestLine isNil or: [ requestLine isEmpty ]) ifTrue: [
				stream close.
				^ self
			].
			parts := requestLine findTokens: ' '.
			parts size >= 2 ifFalse: [
				stream close.
				^ self
			].
			method := parts first asUppercase.
			path := parts second.

			"Parse Headers"
			contentLength := 0.
			[
				line := stream nextLine.
				line isNil or: [ line isEmpty ]
			] whileFalse: [
				(line asLowercase beginsWith: 'content-length:') ifTrue: [
					contentLength := (line copyFrom: 16 to: line size) withBlanksTrimmed asInteger ifNil: [ 0 ].
				].
			].

			"Read Body if present"
			body := ''.
			(contentLength > 0) ifTrue: [
				body := stream next: contentLength.
			].

			Transcript show: ('[SmalltalkUI] ' , method , ' ' , path).
			"Handle Request and Dispatch"
			self dispatchMethod: method path: path body: body onStream: stream.
		] on: Error do: [ :err |
			Transcript show: ('[SmalltalkUI] Error handling request: ' , err messageText).
			[ self sendResponseCode: 500 text: ('{"error": "', (self escapeJson: err messageText), '"}') contentType: 'application/json' on: stream ] on: Error do: [].
		].
	] ensure: [
		[ stream flush ] on: Error do: [].
		[ stream close ] on: Error do: [].
	].! !

!SmalltalkUIWebServer methodsFor: 'request handling' stamp: 'cuis 8/8/2026 08:48'!
dispatchMethod: httpMethod path: fullPath body: body onStream: stream
	| basePath queryParams |
	httpMethod = 'OPTIONS' ifTrue: [
		^ self sendOptionsResponseOn: stream
	].

	basePath := fullPath.
	queryParams := Dictionary new.
	(fullPath includes: $?) ifTrue: [
		| qIndex qStr |
		qIndex := fullPath indexOf: $?.
		basePath := fullPath copyFrom: 1 to: qIndex - 1.
		qStr := fullPath copyFrom: qIndex + 1 to: fullPath size.
		(qStr findTokens: '&') do: [ :param |
			| eqIdx k v |
			eqIdx := param indexOf: $=.
			eqIdx > 0 ifTrue: [
				k := param copyFrom: 1 to: eqIdx - 1.
				v := self urlDecode: (param copyFrom: eqIdx + 1 to: param size).
				queryParams at: k put: v.
			] ifFalse: [
				queryParams at: param put: ''.
			].
		].
	].

	[
		(basePath = '/api/status') ifTrue: [
			^ self sendJsonResponse: (self jsonStatus) on: stream
		].
		(basePath = '/api/categories') ifTrue: [
			^ self sendJsonResponse: (self jsonCategories) on: stream
		].
		(basePath = '/api/classes') ifTrue: [
			| cat |
			cat := queryParams at: 'category' ifAbsent: [ nil ].
			^ self sendJsonResponse: (self jsonClassesForCategory: cat) on: stream
		].
		(basePath = '/api/method') ifTrue: [
			| clsName sel side |
			clsName := queryParams at: 'class' ifAbsent: [ nil ].
			sel := queryParams at: 'selector' ifAbsent: [ nil ].
			side := queryParams at: 'side' ifAbsent: [ 'instance' ].
			(clsName notNil and: [ sel notNil ]) ifTrue: [
				^ self sendJsonResponse: (self jsonMethodSource: clsName selector: sel side: side) on: stream
			].
		].
		(basePath beginsWith: '/api/class/') ifTrue: [
			^ self handleClassRoute: basePath query: queryParams stream: stream
		].
		(basePath = '/api/eval' and: [ httpMethod = 'POST' ]) ifTrue: [
			^ self sendJsonResponse: (self handleEval: body) on: stream
		].
		(basePath = '/api/compile' and: [ httpMethod = 'POST' ]) ifTrue: [
			^ self sendJsonResponse: (self handleCompile: body) on: stream
		].
		(basePath = '/api/filein' and: [ httpMethod = 'POST' ]) ifTrue: [
			^ self sendJsonResponse: (self handleFileIn: body) on: stream
		].
		(basePath = '/api/search') ifTrue: [
			| query |
			query := queryParams at: 'q' ifAbsent: [ '' ].
			^ self sendJsonResponse: (self handleSearch: query) on: stream
		].

		"Not Found"
		self sendResponseCode: 404 text: '{"error": "Not Found"}' contentType: 'application/json' on: stream.
	] on: Error do: [ :err |
		self sendResponseCode: 500 text: ('{"error": "', (self escapeJson: err messageText), '"}') contentType: 'application/json' on: stream.
	].! !

!SmalltalkUIWebServer methodsFor: 'routing' stamp: 'cuis 8/8/2026 08:48'!
handleClassRoute: path query: query stream: stream
	| subPath parts className side |
	subPath := path copyFrom: 12 to: path size.
	parts := subPath findTokens: '/'.
	parts isEmpty ifTrue: [
		^ self sendResponseCode: 400 text: '{"error": "Missing class name"}' contentType: 'application/json' on: stream
	].
	className := parts first.
	side := query at: 'side' ifAbsent: [ 'instance' ].

	(parts size = 1) ifTrue: [
		"GET /api/class/:name"
		^ self sendJsonResponse: (self jsonClassDetails: className) on: stream
	].

	(parts size = 2 and: [ parts second = 'protocols' ]) ifTrue: [
		"GET /api/class/:name/protocols"
		^ self sendJsonResponse: (self jsonProtocolsForClass: className side: side) on: stream
	].

	(parts size = 2 and: [ parts second = 'methods' ]) ifTrue: [
		"GET /api/class/:name/methods?protocol=..."
		| protocol |
		protocol := query at: 'protocol' ifAbsent: [ nil ].
		^ self sendJsonResponse: (self jsonMethodsForClass: className protocol: protocol side: side) on: stream
	].

	(parts size = 3 and: [ parts second = 'method' ]) ifTrue: [
		"GET /api/class/:name/method/:selector"
		| selector |
		selector := self urlDecode: parts third.
		^ self sendJsonResponse: (self jsonMethodSource: className selector: selector side: side) on: stream
	].

	self sendResponseCode: 404 text: '{"error": "Route not matched"}' contentType: 'application/json' on: stream.! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonStatus
	| ver |
	ver := [ SystemVersion current version ] on: Error do: [
		[ SystemVersion current versionString ] on: Error do: [ 'Cuis' ]
	].
	^ '{"status":"ok","system":"Cuis-Smalltalk","version":"', (self escapeJson: ver asString), '"}'! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonCategories
	| cats stream |
	cats := SystemOrganization categories asSortedCollection.
	stream := String new writeStream.
	stream nextPut: $[.
	cats do: [ :cat |
		stream nextPut: $"; nextPutAll: (self escapeJson: cat asString); nextPut: $"
	] separatedBy: [ stream nextPut: $, ].
	stream nextPut: $].
	^ stream contents! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonClassesForCategory: aCategoryName
	| classes stream |
	classes := aCategoryName
		ifNil: [ Smalltalk allClasses ]
		ifNotNil: [ (SystemOrganization listAtCategoryNamed: aCategoryName asSymbol) collect: [ :n | Smalltalk at: n ifAbsent: [ nil ] ] thenSelect: [ :c | c notNil ] ].
	classes := classes asSortedCollection: [ :a :b | a name <= b name ].

	stream := String new writeStream.
	stream nextPut: $[.
	classes do: [ :cls |
		stream nextPutAll: '{"name":"'; nextPutAll: (self escapeJson: cls name asString);
			   nextPutAll: '","superclass":"'; nextPutAll: (cls superclass ifNil: [ '' ] ifNotNil: [ :sc | self escapeJson: sc name asString ]);
			   nextPutAll: '","category":"'; nextPutAll: (self escapeJson: cls category asString);
			   nextPutAll: '","hasSubclasses":'; nextPutAll: (cls subclasses notEmpty printString);
			   nextPutAll: '}'
	] separatedBy: [ stream nextPut: $, ].
	stream nextPut: $].
	^ stream contents! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonClassDetails: aClassName
	| cls superName instVarsStream classVarsStream comment definition |
	cls := Smalltalk at: aClassName asSymbol ifAbsent: [ nil ].
	cls ifNil: [ ^ '{"error":"Class not found: ', (self escapeJson: aClassName), '"}' ].

	superName := cls superclass ifNil: [ 'nil' ] ifNotNil: [ :sc | sc name asString ].

	instVarsStream := String new writeStream.
	cls instVarNames do: [ :iv |
		instVarsStream nextPut: $"; nextPutAll: (self escapeJson: iv asString); nextPut: $"
	] separatedBy: [ instVarsStream nextPut: $, ].

	classVarsStream := String new writeStream.
	cls classVarNames do: [ :cv |
		classVarsStream nextPut: $"; nextPutAll: (self escapeJson: cv asString); nextPut: $"
	] separatedBy: [ classVarsStream nextPut: $, ].

	comment := cls comment ifNil: [ '' ].
	definition := cls definition.

	^ '{"name":"', (self escapeJson: cls name asString),
	  '","superclass":"', (self escapeJson: superName),
	  '","category":"', (self escapeJson: cls category asString),
	  '","definition":"', (self escapeJson: definition),
	  '","comment":"', (self escapeJson: comment),
	  '","instanceVariables":[', instVarsStream contents, ']',
	  '","classVariables":[', classVarsStream contents, ']}' ! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonProtocolsForClass: aClassName side: aSide
	| targetClass categories stream |
	targetClass := Smalltalk at: aClassName asSymbol ifAbsent: [ nil ].
	targetClass ifNil: [ ^ '[]' ].
	aSide = 'class' ifTrue: [ targetClass := targetClass class ].

	categories := targetClass organization categories asSortedCollection.
	stream := String new writeStream.
	stream nextPut: $[.
	categories do: [ :cat |
		stream nextPut: $"; nextPutAll: (self escapeJson: cat asString); nextPut: $"
	] separatedBy: [ stream nextPut: $, ].
	stream nextPut: $].
	^ stream contents! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonMethodsForClass: aClassName protocol: aProtocol side: aSide
	| targetClass selectors stream |
	targetClass := Smalltalk at: aClassName asSymbol ifAbsent: [ nil ].
	targetClass ifNil: [ ^ '[]' ].
	aSide = 'class' ifTrue: [ targetClass := targetClass class ].

	selectors := (aProtocol isNil or: [ aProtocol = '-- all --' or: [ aProtocol = 'all' ] ])
		ifTrue: [ targetClass selectors asSortedCollection ]
		ifFalse: [ (targetClass organization listAtCategoryNamed: aProtocol asSymbol) asSortedCollection ].

	stream := String new writeStream.
	stream nextPut: $[.
	selectors do: [ :sel |
		stream nextPut: $"; nextPutAll: (self escapeJson: sel asString); nextPut: $"
	] separatedBy: [ stream nextPut: $, ].
	stream nextPut: $].
	^ stream contents! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
sourceForMethod: cm inClass: targetClass selector: sel
	| src stringVal |
	src := [ cm getSource ] on: Error do: [ nil ].
	src ifNil: [ src := [ cm sourceCode ] on: Error do: [ nil ] ].
	src ifNil: [ src := [ targetClass sourceCodeAt: sel ] on: Error do: [ nil ] ].
	src ifNil: [ src := [ (targetClass compiledMethodAt: sel ifAbsent: [ nil ]) ifNotNil: [ :m | m getSource ] ] on: Error do: [ nil ] ].

	stringVal := [
		src ifNil: [ '' ] ifNotNil: [
			(src respondsTo: #string) ifTrue: [ src string asString ] ifFalse: [
				(src respondsTo: #asString) ifTrue: [ src asString ] ifFalse: [ src printString ]
			]
		]
	] on: Error do: [ '' ].

	(stringVal isEmpty or: [ stringVal = 'nil' ]) ifTrue: [
		stringVal := sel asString , ' "Source code unavailable"'.
	].
	^ stringVal! !

!SmalltalkUIWebServer methodsFor: 'api responders' stamp: 'cuis 8/8/2026 08:48'!
jsonMethodSource: aClassName selector: aSelector side: aSide
	| targetClass sel cm source protocol stamp currentCls |
	targetClass := Smalltalk at: aClassName asSymbol ifAbsent: [ nil ].
	targetClass ifNil: [ ^ '{"error":"Class not found: ', (self escapeJson: aClassName), '"}' ].
	aSide = 'class' ifTrue: [ targetClass := targetClass class ].

	sel := aSelector asString withBlanksTrimmed asSymbol.

	cm := nil.
	currentCls := targetClass.
	[ currentCls notNil and: [ cm isNil ] ] whileTrue: [
		cm := currentCls methodDict at: sel ifAbsent: [ nil ].
		currentCls := currentCls superclass.
	].

	cm ifNil: [
		cm := [ targetClass compiledMethodAt: sel ] on: Error do: [ nil ].
	].

	cm ifNil: [
		^ '{"error":"Method not found: ', (self escapeJson: sel asString), '"}'
	].

	source := self sourceForMethod: cm inClass: targetClass selector: sel.
	protocol := [ (targetClass organization categoryOfElement: sel) asString ] on: Error do: [ 'as yet unclassified' ].
	(protocol isNil or: [ protocol = 'nil' ]) ifTrue: [ protocol := 'as yet unclassified' ].

	stamp := [ cm timeStamp asString ] on: Error do: [ '' ].
	(stamp isNil or: [ stamp = 'nil' ]) ifTrue: [ stamp := '' ].

	^ '{"className":"', (self escapeJson: aClassName),
	  '","selector":"', (self escapeJson: sel asString),
	  '","side":"', (self escapeJson: aSide),
	  '","protocol":"', (self escapeJson: protocol),
	  '","stamp":"', (self escapeJson: stamp),
	  '","source":"', (self escapeJson: source), '"}'! !

!SmalltalkUIWebServer methodsFor: 'api actions' stamp: 'cuis 8/8/2026 08:48'!
handleEval: jsonBody
	| expr result |
	expr := self extractJsonField: 'expression' from: jsonBody.
	expr ifNil: [ ^ '{"error":"Missing expression"}' ].
	[
		result := Compiler evaluate: expr.
		^ '{"success":true,"result":"', (self escapeJson: result printString), '"}'
	] on: Error do: [ :err |
		^ '{"success":false,"error":"', (self escapeJson: err messageText), '"}'
	].! !

!SmalltalkUIWebServer methodsFor: 'api actions' stamp: 'cuis 8/8/2026 08:48'!
handleCompile: jsonBody
	| className side protocol source targetClass compiledSelector |
	className := self extractJsonField: 'class' from: jsonBody.
	side := (self extractJsonField: 'side' from: jsonBody) ifNil: [ 'instance' ].
	protocol := (self extractJsonField: 'protocol' from: jsonBody) ifNil: [ 'as yet unclassified' ].
	source := self extractJsonField: 'source' from: jsonBody.

	targetClass := Smalltalk at: className asSymbol ifAbsent: [ nil ].
	targetClass ifNil: [ ^ '{"success":false,"error":"Class not found"}' ].
	side = 'class' ifTrue: [ targetClass := targetClass class ].

	[
		compiledSelector := targetClass compile: source classified: protocol asSymbol.
		^ '{"success":true,"selector":"', (self escapeJson: compiledSelector asString), '"}'
	] on: Error do: [ :err |
		^ '{"success":false,"error":"', (self escapeJson: err messageText), '"}'
	].! !

!SmalltalkUIWebServer methodsFor: 'api actions' stamp: 'cuis 8/8/2026 08:48'!
handleFileIn: jsonBody
	| content readStream |
	content := self extractJsonField: 'content' from: jsonBody.
	content ifNil: [ ^ '{"success":false,"error":"Missing content"}' ].
	[
		readStream := ReadStream on: content.
		readStream fileIn.
		^ '{"success":true,"message":"FileIn completed successfully"}'
	] on: Error do: [ :err |
		^ '{"success":false,"error":"', (self escapeJson: err messageText), '"}'
	].! !

!SmalltalkUIWebServer methodsFor: 'api actions' stamp: 'cuis 8/8/2026 08:48'!
handleSearch: query
	| q matchingClasses matchingMethods classStream methodStream |
	q := query asLowercase.
	matchingClasses := Smalltalk allClasses select: [ :c |
		(c name asString asLowercase indexOfSubCollection: q) > 0
	].
	matchingMethods := OrderedCollection new.
	Smalltalk allClasses do: [ :c |
		c selectors do: [ :s |
			((s asString asLowercase indexOfSubCollection: q) > 0) ifTrue: [
				matchingMethods add: (c name asString, '>>#', s asString).
			].
		].
	].

	classStream := String new writeStream.
	matchingClasses do: [ :c |
		classStream nextPut: $"; nextPutAll: (self escapeJson: c name asString); nextPut: $"
	] separatedBy: [ classStream nextPut: $, ].

	methodStream := String new writeStream.
	matchingMethods do: [ :m |
		methodStream nextPut: $"; nextPutAll: (self escapeJson: m); nextPut: $"
	] separatedBy: [ methodStream nextPut: $, ].

	^ '{"classes":[', classStream contents, '],"methods":[', methodStream contents, ']}' ! !

!SmalltalkUIWebServer methodsFor: 'http helpers' stamp: 'cuis 8/8/2026 08:48'!
sendJsonResponse: jsonString on: stream
	self sendResponseCode: 200 text: jsonString contentType: 'application/json' on: stream.! !

!SmalltalkUIWebServer methodsFor: 'http helpers' stamp: 'cuis 8/8/2026 08:48'!
sendOptionsResponseOn: stream
	| crlf |
	crlf := String crlfString.
	stream nextPutAll: 'HTTP/1.1 204 No Content'; nextPutAll: crlf;
		   nextPutAll: 'Access-Control-Allow-Origin: *'; nextPutAll: crlf;
		   nextPutAll: 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'; nextPutAll: crlf;
		   nextPutAll: 'Access-Control-Allow-Headers: *'; nextPutAll: crlf;
		   nextPutAll: 'Content-Length: 0'; nextPutAll: crlf;
		   nextPutAll: crlf;
		   flush.! !

!SmalltalkUIWebServer methodsFor: 'http helpers' stamp: 'cuis 8/8/2026 08:48'!
sendResponseCode: code text: bodyString contentType: ctype on: stream
	| crlf |
	crlf := String crlfString.
	stream nextPutAll: 'HTTP/1.1 '; nextPutAll: code printString; nextPutAll: ' OK'; nextPutAll: crlf;
		   nextPutAll: 'Access-Control-Allow-Origin: *'; nextPutAll: crlf;
		   nextPutAll: 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'; nextPutAll: crlf;
		   nextPutAll: 'Access-Control-Allow-Headers: *'; nextPutAll: crlf;
		   nextPutAll: 'Content-Type: '; nextPutAll: ctype; nextPutAll: '; charset=utf-8'; nextPutAll: crlf;
		   nextPutAll: 'Connection: close'; nextPutAll: crlf;
		   nextPutAll: crlf;
		   nextPutAll: bodyString;
		   flush.! !

!SmalltalkUIWebServer methodsFor: 'utility' stamp: 'cuis 8/8/2026 08:48'!
escapeJson: aString
	| stream inCr |
	aString ifNil: [ ^ '' ].
	stream := String new writeStream.
	inCr := false.
	aString asString do: [ :ch |
		ch = $" ifTrue: [ stream nextPutAll: '\"'. inCr := false ]
		ifFalse: [ ch = $\ ifTrue: [ stream nextPutAll: '\\'. inCr := false ]
		ifFalse: [ ch = Character cr ifTrue: [ stream nextPutAll: '\n'. inCr := true ]
		ifFalse: [ ch = Character lf ifTrue: [
			inCr ifFalse: [ stream nextPutAll: '\n' ].
			inCr := false
		]
		ifFalse: [ ch = Character tab ifTrue: [ stream nextPutAll: '\t'. inCr := false ]
		ifFalse: [
			inCr := false.
			stream nextPut: ch.
		]]]]]
	].
	^ stream contents! !

!SmalltalkUIWebServer methodsFor: 'utility' stamp: 'cuis 8/8/2026 08:48'!
extractJsonField: fieldName from: json
	| pattern start end |
	pattern := '"', fieldName, '":'.
	start := json indexOfSubCollection: pattern startingAt: 1 ifAbsent: [ 0 ].
	start = 0 ifTrue: [ ^ nil ].
	start := start + pattern size.
	[ start <= json size and: [ (json at: start) isSeparator ] ] whileTrue: [ start := start + 1 ].
	(start <= json size and: [ (json at: start) = $" ]) ifTrue: [
		start := start + 1.
		end := start.
		[ end <= json size and: [ (json at: end) ~= $" or: [ (json at: end - 1) = $\ ] ] ] whileTrue: [ end := end + 1 ].
		^ (json copyFrom: start to: end - 1) copyReplaceAll: '\"' with: '"'
	].
	^ nil! !

!SmalltalkUIWebServer methodsFor: 'utility' stamp: 'cuis 8/8/2026 08:48'!
urlDecode: aString
	| in out |
	aString ifNil: [ ^ '' ].
	in := aString asString readStream.
	out := String new writeStream.
	[ in atEnd ] whileFalse: [
		| ch |
		ch := in next.
		ch = $+ ifTrue: [ out nextPut: $ ]
		ifFalse: [
			(ch = $% and: [ in position + 2 <= in size ]) ifTrue: [
				| hex val |
				hex := in next: 2.
				val := [ Integer readFrom: (ReadStream on: hex) base: 16 ] on: Error do: [ 0 ].
				out nextPut: (Character value: val).
			] ifFalse: [ out nextPut: ch ]
		]
	].
	^ out contents! !
