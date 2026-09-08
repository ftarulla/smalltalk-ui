!classDefinition: #Counter category: #'SmalltalkUI-Samples'!
Object subclass: #Counter
	instanceVariableNames: 'count step'
	classVariableNames: 'DefaultStep'
	poolDictionaries: ''
	category: 'SmalltalkUI-Samples'!

!Counter commentStamp: 'cuis 8/8/2026 08:48' prior: 0!
A simple Counter demonstration class for SmalltalkUI.
Supports incrementing, decrementing, and customizable step values.!

!Counter class methodsFor: 'instance creation' stamp: 'cuis 8/8/2026 08:48'!
startingAt: anInitialValue
	^ self new initializeWith: anInitialValue! !

!Counter class methodsFor: 'instance creation' stamp: 'cuis 8/8/2026 08:48'!
withStep: aStepValue
	^ self new step: aStepValue; yourself! !

!Counter class methodsFor: 'initialization' stamp: 'cuis 8/8/2026 08:48'!
initialize
	DefaultStep := 1.! !

!Counter methodsFor: 'initialization' stamp: 'cuis 8/8/2026 08:48'!
initialize
	super initialize.
	count := 0.
	step := DefaultStep ifNil: [ 1 ].! !

!Counter methodsFor: 'initialization' stamp: 'cuis 8/8/2026 08:48'!
initializeWith: anInitialValue
	self initialize.
	count := anInitialValue.! !

!Counter methodsFor: 'accessing' stamp: 'cuis 8/8/2026 08:48'!
count
	"Return the current count"
	^ count! !

!Counter methodsFor: 'accessing' stamp: 'cuis 8/8/2026 08:48'!
count: aNumber
	"Set the current count value"
	count := aNumber.! !

!Counter methodsFor: 'accessing' stamp: 'cuis 8/8/2026 08:48'!
step
	"Return the current step size"
	^ step! !

!Counter methodsFor: 'accessing' stamp: 'cuis 8/8/2026 08:48'!
step: aNumber
	"Set the step size"
	step := aNumber.! !

!Counter methodsFor: 'operations' stamp: 'cuis 8/8/2026 08:48'!
increment
	"Increment count by current step"
	count := count + step.
	^ count! !

!Counter methodsFor: 'operations' stamp: 'cuis 8/8/2026 08:48'!
decrement
	"Decrement count by current step"
	count := count - step.
	^ count! !

!Counter methodsFor: 'operations' stamp: 'cuis 8/8/2026 08:48'!
reset
	"Reset counter to zero"
	count := 0.! !

!Counter methodsFor: 'printing' stamp: 'cuis 8/8/2026 08:48'!
printOn: aStream
	super printOn: aStream.
	aStream nextPutAll: '(count: '.
	count printOn: aStream.
	aStream nextPutAll: ', step: '.
	step printOn: aStream.
	aStream nextPut: $).! !
