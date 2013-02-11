API
===

1. [when](#when)
1. [Deferred](#deferred)
1. [Resolver](#resolver)
1. [Promise](#promise)
	* [Extended Promise API](#extended-promise-api)
	* [Progress events](#progress-events)
1. [Creating promises](#creating-promises)
	* [when.defer](#whendefer)
	* [when.resolve](#whenresolve)
	* [when.reject](#whenreject)
1. [Joining promises](#joining-promises)
	* [when.join](#whenjoin)
	* [when.chain](#whenchain)
1. [Arrays of promises](#arrays-of-promises)
	* [when.all](#whenall)
	* [when.map](#whenmap)
	* [when.reduce](#whenreduce)
1. [Competitive races](#competitive-races)
	* [when.any](#whenany)
	* [when.some](#whensome)
1. [Timed promises](#timed-promises)
	* [when/delay](#whendelay)
	* [when/timeout](#whentimeout)
1. [Concurrency](#concurrency)
	* [when/sequence](#whensequence)
	* [when/pipeline](#whenpipeline)
	* [when/parallel](#whenparallel)
1. [Interacting with non-promise code](#interacting-with-non-promise-code)
	* [Synchronous functions](#synchronous-functions)
	* [Asynchronous functions](#asynchronous-functions)
	* [Node-style asynchronous functions](#node-style-asynchronous-functions)
1. [Helpers](#helpers)
	* [when/apply](#whenapply)
1. [Configuration](#configuration)
	* [Paranoid mode](#paranoid-mode) (NO LONGER APPLICABLE)

## when()

```js
when(promiseOrValue, onFulfilled, onRejected, onProgress)
```

Observe a promise or immediate value.

If `promiseOrValue` is a value, arranges for `onFulfilled` to be called with that value, and returns a promise for the result.

If `promiseOrValue` is a promise, arranges for

* `onFulfilled` to be called with the value after `promiseOrValue` is fulfilled, or
* `onRejected` to be called with the rejection reason after `promiseOrValue` is rejected.
* `onProgress` to be called with any progress updates issued by `promiseOrValue`.

`when()` returns a [trusted promise](#promise) that will fulfill with the return value of either `onFulfilled` or `onRejected`, whichever is called, or will reject with the thrown exception if either throws.

Additionally, it makes the following guarantees about handlers registered in the same call to `when()`:

1. Only one of `onFulfilled` or `onRejected` will be called, never both.
1. `onFulfilled` and `onRejected` will never be called more than once.
1. `onProgress` may be called multiple times.

```js
// Returns a promise for the result of onFulfilled or onRejected depending
// on the promiseOrValue's outcome
var promise = when(promiseOrValue, onFulfilled, onRejected);

// Always returns a trusted promise, so it is guaranteed to be chainable:
when(promiseOrValue, onFulfilled, onRejected, onProgress)
	.then(anotherOnFulfilled, anotherOnRejected, anotherOnProgress);

// All parameters except the first are optional
// For example, you can register only an onFulfilled handler
when(promiseOrValue, onFulfilled);
```

`when()` can observe any promise that provides a *thenable* promise--any object that provides a `.then()` method, even promises that aren't fully Promises/A compliant, such as jQuery's Deferred.  It will assimilate such promises and make them behave like Promises/A.

In either case, `when()` will *always* return a trusted when.js promise, which will be fully Promises/A compliant and also have the [extended promise API](#extended-promise-api).

### See Also
* [Read more about when() here](https://github.com/cujojs/when/wiki/when)

## Deferred

A deferred represents an operation whose resolution is *pending*.  It has separate `promise` and `resolver` parts that can be *safely* given out to separate groups of consumers and producers, respectively, to allow safe, one-way communication.

```js
var promise = deferred.promise;
var resolver = deferred.resolver;
```

**DEPRECATED:** Note that `deferred.then` [is deprecated](https://github.com/cujojs/when/issues/76) and [will be removed](https://github.com/cujojs/when/issues/44) in an upcoming release.

**Note:** Although a deferred has the full `resolver` API, this should used *for convenience only, by the creator of the deferred*.  Only the `resolver` should be given to consumers and producers.

```js
deferred.resolve(promiseOrValue);
deferred.reject(reason);
deferred.progress(update);

// NOTE: deferred.then is DEPRECATED, use deferred.promise.then
deferred.then(onFulfilled, onRejected, onProgress);
```

## Resolver

The resolver represents *responsibility*--the responsibility of fulfilling or rejecting the associated promise.  This responsibility may be given out separately from the promise itself.

```js
var resolver = deferred.resolver;
resolver.resolve(promiseOrValue);
resolver.reject(reason);
resolver.progress(update);
```

## Promise

The promise represents the *eventual outcome*, which is either fulfillment (success) and an associated value, or rejection (failure) and an associated *reason*. The promise provides mechanisms for arranging to call a function on its value or reason, and produces a new promise for the result.

```js
// Get a deferred promise
var deferred = when.defer();
var promise = deferred.promise;

// Or a resolved promise
var promise = when.resolve(promiseOrValue);

// Or a rejected promise
var promise = when.reject(reason);
```

## Main Promise API

```js
// then()
// Main promise API
var newPromise = promise.then(onFulfilled, onRejected, onProgress);
```

arranges for

* `onFulfilled` to be called with the value after `promise` is fulfilled, or
* `onRejected` to be called with the rejection reason after `promise` is rejected.
* `onProgress` to be called with any progress updates issued by `promise`.

Returns a trusted promise that will fulfill with the return value of either `onFulfilled` or `onRejected`, whichever is called, or will reject with the thrown exception if either throws.

A promise makes the following guarantees about handlers registered in the same call to `.then()`:

1. Only one of `onFulfilled` or `onRejected` will be called, never both.
1. `onFulfilled` and `onRejected` will never be called more than once.
1. `onProgress` may be called multiple times.

## Extended Promise API

Convenience methods that are not part of Promises/A+.  These are simply shortcuts for using `.then()`.

### always()

```js
promise.always(onFulfilledOrRejected [, onProgress]);
```

Arranges to call `onFulfilledOrRejected` on either the promise's value if it is fulfilled, or on it's rejection reason if it is rejected.  It's a shortcut for:

```js
promise.then(onFulfilledOrRejected, onFulfilledOrRejected [, onProgress]);
```

### otherwise()

```js
promise.otherwise(onRejected);
```

Arranges to call `onRejected` on the promise's rejection reason if it is rejected.  It's a shortcut for:

```js
promise.then(undefined, onRejected);
```

### yield()

```js
promise.yield(promiseOrValue);
```

Returns a promise:

1. If `promiseOrValue` is a value, the returned promise will be fulfilled with `promiseOrValue`
2. If `promiseOrValue` is a promise, the returned promise will be:
	1. fulfilled with the fulfillment value of `promiseOrValue`, or
	1. rejected with the rejection reason of `promiseOrValue`

In other words, it's a shortcut for:

```js
promise.then(function() {
	return promiseOrValue;
});
```

### spread()

```js
promise.spread(variadicOnFulfilled);
```

Arranges to call `variadicOnFulfilled` with promise's values, which is assumed to be an array, as its argument list, e.g. `variadicOnFulfilled.spread(undefined, array)`.  It's a shortcut for either of the following:

```js
// Wrapping variadicOnFulfilled
promise.then(function(array) {
	return variadicOnFulfilled.apply(undefined, array);
});

// Or using when/apply
promise.then(apply(variadicOnFulfilled));
```

## Progress events

Progress events are not specified in Promises/A+ and are optional in Promises/A.  They have proven to be useful in practice, but unfortunately, they are also underspecified, and there is no current *de facto* or agreed-upon behavior in the promise implementor community.

The two sections below describe how they behave in when.js.

### 1.5.x and earlier

Prior to 1.6.0, progress events were only delivered to progress handlers registered directly on the promise where the progress events were being issued.  In other words, in the following example, `myProgressHandler` would be called with `update`, but `myOtherProgressHandler` would *not*.

```js
var d = when.defer();
d.promise.then(undefined, undefined, myProgressHandler);

var chainedPromise = d.promise.then(doStuff);
chainedPromise.then(undefined, undefined, myOtherProgressHandler);

var update = 1;
d.progress(update);
```

### 1.6.0 and later

As of 1.6.0, progress events will be propagated through a promise chain:

1. In the same way as resolution and rejection handlers, your progress handler *MUST* return a progress event to be propagated to the next link in the chain.  If you return nothing, *undefined will be propagated*.
1. Also in the same way as resolutions and rejections, if you don't register a progress handler (e.g. `.then(handleResolve, handleReject /* no progress handler */)`), the update will be propagated through.
1. **This behavior will likely change in future releases:** If your progress handler throws an exception, the exception will be propagated to the next link in the chain. The best thing to do is to ensure your progress handlers do not throw exceptions.
	1. **Known Issue:** If you allow an exception to propagate and there are no more progress handlers in the chain, the exception will be silently ignored. We're working on a solution to this.

This gives you the opportunity to *transform* progress events at each step in the chain so that they are meaningful to the next step.  It also allows you to choose *not* to transform them, and simply let them propagate untransformed, by not registering a progress handler.

Here is how the above situation works in >= 1.6.0:

```js
function myProgressHandler(update) {
	logProgress(update);
	// Return a transformed progress update that is
	// useful for progress handlers of the next promise!
	return update + 1;
}

function myOtherProgressHandler(update) {
	logProgress(update);
}

var d = when.defer();
d.promise.then(undefined, undefined, myProgressHandler);

var chainedPromise = d.promise.then(doStuff);
chainedPromise.then(undefined, undefined, myOtherProgressHandler);

var update = 1;
d.progress(update);

// Results in:
// logProgress(1);
// logProgress(2);
```

# Creating promises

## when.defer()

```js
var deferred = when.defer();
```

Create a new [Deferred](#deferred) that can resolved at a later time.

## when.resolve()

```js
var resolved = when.resolve(promiseOrValue);
```

Create a resolved promise for the supplied promiseOrValue. If promiseOrValue is a value, it will be the resolution value of the returned promise.  Returns promiseOrValue if it's a trusted promise. If promiseOrValue is a foreign promise, returns a promise in the same state (resolved or rejected) and with the same value as promiseOrValue.

## when.reject()

```js
var rejected = when.reject(promiseOrValue);
```

Create a rejected promise for the supplied promiseOrValue. If promiseOrValue is a value, it will be the rejection value of the returned promise.  If promiseOrValue is a promise, its completion value will be the rejected value of the returned promise.

This can be useful in situations where you need to reject a promise *without* throwing an exception.  For example, it allows you to propagate a rejection with the value of another promise.

```js
when(doSomething(),
	handleSuccess,
	function(error) {
		// doSomething failed, but we want to do some processing on the error
		// to return something more useful to the caller.
		// This allows processError to return either a value or a promise.
		return when.reject(processError(e));
	}
);
```

## when.isPromise()

```js
var is = when.isPromise(anything);
```

Return true if `anything` is truthy and implements the then() promise API.  Note that this will return true for both a deferred (i.e. `when.defer()`), and a `deferred.promise` since both implement the promise API.

# Joining promises

## when.join()

```js
var joinedPromise = when.join(promiseOrValue1, promiseOrValue2, ...);
```

Return a promise that will resolve only once *all* the inputs have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the inputs.

### See also:
* [when.all()](#whenall) - resolving an Array of promises

## when.chain()

```js
var promise = when.chain(promiseOrValue, resolver, optionalValue)
```

Arrange for `resolver` to be resolved when `promiseOrValue` resolves.  If `optionalValue` is provided, `resolver` will be resolved with `optionalValue`, if provided, or otherwise with the resolution value of `promiseOrValue`.

Returns a new promise that will resolve when `promiseOrValue` resolves, with `optionalValue` as its resolution value, if provided, or otherwise with the resolution value of `promiseOrValue`.

Where:

* `promiseOrValue` - any promise or value.
* `resolver` - any object that supports the [Resolver API](#resolver)
* `optionalValue` - any value.  **Note:** May be a promise if `resolver` supports being resolved with another promise.  When.js resolvers *do* support this, but other implementations may not.

# Arrays of promises

## when.all()

```js
var promise = when.all(array, onFulfilled, onRejected, onProgress)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Return a promise that will resolve only once *all* the items in `array` have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the items in `array`.

### See also:
* [when.join()](#whenjoin) - joining multiple promises

## when.map()

```js
var promise = when.map(array, mapFunc)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Traditional map function, similar to `Array.prototype.map()`, but allows input to contain promises and/or values, and mapFunc may return either a value or a promise.

The map function should have the signature:

```js
mapFunc(item)
```

Where:

* `item` is a fully resolved value of a promise or value in `promisesOrValues`

## when.reduce()

```js
var promise = when.reduce(array, reduceFunc, initialValue)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Traditional reduce function, similar to `Array.prototype.reduce()`, but input may contain promises and/or values, and reduceFunc may return either a value or a promise, *and* initialValue may be a promise for the starting value.

The reduce function should have the signature:

```js
reduceFunc(currentValue, nextItem, index, total)
```

Where:

* `currentValue` is the current accumulated reduce value
* `nextItem` is the fully resolved value of the promise or value at `index` in `promisesOrValues`
* `index` the *basis* of `nextItem` ... practically speaking, this is the array index of the promiseOrValue corresponding to `nextItem`
* `total` is the total number of items in `promisesOrValues`

# Competitive races

## when.any()

```js
var promise = when.any(array, onFulfilled, onRejected, onProgress)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Initiates a competitive race that allows one winner, returning a promise that will resolve when any one of the items in `array` resolves.  The returned promise will only reject if *all* items in `array` are rejected.  The resolution value of the returned promise will be the resolution value of the winning item.  The rejection value will be an array of all rejection reasons.

## when.some()

```js
var promise = when.some(array, howMany, onFulfilled, onRejected, onProgress)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Initiates a competitive race that allows `howMany` winners, returning a promise that will resolve when `howMany` of the items in `array` resolve.  The returned promise will reject if it becomes impossible for `howMany` items to resolve--that is, when `(array.length - howMany) + 1` items reject.  The resolution value of the returned promise will be an array of `howMany` winning item resolution values.  The rejection value will be an array of `(array.length - howMany) + 1` rejection reasons.

# Timed promises

## when/delay

```js
var delayed = delay(promiseOrValue, milliseconds);
```

Create a promise that resolves after a delay, or after a delay following the resolution of another promise.

```js
var delay, delayed;

delay = require('when/delay');

// delayed is an unresolved promise that will become resolved
// in 1 second with the value 123
delayed = delay(123, 1000)

// delayed is an unresolved promise that will become resolved
// 1 second after anotherPromise resolves, or will become rejected
// *immediately* after anotherPromise rejects.
delayed = delay(anotherPromise, 1000);
```

More when/delay [examples on the wiki](https://github.com/cujojs/when/wiki/when-delay)


## when/timeout

```js
var timed = timeout(promiseOrValue, milliseconds);
```

Create a promise that will reject after a timeout if promiseOrValue does not resolved or rejected beforehand.  If promiseOrValue is a value, the returned promise will resolve immediately.  More interestingly, if promiseOrValue is a promise, if it resolved before the timeout period, the returned promise will resolve.  If it doesn't, the returned promise will reject.

```js
var timeout, timed;

timeout = require('when/timeout');

// timed will reject after 5 seconds unless anotherPromise resolves beforehand.
timed = timeout(anotherPromise, 5000);
```

More when/timeout [examples on the wiki](https://github.com/cujojs/when/wiki/when-timeout)

# Concurrency

These modules allow you to execute tasks in series or parallel.  Each module takes an Array of task functions (or a *promise* for an Array), executes the tasks, and returns a promise that resolves when all the tasks have completed.

## when/sequence

```js
var sequence, resultsPromise;

sequence = require('when/sequence');

resultsPromise = sequence(arrayOfTasks, arg1, arg2 /*, ... */);
```

Run an array of tasks in sequence, without overlap.  Each task will be called with the arguments passed to `when.sequence()`, and each may return a promise or a value.

When all tasks have completed, the returned promise will resolve to an array containing the result of each task at the corresponding array position.  The returned promise will reject when any task throws or returns a rejection.

## when/pipeline

```js
var pipeline, resultsPromise;

pipeline = require('when/pipeline');

resultsPromise = pipeline(arrayOfTasks, arg1, arg2 /*, ... */);
```

Run an array of tasks in sequence, without overlap, similarly to [when/sequence](#whensequence).  The *first task* (e.g. `arrayOfTasks[0]`) will be called with the arguments passed to `when.pipeline()`, and each subsequence task will be called with the result of the previous task.

Again, each may return a promise or a value.  When a task returns a promise, the fully resolved value will be passed to the next task.

When all tasks have completed, the returned promise will resolve to the result of the last task.  The returned promise will reject when any task throws or returns a rejection.

## when/parallel

```js
var parallel, resultsPromise;

parallel = require('when/parallel');

resultsPromise = parallel(arrayOfTasks, arg1, arg2 /*, ... */);
```

Run an array of tasks in "parallel".  The tasks are allowed to execute in any order, and may interleave if they are asynchronous. Each task will be called with the arguments passed to `when.parallel()`, and each may return a promise or a value.

When all tasks have completed, the returned promise will resolve to an array containing the result of each task at the corresponding array position.  The returned promise will reject when any task throws or returns a rejection.

Interacting with non-promise code
=================================

These modules are aimed at dampening the friction between code that is based on promises and code that follows more conventional approaches to make asynchronous tasks and/or error handling. By using them, you are more likely to be able to reuse code that already exists, while still being able to reap the benefits of promises on your new code.

## Synchronous functions

The `when/function` module contains functions for calling and adapting "normal" functions (i.e. those that take plain values, return plain values, and throw exceptions on errors). By calling those functions with `fn.call` and `fn.apply`, or by creating a new function with `fn.bind`, the return value will always be a promise, and thrown exceptions will be turned into rejections. As a bonus, promises given as arguments will be transparently resolved before the call.

### `fn.call()`

```js
var promisedResult = fn.call(normalFunction, arg1, arg2/* ...more args */);
```

A parallel to the `Function.prototype.call` function, that gives promise-awareness to the function given as first argument.

```js
var when, fn;

when = require("when");
fn   = require("when/function");

function divideNumbers(a, b) {
	if(b !== 0) {
		return a / b;
	} else {
		throw new Error("Can't divide by zero!");
	}
}

// Prints '2'
fn.call(divideNumbers, 10, 5).then(console.log);

// Prints '4'
var promiseForFive = when.resolve(5);
fn.call(divideNumbers, 20, promiseForFive).then(console.log);

// Prints "Can't divide by zero!"
fn.call(divideNumbers, 10, 0).then(console.log, console.error);
```

### `fn.apply()`

```js
var promisedResult = fn.apply(normalFunction, [arg1, arg2/* ...more args */]);
```

`fn.apply` is to [`fn.call`](#fncall) as `Function.prototype.apply` is to `Function.prototype.call`: what changes is the way the arguments are taken.  While `fn.call` takes the arguments separately, `fn.apply` takes them as an array.

```js
var fn, when;

when = require("when");
fn   = require("when/function");

function sumMultipleNumbers() {
	return Array.prototype.reduce.call(arguments, function(prev, n) {
		return prev + n;
	}, 0);
}

// Prints '50'
fn.apply(sumMultipleNumbers, [10, 20, 20]).then(console.log, console.error);

// Prints 'something wrong happened', and the sum function never executes
var shortCircuit = when.reject("something wrong happened");
fn.apply(sumMultipleNumbers, [10, 20, shortCircuit]).then(console.log, console.error);
```

### `fn.bind()`

```js
var promiseFunction = fn.bind(normalFunction, arg1, arg2/* ...more args */);
```

When the same function will be called through `fn.call()` or `fn.apply()` multiple times, it can be more efficient to create a wrapper function that has promise-awareness and exposes the same behavior as the original function. That's what `fn.bind()` does: It takes a normal function and returns a new, promise-aware version of it. As `Function.prototype.bind`, it makes partial application of any additional arguments.

```js
var fn, when;

when = require("when");
fn   = require("when/function");

function setText(element, text) {
	element.text = text;
}

function getMessage() {
	// Async function that returns a promise
}

var element = {};

// Resolving the promies ourselves
getMessage().then(function(message) {
	setText(element, message);
});

// Using fn.call()
fn.call(setText, element, getMessage());

// Creating a new function using fn.bind()
var promiseSetText = fn.bind(setText);
promiseSetText(element, getMessage());

// Leveraging the partial application
var setElementMessage = fn.bind(setText, element);
setElementMessage(geMessage());
```

### `fn.compose()`

```js
var composedFunc = fn.compose(func1, func2 /* ...more functions */);
```

Composes multiple functions by piping their return values. It is transparent to whether the functions return 'regular' values or promises: the piped argument is always a resolved value. If one of the functions throws or returns a rejected promise, the promise returned by `composedFunc` will be rejected.

```js
// Reusing the same functions from the fn.bind() example

// Gets the message from the server every 1s, then sets it on the 'element'
var refreshMessage = fn.compose(getMessage, setElementMessage);
setInterval(refreshMessage, 1000);

// Which is equivalent to:
setInterval(function() {
	return fn.call(getMessage).then(setElementMessage);
}, 1000);
```

## Asynchronous functions

Much of the asynchronous functionality available to javascript developers, be it directly from the environment or via third party libraries, is callback/errback-based. The `when/callbacks` module provides functions to interact with those APIs via promises in a transparent way, without having to write custom wrappers or change existing code. All the functions on this module (with the exception of `callbacks.promisify()`) assume that the callback and errback will be on the "standard" positions - the penultimate and last arguments, respectively.

### `callbacks.call()`

```js
var promisedResult = callbacks.call(callbackTakingFunc, arg1, arg2/* ...more args */);
```

Takes a callback-taking function and returns a promise for its final value, forwarding any additional arguments. The promise will be resolved when the function calls its callback, and the resolution value will be callback's first argument. If multiple values are passed to the callback, the promise will resolve to an array. The same thing happens if the function call the errback, with the difference that the promise will be rejected instead.

```js
var domIsLoaded = callbacks.call($);
domIsLoaded.then(doMyDomStuff);

var waitFiveSeconds = callbacks.call(setTimeout, 5000);
waitFiveSeconds.then(function() {
	console.log("Five seconds have passed");
});
```

### `callbacks.apply()`

```js
var promisedResult = callbacks.apply(callbackTakingFunc, [arg1, arg2/* ...more args */]);
```

The array-taking analog to `callbacks.call`, as `Function.prototype.apply` is to `Function.prototype.call`.

```js
// This example simulates fading away an element, fading in a new one, fetching
// two remote resources, and then waiting for all that to finish before going
// forward. The APIs are all callback-based, but only promises are manipulated.

// .bind is needed because the context is lost
var oldHidden = callbacks.apply($old.fadeOut.bind($old), ["slow"]);

var transitionedScreens = oldHidden.then(function() {
	return callbacks.apply($new.fadeIn.bind($new),  ["slow"]);
});

var venuesLoaded  = callbacks.apply($.getJSON, ["./venues.json"]);
var artistsLoaded = callbacks.apply($.getJSON, ["./artists.json"]);

// Leveraging when.join to combine promises
when.join(venuesLoaded, artistsLoaded, transitionedScreens).then(function() {
	// Render next screen when everything is ready
}, function() {
	// Catch-all error handler
});
```

### `callbacks.bind()`

```js
var promiseFunc = callbacks.bind(callbackTakingFunc, arg1, arg2/* ...more args */);
```

Much like [`fn.bind()`](#fnbind), `callbacks.bind` creates a promise-friendly function, based on an existing function, but following the asynchronous resolution patters from [`callbacks.call()`](#callbackscall) and [`callbacks.apply()`](#callbacksapply). It can be useful when a particular function needs no be called on multiple places, or for creating an alternative API for a library.

Like `Function.prototype.bind`, additional arguments will be partially applied to the new function.

```js
// Fictional ajax library, because we don't have enough of those

function traditionalAjax(method, url, callback, errback) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url);

	xhr.onload = callback;
	xhr.onerror = errback;

	xhr.send();
}

var myLib = {
	// Traditional browser API: Takes callback and errback
	ajax: traditionalAjax,

	// Promise API: returns a promise, and may take promises as arguments
	promiseAjax: callbacks.bind(traditionalAjax)
};
```

### `callbacks.promisify()`

```js
var promiseFunc = callbacks.promisify(nonStandardFunc, {
    callback: zeroBasedIndex,
    errback:  otherZeroBasedIndex,
});
```

Almost all the functions on the `callbacks` module assume that the creators of the API were kind enough to follow the unspoken standard of taking the callback and errback as the last arguments on the function call; `callbacks.promisify()` is for when they weren't. In addition to the function to be adapted, `promisify` takes an object that describes what are the positions of the callback and errback arguments.

```js
function inverseStandard(errback, callback) {
	// ...
}

var promisified1 = callbacks.promisify(inverseStandard, {
	callback: 1,
	errback:  0, // indexes are zero-based
});

function firstAndThird(callback, someParam, errback) {
	// ...
}

var promisified2 = callbacks.promisify(firstAndThird, {
	callback: 0,
	errback:  2,
});

// The arguments to the promisified call are interleaved with the callback and
// errback.
promisified(10);

function inverseVariadic(/* arg1, arg2, arg3... , */errback, callback) {
	// ...
}

var promisified3 = callbacks.promisify(inverseVariadic, {
	callback: -1, // Negative indexes represent positions relative to the end
	errback:  -2,
});
```

## Node-style asynchronous functions

Node.js APIs have their own standard for asynchronous functions: Instead of taking an errback, errors are passed as the first argument to the callback function. To use promises instead of callbacks with node-style asynchronous functions, you can use the `when/node/function` module, which is very similar to `when/callbacks`, but tuned to this convention.

### `nodefn.call()`

```js
var promisedResult = nodefn.call(nodeStyleFunction, arg1, arg2/*...more args*/);
```

Analogous to [`fn.call()`](#fncall) and [`callbacks.call()`](#callbackscall): Takes a function plus optional arguments to that function, and returns a promise for its final value. The promise will be resolved or rejected depending on whether the conventional error argument is passed or not.

```js
var fs, nodefn;

fs     = require("fs");
nodefn = require("when/node/function");

var loadPasswd = nodefn.call(fn.readFile, "/etc/passwd");

loadPasswd.then(function(passwd) {
	console.log("Contents of /etc/passwd:\n" + passwd);
}, function(error) {
	console.log("Something wrong happened: " + error);
});
```

### `nodefn.apply()`

```js
var promisedResult = nodefn.apply(nodeStyleFunction, [arg1, arg2/*...more args*/]);
```

Following the tradition from `when/function` and `when/callbacks`, `when/node/function` also provides a array-based alternative to `nodefn.call()`.

```js
var nodefn, http;

nodefn = require("when/node/function");
http   = require("http");

var getCats = nodefn.apply(http.get, ["http://lolcats.com"]);

getCats.then(function(cats) {
	// Rejoice!
});
```

### `nodefn.bind()`

```js
var promiseFunc = nodefn.bind(nodeStyleFunction, arg1, arg2/*...more args*/);
```

Function based on the same principles from [`fn.bind()`](#fnbind) and [`callbacks.bind()`](#callbacksbind), but tuned to handle nodejs-style async functions.

```js
var dns, when, nodefn;

dns    = require("dns");
when   = require("when");
nodefn = require("when/node/function");

var resolveAddress = nodefn.bind(dns.resolve);

when.join(
	resolveAddress("twitter.com"),
	resolveAddress("facebook.com"),
	resolveAddress("google.com")
).then(function(addresses) {
  // All addresses resolved
}, function(reason) {
  // At least one of the lookups failed
});
```

### `nodefn.createCallback()`

```js
var nodeStyleCallback = nodefn.createCallback(resolver);
```

The core function on the `when/node/function` implementation, which might be useful for cases that aren't covered by the higher level API. It takes an object that responds to the [resolver interface](#resolver) and returns a function that can be used with any node-style asynchronous function, and will call `resolve()` or `reject()` on the resolver depending on whether the conventional error argument is passed to it.

```js
var when, nodefn;

when   = require("when");
nodefn = require("when/node/function");

function nodeStyleAsyncFunction(callback) {
	if(somethingWrongHappened) {
		callback(error);
	} else {
		callback(null, interestingValue);
	}
}

var deferred = when.defer();
callbackTakingFunction(nodefn.nodeStyleAsyncFunction(deferred.resolver));

deferred.promise.then(function(interestingValue) {
	// Use interestingValue
});
```

Helpers
=======

when/apply
----------

```js
function functionThatAcceptsMultipleArgs(arg1, arg2, arg3) {
    console.log(arg1, arg2, arg3);
}

var functionThatAcceptsAnArray = apply(functionThatAcceptsMultipleArgs);

// Logs 1, 2, 3
functionThatAcceptsAnArray([1, 2, 3]);

```

Helper that allows using callbacks that take multiple args, instead of an array, with `when.all/some/map`:

```js
when.all(arrayOfPromisesOrValues, apply(functionThatAcceptsMultipleArgs));
```

More when/apply [examples on the wiki](https://github.com/cujojs/when/wiki/when-apply).

# Configuration

## Paranoid mode

### PARANOID MODE NO LONGER APPLICABLE

As of 1.6.0, when.js never calls `Object.freeze` due to the v8 performance penalty, so there is no paranoid vs. non-paranoid mode.  If you had disabled paranoid mode using the instructions below, that setting is currently harmless and can be safely removed.

----

By default, the `when` module, and all when.js promises are *frozen* (in enviroments that provide `Object.freeze()`).  This prevents promise consumers from interfering with one another (for example, by replacing a promise's `.then()` method to intercept results), or from modifying `when()`, `when.defer()`, or any other method.  It means that when you write code that depends on when.js, you get what you expect.

However, you may not need that level of paranoia.  For example, you may trust all the code in your application, either because you or your team members wrote it all, or it comes from other trustworthy sources.

## Turning off Paranoid mode

**IMPORTANT:** This is a tradeoff of safety vs. performance.  Please choose carefully for your particular situation!  This setting is checked *once at load time, and never again*.  So, once paranoid mode is enabled (default), or disabled, it cannot be changed at runtime.

Due to a [major performance degredation of frozen objects in v8](http://stackoverflow.com/questions/8435080/any-performance-benefit-to-locking-down-javascript-objects), you can turn off when.js's default paranoid setting, and get a significant speed boost.  In some tests, we've seen as much as a 4x increase *just by not calling Object.freeze*.

Use one of the following to turn off paranoid mode, so that when.js no longer calls `Object.freeze` on any of its internal data structures.

### AMD

Use a module configuration to turn off paranoid mode.  Your AMD loader configuration syntax may vary.  Here are examples for curl.js and RequireJS:

#### curl.js

```js
{
	baseUrl: //...
	packages: [
		{ name: 'when', location: 'path/to/when', main: 'when',
			config: {
				paranoid: false
			}
		}
	]
}
```

#### RequireJS

```js
{
	baseUrl: //...
	config: {
		when: {
			paranoid: false
		},
		// Other module configs ...
	}
}
```

See the [module config section](http://requirejs.org/docs/api.html#config-moduleconfig) of the RequireJS docs for more info and examples.

### Node and RingoJS

Set the `WHEN_PARANOID` environment variable to "false".  For example, depending on your shell:

`export WHEN_PARANOID=false`

**NOTE:** It *must* be the string literal "false".  No other value (0, "no", etc.) will work.

### Script Tag

*Before* loading `when.js` Set `window.when_config.paranoid` to `false`:

```js
window.when_config = { paranoid: false };
```
