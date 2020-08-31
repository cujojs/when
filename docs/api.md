API
===

1. Core
	* [when(x)](#when)
	* [when(x, f)](#when)
	* [when.try(f, ...args)](#whentry)
	* [when.lift(f)](#whenlift)
	* [when.join(...promises)](#whenjoin)
	* [when.promise(resolver)](#whenpromise)
	* [when.resolve(x)](#whenresolve)
	* [when.reject(error)](#whenreject)
	* [when.defer()](#whendefer)
	* [when.isPromiseLike(x)](#whenispromiselike)
1. Promise
	* [promise.done(handleResult, handleError)](#promisedone)
	* [promise.then(onFulfilled)](#promisethen)
	* [promise.spread(onFulfilledArray)](#promisespread)
	* [promise.fold(combine, promise2)](#promisefold)
	* [promise.catch(onRejected)](#promisecatch)
	* [promise.finally(cleanup)](#promisefinally)
	* [promise.yield(x)](#promiseyield)
	* [promise.else(x)](#promiseelse)
	* [promise.tap(onFulfilledSideEffect)](#promisetap)
	* [promise.delay(milliseconds)](#promisedelay)
	* [promise.timeout(milliseconds, reason)](#promisetimeout)
	* [promise.inspect()](#promiseinspect)
	* [promise.with(thisArg)](#promisewith)
	* [promise.progress(onProgress)](#promiseprogress)
1. Arrays
	* [when.all(array)](#whenall)
	* [when.settle(array)](#whensettle)
	* [when.map(array, mapper)](#whenmap)
	* [when.filter(array, predicate)](#whenfilter)
	* [when.reduce(array, reducer)](#whenreduce)
	* [when.reduceRight(array, reducer)](#whenreduceright)
1. Array Races
	* [when.any(array)](#whenany)
	* [when.some(array, n)](#whensome)
1. Infinite Promise Sequences
	* [when.iterate(f, condition, handler, seed)](#wheniterate)
	* [when.unfold(f, condition, handler, seed)](#whenunfold)
1. Objects
	* when/keys
		* [keys.all(object)](#whenkeys-all)
		* [keys.map(object, mapper)](#whenkeys-map)
		* [keys.settle(object)](#whenkeys-settle)
1. Functions
	* when/function
		* [fn.lift(f)](#fnlift)
		* [fn.liftAll(object)](#fnliftall)
		* [fn.call(f, ...args)](#fncall)
		* [fn.apply(f, argsArray)](#fnapply)
	* when/node
		* [node.lift(nodeFunction)](#nodelift)
		* [node.liftAll(object)](#nodeliftall)
		* [node.call(nodeFunction, ...args)](#nodecall)
		* [node.apply(nodeFunction, argsArray)](#nodeapply)
		* [node.bindCallback(promise, nodeback)](#nodebindcallback)
		* [node.liftCallback(callback)](#nodeliftcallback)
		* [node.createCallback(resolver)](#nodecreatecallback)
		* [Support promises and node-style functions](#support-promises-and-node-style-callback-functions)
	* when/callbacks
		* [callbacks.lift(asyncFunction)](#callbackslift)
		* [callbacks.liftAll(object)](#callbacksliftall)
		* [callbacks.call(asyncFunction, ...args)](#callbackscall)
		* [callbacks.apply(asyncFunction, argsArray)](#callbacksapply)
1. [ES6 generators](#es6-generators)
	* when/generator
		* [generator.lift(g)](#generatorlift)
		* [generator.call(g, ...args)](#generatorcall)
		* [generator.apply(g, argsArray)](#generatorapply)
1. Task Execution
	* [when/sequence(tasks, ...args)](#whensequence)
	* [when/pipeline(tasks, ...args)](#whenpipeline)
	* [when/parallel(tasks, ...args)](#whenparallel)
	* [when/poll(task, interval, condition [, initialDelay])](#whenpoll)
1. Limiting Concurrency
	* [when/guard(condition, f)](#whenguard)
	* [Guard conditions](#guard-conditions)
1. [Error types](#error-types)
1. [Debugging promises](#debugging-promises)
1. [Upgrading to 3.0 from 2.x](#upgrading-to-30-from-2x)
1. [Refactoring progress](#refactoring-progress)

# Core

## when()

```js
var promise = when(x);
```

Get a trusted promise for `x`. If `x` is:

* a value, returns a promise fulfilled with `x`
* a promise, returns `x`.
* a foreign thenable, returns a promise that follows `x`


```js
var transformedPromise = when(x, f);
```

Get a trusted promise by transforming `x` with `f`.  If `x` is

* a value, returns a promise fulfilled with `f(x)`
* a promise or thenable, returns a promise that
	* if `x` fulfills, will fulfill with the result of calling `f` with `x`'s fulfillment value.
	* if `x` rejects, will reject with the same reason as `x`

`when()` accepts any promise that provides a *thenable* promise--any object that provides a `.then()` method, even promises that aren't fully Promises/A+ compliant, such as jQuery's Deferred.  It will assimilate such promises and make them behave like Promises/A+.

## when.try

**ALIAS:** when.attempt() for non-ES5 environments

```js
var promise = when.try(f /*, arg1, arg2, ...*/);
```

Calls `f` with the supplied arguments, returning a promise for the result.  The arguments may be promises, in which case, `f` will be called after they have fulfilled.  The returned promise will fulfill with the successful result of calling `f`.  If any argument is a rejected promise, or if `f` fails by throwing or returning a rejected promise, the returned promise will also be rejected.

This can be a great way to kick off a promise chain when you want to return a promise, rather than creating a one manually.

```js
// Try to parse the JSON, capture any failures in the returned promise
// (This will never throw)
return when.try(JSON.parse, jsonString);
```

### See also:
* [when.lift](#whenlift)
* [when/node call](#nodecall)
* [when/node apply](#nodeapply)

## when.lift

```js
var g = when.lift(f);
```

Creates a "promisified" version of `f`, which always returns promises (`g` will never throw) and accepts promises or values as arguments.  In other words, calling `g(x, y z)` is like calling `when.try(f, x, y, z)` with the added convenience that once you've created `g` you can call it repeatedly or pass it around like any other function.  In addition, `g`'s thisArg will behave in a predictable way, like any other function (you can `.bind()` it, or use `.call()` or `.apply()`, etc.).

Like `when.try`, lifting functions provides a convenient way start promise chains without having to explicitly create promises, e.g. `new Promise`

```js
// Call parse as often as you need now.
// It will always return a promise, and will never throw
// Errors will be captured in the returned promise.
var jsonParse = when.lift(JSON.parse);

// Now use it wherever you need
return jsonParse(jsonString);
```

`when.lift` correctly handles `this`, so object methods can be lifted as well:

```js
var parser = {
	reviver: ...
	parse: when.lift(function(str) {
		return JSON.parse(str, this.reviver);
	});
};

// Now use it wherever you need
return parser.parse(jsonString);
```

### See also:
* [when.try](#whentry)
* [when/node lift](#nodelift)
* [when/node liftAll](#nodeliftall)

## when.join

```js
var joinedPromise = when.join(promiseOrValue1, promiseOrValue2, ...);
```

Return a promise that will fulfill only once *all* the inputs have fulfilled.  The value of the returned promise will be an array containing the values of each of the inputs.

If any of the input promises is rejected, the returned promise will be rejected with the reason from the first one that is rejected.

```js
// largerPromise will resolve to the greater of two eventual values
var largerPromise = when.join(promise1, promise2).then(function (values) {
	return values[0] > values[1] ? values[0] : values[1];
});
```

### See also:
* [when.all](#whenall) - resolving an Array of promises

## when.promise

```js
var promise = when.promise(resolver);
```

Create a [Promise](#promise), whose fate is determined by running the supplied resolver function.  The resolver function will be called synchronously, with 3 arguments:

```js
var promise = when.promise(function(resolve, reject, notify) {
	// Do some work, possibly asynchronously, and then
	// resolve or reject.

	// DEPRECATED: You can notify of progress events
	// along the way if you want/need.

	resolve(awesomeResult);
	// or resolve(anotherPromise);
	// or reject(nastyError);
});
```

* `resolve(promiseOrValue)` - Primary function that seals the fate of the returned promise. Accepts either a non-promise value, or another promise.
	* When called with a non-promise value, fulfills `promise` with that value.
	* When called with another promise, e.g. `resolve(otherPromise)`, `promise`'s fate will be equivalent to that that of `otherPromise`.
* `reject(reason)` - function that rejects `promise`.
* `notify(update)` - **DEPRECATED** function that issues progress events for `promise`.  See [Refactoring progress](#refactoring-progress) for more info.

## when.resolve

```js
var resolved = when.resolve(x);
```

Get a promise for the supplied `x`. If `x` is already a trusted promise, it is returned.  If `x` is a value, the returned promise will be fulfilled with `x`.  If `x` is a thenable, the returned promise will follow `x`, adopting its eventual state (fulfilled or rejected).

## when.reject

```js
var rejected = when.reject(error);
```

Create a rejected promise with the supplied error as the rejection reason.

**DEPRECATION WARNING:** In when.js 2.x, error is allowed to be a promise for an error.  In when.js 3.0, error will always be used verbatim as the rejection reason, even if it is a promise.

## when.defer

```js
var deferred = when.defer();
```

**Note:** The use of `when.defer` is discouraged.  In most cases, using [`when.promise`](#whenpromise), [`when.try`](#whentry), or [`when.lift`](#whenlift) provides better separation of concerns.

Create a `{promise, resolve, reject, notify}` tuple.  In certain (rare) scenarios it can be convenient to have access to both the `promise` and it's associated resolving functions.

The deferred API:

```js
var promise = deferred.promise;

// Resolve the promise, x may be a promise or non-promise
deferred.resolve(x)

// Reject the promise with error as the reason
deferred.reject(error)

// DEPRECATED Notify promise consumers of a progress update
deferred.notify(x)
```

Note that `resolve`, `reject`, and `notify` all become no-ops after either `resolve` or `reject` has been called the first time.

One common use case for creating a deferred is adapting callback-based functions to promises.  In those cases, it's preferable to use the [when/callbacks](#asynchronous-functions) module to [call](#callbackscall) or [lift](#callbackslift) the callback-based functions instead.  For adapting node-style async functions, use the [when/node](#node-style-asynchronous-functions) module.

## when.isPromiseLike

```js
var is = when.isPromiseLike(x);
```

Return true if `x` is an object or function with a `then` method.  It does not distinguish trusted when.js promises from other "thenables" (e.g. from some other promise implementation).

Using `isPromiseLike` is discouraged.  In cases where you have an `x` and don't know if it's a promise, typically the best thing to do is to cast it: `var trustedPromise = when(x);` and then use `trustedPromise`.


# Promise

A promise is a proxy for a value that isn't available yet allowing you to interact with it as if it is.

## promise.done

```js
promise.done(handleValue); // returns undefined
```

The simplest API for interacting with a promise, `done` consumes the promise's ultimate value if it fulfills, or causes a fatal error with a loud stack trace if it rejects.

```js
promise.done(handleValue, handleError); // returns undefined
```

Consume the promise's ultimate value if the promise fulfills, or handle the ultimate error.  It will cause a fatal error if either `handleValue` or `handleError` throw or return a rejected promise.

Since `done`'s purpose is consumption rather than transformation, `done` always returns `undefined`.

One golden rule of promise error handling is:

Either `return` the promise, thereby *passing the error-handling buck* to the caller, or call `done` and *assuming responsibility for errors*.

### See also
* [promise.then vs. promise.done](#promisethen-vs-promisedone)
* [promise.then](#promisethen)

## promise.then

```js
var transformedPromise = promise.then(onFulfilled);
```

[Promises/A+ `then`](http://promisesaplus.com).  *Transforms* a promise's value by applying a function to the promise's fulfillment value.  Returns a new promise for the transformed result.

```js
var transformedPromise = promise.then(onFulfilled, onRejected);
```

`then` may also be used to recover from intermediate errors. However, [`promise.catch`](#promisecatch) is almost always a better, and more readable choice.  When `onRejected` is provided, it only handles errors from `promise`, and *will not* handle errors thrown by `onFulfilled`.  Compare:

```js
// Using only then(): onRejected WILL NOT handle errors thrown by onFulfilled
var transformedPromise = promise
	.then(onFulfilled, onRejected);

// Using catch(): onRejected will handled errors thrown by onFulfilled
var transformedPromise = promise
	.then(onFulfilled)
	.catch(onRejected);

// Using catch() is equivalent to:
var transformedPromise = promise
	.then(onFulfilled)
	.then(void 0, onRejected);
```

**DEPRECATED**: Progress events are deprecated and will be removed in a future release.  Until that release.  See [Refactoring progress](#refactoring-progress).

```js
// Deprecated use of then() and promise.progress() to listen for progress events

var transformedPromise = promise.then(onFulfilled, onRejected, onProgress);
// or
var transformedPromise = promise
	.progress(onProgress)
	.then(onFulfilled)
	.catch(onRejected)
```

`then` arranges for:

* `onFulfilled` to be called with the value after `promise` is fulfilled, or
* `onRejected` to be called with the rejection reason after `promise` is rejected.
* **DEPRECATED**: `onProgress` to be called with any progress updates issued by `promise`. See [Refactoring progress](#refactoring-progress).

A promise makes the following guarantees about handlers registered in the same call to `.then()`:

1. Only one of `onFulfilled` or `onRejected` will be called, never both.
1. `onFulfilled` and `onRejected` will never be called more than once.
1. `onProgress` may be called zero or more times.

### See also
* [Promises/A+](http://promisesaplus.com) for extensive information on the behavior of `then`.
* [promise.done](#promisedone)
* [promise.spread](#promisespread)
* [promise.progress](#promiseprogress)

## promise.spread

```js
var transformedPromise = promise.spread(onFulfilledArray);
```

Similar to [`then`](#promisethen), but calls `onFulfilledArray` with promise's value, which is assumed to be an array, as its argument list.  It will also deeply resolve promises within the array.
  
It's equivalent to:

```js
// Wrapping onFulfilledArray
when.all(promise).then(function(array) {
	return onFulfilledArray.apply(undefined, array);
});
```

### See also
* [when.all](#whenall)

## promise.fold

```js
var resultPromise = promise2.fold(combine, promise1)
```

Combine `promise1` and `promise2` to produce a `resultPromise`.  The `combine` function will be called once both `promise1` and `promise2` have fulfilled: `combine(promise1, promise2)`, and like `then` et al, it may return a promise or a value.

Just as `promise.then` allows you to easily re-use existing one-argument functions to transform promises, `promise.fold` allows you to reuse two-argument functions.  It can also be useful when you need to thread one extra piece of information into a promise chain, *without* having to capture it in a closure or use `promise.with`.

For, example, with an existing `sum` function, you can easily sum the value of two promises:

```js
function sum(x, y) {
	return x + y;
}

var promiseFor3 = when(3);

var promiseFor5 = promiseFor3.fold(sum, promiseFor2);

// Of course, it accepts values as well:
var promiseFor5 = promiseFor3.fold(sum, 2);
```

Or get object properties or array values:

```js
function get(key, object) {
	return object[key];
}

when({ name: 'Bob' })
	.fold(get, 'name')
	.done(console.log); // logs 'Bob'

when(['a', 'b', 'c'])
	.fold(get, 1)
	.done(console.log); // logs 'b'
```

In both cases, `sum` and `get` are generic, *reusable* functions, and no closures were required.

## promise.catch

**ALIAS:** otherwise() for non-ES5 environments

```js
var recoveredPromise = promise.catch(onRejected);
```

In it's simplest form, `catch` arranges to call `onRejected` on the promise's rejection reason if it is rejected.

```js
var recoveredPromise = promise.catch(predicate, onRejected);
```

If you also supply a `predicate`, you can `catch` only errors matching the predicate.  This allows much more precise error handling.  The `predicate` can be either an `Error` constructor, like `TypeError`, `ReferenceError`, or any custom error type (its `prototype` must be `instanceof Error`), or it can be a function that returns a boolean.

```js
promise.then(function() {
	throw new CustomError('oops!');
}).catch(CustomError, function(e) {
	// Only catch CustomError instances
	// all other types of errors will propagate automatically
}).catch(function(e) {
	// Catch other errors
})
```

Doing this in synchronous code is more clumsy, requiring `instanceof` checks inside a `catch` block:

```js
try {
	throw new CustomError('oops!');
} catch(e) {
	if(e instanceof CustomError) {
		// Handler CustomError instances
	} else {
		// Handle other errors
	}
}
```

### See also:
* [promise.finally](#promisefinally)

## promise.finally

**ALIAS:** `ensure()` for non-ES5 environments

```js
var promise2 = promise1.finally(cleanup);
```

Finally allows you to execute "cleanup" type tasks in a promise chain.  It arranges for `cleanup` to be called, *with no arguments*, when `promise1` is either fulfilled or rejected.  It behaves similarly the synchronous `finally` statement:

* If `promise1` fulfills, and `cleanup` returns successfully, `promise2` will fulfill with the same value as `promise1`.
* If `promise1` rejects, and `cleanup` returns successfully, `promise2` will reject with the same reason as `promise1`.
* If `promise1` rejects, and `cleanup` throws or returns a rejected promise, `promise2` will reject with the thrown exception or rejected promise's reason.

When combined with `promise.catch`, `promise.finally` allows you to write code that is similar to the familiar synchronous `catch`/`finally` pair.  Consider the following synchronous code:

```js
try {
  return doSomething(x);
} catch(e) {
	return handleError(e);
} finally {
	cleanup();
}
```

Using `promise.finally`, similar asynchronous code (with `doSomething()` that returns a promise) can be written:

```js
return doSomething()
	.catch(handleError)
	.finally(cleanup);
```

### See also:
* [promise.catch](#promisecatch) - intercept a rejected promise

## promise.yield

```js
originalPromise.yield(promiseOrValue);
```

Returns a new promise:

1. If `originalPromise` is rejected, the returned promise will be rejected with the same reason
2. If `originalPromise` is fulfilled, then it "yields" the resolution of the returned promise to promiseOrValue, namely:
    1. If `promiseOrValue` is a value, the returned promise will be fulfilled with `promiseOrValue`
    2. If `promiseOrValue` is a promise, the returned promise will be:
	    - fulfilled with the fulfillment value of `promiseOrValue`, or
	    - rejected with the rejection reason of `promiseOrValue`

In other words, it's much like:

```js
originalPromise.then(function() {
	return promiseOrValue;
});
```

### See also:
* [promise.else](#promiseelse) - return a default value when promise rejects

## promise.else

**ALIAS:** `orElse()` for non-ES5 environments

```js
var p1 = doAsyncOperationThatMightFail();
return p1.else(defaultValue);
```

If a promise is rejected, `else` catches the rejection and resolves the returned promise with a default value. This is a shortcut for manually `catch`ing a promise and returning a different value, as such:

```js
var p1 = doAsyncOperationThatMightFail();
return p1.catch(function() {
    return defaultValue;
});
```

### See also:
* [promise.catch](#promisecatch) - intercept a rejected promise
* [promise.tap](#promisetap) - execute a side effect in a promise chain
* [promise.yield](#promiseyield) - execute a side effect in a promise chain

## promise.tap

```js
var promise2 = promise1.tap(onFulfilledSideEffect);
```

Executes a function as a side effect when `promise` fulfills.  Returns a new promise:

1. If `promise` fulfills, `onFulfilledSideEffect` is executed:
	- If `onFulfilledSideEffect` returns successfully, the promise returned by `tap` fulfills with `promise`'s original fulfillment value.  That is, `onfulfilledSideEffect`'s result is discarded.
	- If `onFulfilledSideEffect` throws or returns a rejected promise, the promise returned by `tap` rejects with the same reason.
2. If `promise` rejects, `onFulfilledSideEffect` is *not* executed, and the promise returned by `tap` rejects with `promise`'s rejection reason.

These are equivalent:

```js
// Using only .then()
promise.then(function(x) {
	return when(doSideEffectsHere(x)).yield(x);
});

// Using .tap()
promise.tap(doSideEffectsHere);
```

### See also:
* [promise.catch](#promisecatch) - intercept a rejected promise
* [promise.else](#promiseelse) - return a default value when promise rejects

## promise.delay

```js
var delayedPromise = promise.delay(milliseconds);
```

Create a new promise that will, after `milliseconds` delay, fulfill with the same value as `promise`.  If `promise` rejects, `delayedPromise` will be rejected immediately.

```js
var delayed;

// delayed is a pending promise that will become fulfilled
// in 1 second with the value "hello"
delayed = when('hello').delay(1000);

// delayed is a pending promise that will become fulfilled
// 1 second after anotherPromise resolves, or will become rejected
// *immediately* after anotherPromise rejects.
delayed = promise.delay(1000);

// Do something 1 second after promise resolves
promise.delay(1000).then(doSomething).catch(handleRejection);
```

### See also:
* [promise.timeout](#promisetimeout)

## promise.timeout

```js
var timedPromise = promise.timeout(milliseconds, reason);
```

Create a new promise that will reject with a [`TimeoutError`](#timeouterror) or a custom `reason` after a timeout if `promise` does not fulfill or reject beforehand.

```js
var node = require('when/node');

// Lift fs.readFile so it returns promises
var readFile = node.lift(fs.readFile);

// Try to read the file, but timeout if it takes too long
function readWithTimeout(path) {
	return readFile(path).timeout(500);
}
```

You can [pattern-match using `catch`](#promisecatch) to specifically handle `TimeoutError`s:

```js
var when = require('when');

var p = readWithTimeout('/etc/passwd')
	.catch(when.TimeoutError, handleTimeout) // handle only TimeoutError
	.catch(handleFailure) // handle other errors
```

### See also:
* [promise.delay](#promisedelay)

## promise.inspect

```js
var status = promise.inspect();
```

Returns a snapshot descriptor of the current state of `promise`.  This descriptor is *not live* and will not update when `promise`'s state changes.  The descriptor is an object with the following properties.  When promise is:

* pending: `{ state: 'pending' }`
* fulfilled: `{ state: 'fulfilled', value: <promise's fulfillment value> }`
* rejected: `{ state: 'rejected', reason: <promise's rejection reason> }`

While there are use cases where synchronously inspecting a promise's state can be helpful, the use of `inspect` is discouraged.  It is almost always preferable to simply use `when()` or `promise.then` to be notified when the promise fulfills or rejects.

### See also:
* [when.settle](#whensettle) - settling an Array of promises

## promise.with

**ALIAS:** `withThis()` for non-ES5 environments

```js
var boundPromise = promise.with(object);
```

Creates a new promise that follows `promise`, but which will invoke its handlers with their `this` set to `object`.  Normally, promise handlers are invoked with no specific `thisArg`, so `with` can be very useful when bridging promises to object-oriented patterns and libraries.

**NOTE:** Promises returned from `with`/`withThis` are NOT Promises/A+ compliant, specifically violating 2.2.5 (http://promisesaplus.com/#point-41)

For example:

```js
function Thing(value, message) {
	this.value = value;
	this.message = message;
}

Thing.prototype.doSomething = function(x) {
	var promise = doAsyncStuff(x);
	return promise.with(this) // Set thisArg to this thing instance
		.then(this.addValue)  // Works since addValue will have correct thisArg
		.then(this.format);   // all subsequent promises retain thisArg
};

Thing.prototype.addValue = function(y) {
	return this.value + y;
};

Thing.prototype.format = function(result) {
	return this.message + result;
};

// Using it
var thing = new Thing(41, 'The answer is ');

thing.doSomething(1)
    .with(console) // Re-bind thisArg now to console
	.then(console.log); // Logs 'The answer is 42'

```

All promises created from `boundPromise` will also be bound to the same thisArg until `with` is used to re-bind or *unbind* it.  In the previous example, the promise returned from `thing.doSomething` still has its thisArg bound to `thing`.  That may not be what you want, so you can *unbind* it just before returning:

```js
Thing.prototype.doSomething = function(x) {
	var promise = doAsyncStuff(x);
	return promise.with(this)
		.then(this.addValue)
		.then(this.format)
		.with(); // Unbind thisArg
};
```

## promise.progress

**DEPRECATED** Progress events are deprecated. See [Refactoring progress](#refactoring-progress)

```js
promise.progress(onProgress);
```

Registers a handler for progress updates from `promise`.  It is a shortcut for:

```js
promise.then(void 0, void 0, onProgress);
```

### Notes on Progress events

Progress events are not specified in Promises/A+ and are optional in Promises/A.  They have proven to be useful in practice, but unfortunately, they are also underspecified, and there is no current *de facto* or agreed-upon behavior in the promise implementor community.

In when.js, progress events will be propagated through a promise chain:

1. In the same way as resolution and rejection handlers, your progress handler *MUST* return a progress event to be propagated to the next link in the chain.  If you return nothing, *undefined will be propagated*.
1. Also in the same way as resolutions and rejections, if you don't register a progress handler (e.g. `.then(handleResolve, handleReject /* no progress handler */)`), the update will be propagated through.
1. **This behavior will likely change in future releases:** If your progress handler throws an exception, the exception will be propagated to the next link in the chain. The best thing to do is to ensure your progress handlers do not throw exceptions.
	1. **Known Issue:** If you allow an exception to propagate and there are no more progress handlers in the chain, the exception will be silently ignored. We're working on a solution to this.

This gives you the opportunity to *transform* progress events at each step in the chain so that they are meaningful to the next step.  It also allows you to choose *not* to transform them, and simply let them propagate untransformed, by not registering a progress handler.

Here is an example:

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
d.notify(update);

// Results in:
// logProgress(1);
// logProgress(2);
```

# Arrays

## when.all

```js
var promise = when.all(array)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Return a promise that will resolve only once all the items in `array` have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the items in `array`.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

### See also:
* [when.join](#whenjoin)
* [when.settle](#whensettle)

## when.map

```js
var promise = when.map(array, mapper)
```

Where:

* array is an Array or promise for an Array, which may contain promises and/or values

Traditional array map function, similar to `Array.prototype.map()`, but allows input to contain promises and/or values, and mapFunc may return either a value or a promise. The order of items in the input array and the results will match, however, `when.map` allows mapping to proceed opportunistically as promises in the array fulfill, making it extremely efficient.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

The map function should have the signature:

```js
mapFunc(value:*, index:Number):*
```

Where:

* `value` fulfilled value
* `index` array index of `value`

## when.filter

```js
var promise = when.filter(array, predicate);
```

Where:

* array is an Array or promise for an Array, which may contain promises and/or values

Filters the input array, returning a promise for the filtered array.  The filtering `predicate` may return a boolean or promise for boolean.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

The predicate should have the signature:

```js
predicate(value:*, index:Number):boolean
```

Where:

* `value` fulfilled value
* `index` array index of `value`

## when.reduce
## when.reduceRight

```js
var promise = when.reduce(array, reducer [, initialValue])
var promise = when.reduceRight(array, reducer [, initialValue])
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Traditional array reduce function, similar to `Array.prototype.reduce()` and `Array.prototype.reduceRight()`, but input may contain promises and/or values, and reduceFunc may return either a value or a promise, *and* initialValue may be a promise for the starting value.  Both `when.reduce` and `when.reduceRight` proceed in index order (ascending or descending, respectively), without any overlapping--in contrast to [`when.map`](#whenmap) which proceeds opportunistically.

The reduce function should have the signature:

```js
reducer(currentResult, value, index)
```

Where:

* `currentResult` is the current accumulated reduce value
* `value` is the fully resolved value at `index` in `array`
* `index` is the *basis* of `value` ... practically speaking, this is the array index of the array corresponding to `value`

```js
// sum the eventual values of several promises
var sumPromise = when.reduce(inputPromisesOrValues, function (sum, value) {
	return sum += value;
}, 0);
```

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

## when.settle

```js
var promise = when.settle(array);
```

Returns a promise for an array containing the same number of elements as the input array.  Each element is a descriptor object describing of the outcome of the corresponding element in the input.  The returned promise will only reject if `array` itself is a rejected promise.  Otherwise, it will always fulfill with an array of descriptors.  This is in contrast to [when.all](#whenall), which will reject if any element of `array` rejects.

If the corresponding input promise is:

* fulfilled, the descriptor will be: `{ state: 'fulfilled', value: <fulfillmentValue> }`
* rejected, the descriptor will be: `{ state: 'rejected', reason: <rejectionReason> }`

```js
// Process all successful results, and also log all errors

// Input array
var array = [when.reject(1), 2, when(3), when.reject(4)];

// Settle all inputs
var settled = when.settle(array);

// Logs 1 & 4 and processes 2 & 3
settled.then(function(descriptors) {
	descriptors.forEach(function(d) {
		if(d.state === 'rejected') {
			logError(d.reason);
		} else {
			processSuccessfulResult(d.value);
		}
	});
});
```

### See also:
* [when.all](#whenall)
* [promise.inspect](#inspect)
* [keys.settle](#whenkeys-settle)

# Objects

the `when/keys` module provides `all()`, and `map()` for working with object keys, for the times when organizing promises in a hash using object keys is more convenient than using an array.

## when/keys all

```js
var promise = keys.all(object)
```

Where:

* object is an Object *or a promise for an Object*, whose keys represent promises and/or values.

Return a promise that will resolve only once *all* the items in `object` have resolved.  The resolution value of the returned promise will be an object containing the resolved key-value pairs of each of the items in `object`.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

### See also:
* [when.all](#whenall)

## when/keys map

```js
var promise = keys.map(object, mapper)
```

Where:

* object is an Object *or a promise for an Object*, whose keys represent promises and/or values.

Similar to `when.map`, but for object keys, returns a promise for the key-mappedValue pairs by applying `mapper` to every value.  `mapper` may return either a promise or a value.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

The map function should have the signature:

```js
mapFunc(value:*, key:String):*
```

Where:

* `value` fulfilled value
* `key` key corresponding to `value`

### See also:
* [when.map](#whenmap)

## when/keys settle

```js
var promise = keys.settle(object)
```

Where
* object is an Object whose keys represent promises and/or values.

Similar to `when.settle`, but for object keys, returns a promise for the key-value pairs with a resultant descriptor object for each key. The returned promise should always fulfill.

### See also:
* [when.settle](#whensettle)

# Array Races

The *competitive race* pattern may be used if one or more of the entire possible set of *eventual outcomes* are sufficient to resolve a promise.

## when.any

```js
var promise = when.any(array)
```

A competitive race that allows one winner.  The returned promise will:

* fulfill as soon as any one of the input promises fulfills, with the value of the fulfilled input promise, *or*
* reject:
	* with a `RangeError` if the input array is empty--i.e. it is impossible to have one winner.
	* with an array of all the rejection reasons, if the input array is non-empty, and *all* input promises reject.

### See also:
* [when.race](#whenrace)
* [when.some](#whensome)

## when.some

**DEPRECATED**

```js
var promise = when.some(array, n)
```

A competitive race that requires `n` winners.  The returned promise will

* fulfill when `n` promises are fulfilled with an array containing the values of the fulfilled input promises, *or*
* reject:
	* with a `RangeError` if the input contains fewer than `n` items--i.e. it is impossible to have `n` winners.
	* with an array containing the reasons of the rejected input promises when it becomes impossible for `n` promises to become fulfilled (ie when `(array.length - n) + 1` reject).

```js
// ping all of the p2p servers and fail if at least two don't respond
var remotes = [ping('p2p.cdn.com'), ping('p2p2.cdn.com'), ping('p2p3.cdn.com')];
when.some(remotes, 2).done(itsAllOk, failGracefully);
```

### See also:
* [when.any](#whenany)

## when.race

```js
var promise = when.race(array);
```

A competitive race to settle. The returned promise will settle in the same way as the earliest promise in `array` to settle.  That is, it will

* fulfill if the earliest promise in array fulfills, with the same value, *or*
* reject if the earliest promise in array rejects, with the same reason.

**WARNING:** As per the ES6 spec, the returned promise will *remain pending forever* if `array` is empty.

### See also:
* [when.any](#whenany)

# Infinite Promise Sequences

[when.reduce](#whenreduce), [when/sequence](#whensequence), and [when/pipeline](#whenpipeline) are great ways to process asynchronous arrays of promises and tasks.  Sometimes, however, you may not know the array in advance, or may not need or want to process *all* the items in the array.  For example, here are a few situations where you may not know the bounds:

1. You need to process a queue to which items are still being added as you process it
1. You need to execute a task repeatedly until a particular condition becomes true
1. You need to selectively process items in an array, rather than all items

In these cases, you can use `when/iterate` and `when/unfold` to iteratively and asynchronously process items until a particular predicate is true, or even forever without blocking other code.

## when.iterate

```js
var promise = when.iterate(f, predicate, handler, seed);
```

Generates a potentially infinite stream of promises by repeatedly calling `f` until `predicate` becomes true.

Where:
* `f` - function that, given a seed, returns the next value or a promise for it.
* `predicate` - function that receives the current iteration value, and should return truthy when the iterating should stop
* `handler` - function that receives each value as it is produced by `f`. It may return a promise to delay the next iteration.
* `seed` - initial value provided to the handler, and first `f` invocation. May be a promise.

### Examples

Here is a trivial example of counting up to any arbitrary number using promises and delays. Note that this "iteration" is asynchronous and will not block other code.  It stores no intermediate arrays in memory, and will never blow the call stack.


```js
// Logs
// 0
// 1
// 2
// ...
// 100000000000
when.iterate(function(x) {
	return x+1;
}, function(x) {
	// Stop when x >= 100000000000
	return x >= 100000000000;
}, function(x) {
	console.log(x);
}, 0).done();
```

Which becomes even nicer with [ES6 arrow functions](http://tc39wiki.calculist.org/es6/arrow-functions/):

```js
when.iterate(x => x+1, x => x >= 100000000000, x => console.log(x), 0).done();
```

## when.unfold

```js
var promise = when.unfold(unspool, predicate, handler, seed);
```

Similar to [`when/iterate`](#wheniterate), `when.unfold` generates a potentially infinite stream of promises by repeatedly calling `unspool` until `predicate` becomes true.  `when.unfold` allows you to thread additional state information through the iteration.

Where:
* `unspool` - function that, given a seed, returns a `[valueToSendToHandler, newSeed]` pair. May return an array, array of promises, promise for an array, or promise for an array of promises.
* `predicate` - function that receives the current seed, and should return truthy when the unfold should stop
* `handler` - function that receives the `valueToSendToHandler` of the current iteration. This function can process `valueToSendToHandler` in whatever way you need.  It may return a promise to delay the next iteration of the unfold.
* `seed` - initial value provided to the first `unspool` invocation. May be a promise.

### Examples

This example generates random numbers at random intervals for 10 seconds.

The `predicate` could easily be modified (to `return false;`) to generate random numbers *forever*.  This would not overflow the call stack, and would not starve application code since it is asynchronous.

```js
var when = require('when');

var end = Date.now() + 10000;
var start = Date.now();

// Generate random numbers at random intervals!
// Note that we could generate these forever, and never
// blow the call stack, nor would we starve the application
function unspool(seed) {
	// seed is passed in, although for this example, we don't need it

	// Return a random number as the value, and the time it was generated
	// as the new seed
	var next = [Math.random(), Date.now()];

	// Introduce a delay, just for fun, to show that we can return a promise
	return when(next).delay(Math.random() * 1000);
}

// Stop after 10 seconds
function predicate(time) {
	return time > end;
}

function log(value) {
	console.log(value);
}

when.unfold(unspool, predicate, log, start).then(function() {
	console.log('Ran for', Date.now() - start, 'ms');
}).done();
```

Which again becomes quite compact with [ES6 arrow functions](http://tc39wiki.calculist.org/es6/arrow-functions/):

```js
when.unfold(unspool, time => time > end, x => console.log(x), start)
	.then(() => console.log('Ran for', Date.now() - start, 'ms'))
	.done();
```

This example iterates over files in a directory, mapping each file to the first line (or first 80 characters) of its content.  It uses a `predicate` to terminate early, which would not be possible with `when.map`.

Notice that, while the pair returned by `unspool` is an Array (not a promise), it does *contain* a promise as it's 0th element.  The promise will be resolved by the `unfold` machinery.

Notice also the use of `when/node`'s [`call()`](#node-style-asynchronous-functions) to call Node-style async functions (`fs.readdir` and `fs.readFile`), and return a promise instead of requiring a callback.  This allows node-style functions can be promisified and composed with other promise-aware functions.

```js
var when = require('when');
var node = require('when/node');

var fs = node.liftAll(require('fs'));

// Lifted fs methods return promises
var files = fs.readdir('.');

function unspool(files) {
  // Return the pair [<*promise* for contents of first file>, <remaining files>]
	// the first file's contents will be handed to printFirstLine()
	// the remaining files will be handed to condition(), and then
	// to the next call to unspool.
	// So we are iteratively working our way through the files in
	// the dir, but allowing condition() to stop the iteration at
	// any point.
	var file, content;

	file = files[0];
	content = fs.readFile(file)
		.catch(function(e) {
			return '[Skipping dir ' + file + ']';
		});
	return [content, files.slice(1)];
}

function predicate(remaining) {
	// This could be any test we want.  For fun, stop when
	// the next file name starts with a 'p'.
	return remaining[0].charAt(0) === 'p';
}

function printFirstLine(content) {
	// Even though contents was a promise in unspool() above,
	// when/unfold ensures that it is fully resolved here, i.e. it is
	// not a promise any longer.
	// We can do any work, even asynchronous work, we need
	// here on the current file

	// Node fs returns buffers, convert to string
	content = String(content);

	// Print the first line, or only the first 80 chars if the fist line is longer
	console.log(content.slice(0, Math.min(80, content.indexOf('\n'))));
}

when.unfold(unspool, predicate, printFirstLine, files).done();
```

# Task Execution

These modules allow you to execute tasks in series or parallel.  Each module takes an Array of task functions (or a *promise* for an Array), executes the tasks, and returns a promise that resolves when all the tasks have completed.

## when/sequence

```js
var sequence = require('when/sequence');

var resultsPromise = sequence(arrayOfTasks, arg1, arg2 /*, ... */);
```

Run an array of tasks in sequence, without overlap.  Each task will be called with the arguments passed to `when.sequence()`, and each may return a promise or a value.

When all tasks have completed, the returned promise will resolve to an array containing the result of each task at the corresponding array position.  The returned promise will reject when any task throws or returns a rejection.

## when/pipeline

```js
var pipeline = require('when/pipeline');

var resultsPromise = pipeline(arrayOfTasks, arg1, arg2 /*, ... */);
```

Run an array of tasks in sequence, without overlap, similarly to [when/sequence](#whensequence).  The *first task* (e.g. `arrayOfTasks[0]`) will be called with the arguments passed to `when.pipeline()`, and each subsequence task will be called with the result of the previous task.

Again, each may return a promise or a value.  When a task returns a promise, the fully resolved value will be passed to the next task.

When all tasks have completed, the returned promise will resolve to the result of the last task.  The returned promise will reject when any task throws or returns a rejection.

## when/parallel

```js
var parallel = require('when/parallel');

var resultsPromise = parallel(arrayOfTasks, arg1, arg2 /*, ... */);
```

Run an array of tasks in "parallel".  The tasks are allowed to execute in any order, and may interleave if they are asynchronous. Each task will be called with the arguments passed to `when.parallel()`, and each may return a promise or a value.

When all tasks have completed, the returned promise will resolve to an array containing the result of each task at the corresponding array position.  The returned promise will reject when any task throws or returns a rejection.

## when/poll

```js
var poll = require('when/poll');

var resultPromise = poll(task, interval, condition /*, initialDelay */);
```

Where:

* `task` - function to be called periodically
* `interval` - interval between calls to `task`. It may be a number *or* a function that returns a promise. If it's a function, the next polling iteration will wait until the promise fulfills.
* `condition` - function that evaluates each result of `task`. Polling will continue until it returns a truthy value.
* `initialDelay` - if provided and truthy, the first execution of `task` will be delayed by `interval`.  If not provided, or falsey, the first execution of `task` will happen as soon as possible.

Execute a task (`task`) repeatedly at the specified `interval`, until the `condition` function returns true.  The `resultPromise` will be resolved with the most recent value returned from `task`.  If `task` fails (throws an exception or returns a rejected promise) before `condition` returns true, the `resultPromise` will be rejected.

# Interacting with non-promise code

These modules are aimed at dampening the friction between code that is based on promises and code that follows more conventional approaches to make asynchronous tasks and/or error handling. By using them, you are more likely to be able to reuse code that already exists, while still being able to reap the benefits of promises on your new code.

## Synchronous functions

The `when/function` module contains functions for calling and adapting "normal" functions (i.e. those that take plain values, return plain values, and throw exceptions on errors). By calling those functions with `fn.call` and `fn.apply`, or by creating a new function with `fn.lift`, the return value will always be a promise, and thrown exceptions will be turned into rejections. As a bonus, promises given as arguments will be transparently resolved before the call.

### fn.lift

```js
var promiseFunction = fn.lift(normalFunction);

// Deprecated: using lift to partially apply while lifting
var promiseFunction = fn.lift(normalFunction, arg1, arg2/* ...more args */);
```

When the same function will be called through `fn.call()` or `fn.apply()` multiple times, it can be more efficient to lift it create a wrapper function that has promise-awareness and exposes the same behavior as the original function. That's what `fn.lift()` does: It takes a normal function and returns a new, promise-aware version of it.

Note: Use [`when.lift`](#whenlift) instead: `when.lift` is equivalent to, but also slightly faster than `fn.lift` when used without the (now deprecated) partial application feature.

```js
var when = require('when');
var fn   = require('when/function');

function setText(element, text) {
	element.text = text;
}

function getMessage() {
	// Async function that returns a promise
}

var element = {};

// Resolving the promise ourselves
getMessage().then(function(message) {
	setText(element, message);
});

// Using fn.call()
fn.call(setText, element, getMessage());

// Creating a lifted function using fn.lift()
var promiseSetText = fn.lift(setText);
promiseSetText(element, getMessage());

// Partial application
var setElementMessage = fn.lift(setText, element);
setElementMessage(getMessage());
```

### fn.liftAll

```js
var liftedApi = fn.liftAll(srcApi);

var liftedApi = fn.liftAll(srcApi, transform);

var destApi = fn.liftAll(srcApi, transform, destApi);
```

Lifts all the methods of a source object, returning a new object with all the lifted methods.  The optional `transform` function allows you to rename or otherwise customize how the lifted functions are added to the returned object.  If `destApi` is provided, lifted methods will be added to it, instead of to a new object, and `destApi` will be returned.

### fn.call

```js
var promisedResult = fn.call(normalFunction, arg1, arg2/* ...more args */);
```

A parallel to the `Function.prototype.call` function, that gives promise-awareness to the function given as first argument.

```js
var when = require('when');
var fn   = require('when/function');

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
var promiseForFive = when(5);
fn.call(divideNumbers, 20, promiseForFive).then(console.log);

// Prints "Can't divide by zero!"
fn.call(divideNumbers, 10, 0).then(console.log, console.error);
```

### fn.apply

```js
var promisedResult = fn.apply(normalFunction, [arg1, arg2/* ...more args */]);
```

`fn.apply` is to [`fn.call`](#fncall) as `Function.prototype.apply` is to `Function.prototype.call`: what changes is the way the arguments are taken.  While `fn.call` takes the arguments separately, `fn.apply` takes them as an array.

```js
var when = require('when');
var fn   = require('when/function');

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

### fn.compose

```js
var composedFunc = fn.compose(func1, func2 /* ...more functions */);
```

Composes multiple functions by piping their return values. It is transparent to whether the functions return 'regular' values or promises: the piped argument is always a resolved value. If one of the functions throws or returns a rejected promise, the promise returned by `composedFunc` will be rejected.

```js
// Reusing the same functions from the fn.lift() example

// Gets the message from the server every 1s, then sets it on the 'element'
var refreshMessage = fn.compose(getMessage, setElementMessage);
setInterval(refreshMessage, 1000);

// Which is equivalent to:
setInterval(function() {
	return fn.call(getMessage).then(setElementMessage);
}, 1000);
```

# Node-style asynchronous functions

Node.js APIs have their own standard for asynchronous functions: Instead of taking an errback, errors are passed as the first argument to the callback function. To use promises instead of callbacks with node-style asynchronous functions, you can use the `when/node` module, which is very similar to `when/callbacks`, but tuned to this convention.

Note: There are some Node.js functions that don't follow the typical Node-style async function conventions, such as `http.get`.  These functions will not work with `when/node`.

## node.lift

```js
var promiseFunc = nodefn.lift(nodeStyleFunction);

// Deprecated: using lift to partially apply while lifting
var promiseFunc = nodefn.lift(nodeStyleFunction, arg1, arg2/*...more args*/);
```

Function based on the same principles from [`fn.lift()`](#fnlift) and [`callbacks.lift()`](#callbackslift), but tuned to handle nodejs-style async functions.

```js
var dns    = require('dns');
var when   = require('when');
var nodefn = require('when/node');

var resolveAddress = nodefn.lift(dns.resolve);

when.join(
	resolveAddress('twitter.com'),
	resolveAddress('facebook.com'),
	resolveAddress('google.com')
).then(function(addresses) {
	// All addresses resolved
}).catch(function(reason) {
	// At least one of the lookups failed
});
```

## node.liftAll

```js
var liftedApi = fn.liftAll(srcApi);

var liftedApi = fn.liftAll(srcApi, transform);

var destApi = fn.liftAll(srcApi, transform, destApi);
```

Lifts all the methods of a source object, returning a new object with all the lifted methods.  The optional `transform` function allows you to rename or otherwise customize how the lifted functions are added to the returned object.  If `destApi` is provided, lifted methods will be added to it, instead of to a new object, and `destApi` will be returned.

```js
// Lift the entire dns API
var dns = require('dns');
var promisedDns = node.liftAll(dns);

when.join(
	promisedDns.resolve("twitter.com"),
	promisedDns.resolveNs("facebook.com"),
	promisedDns.resolveMx("google.com")
).then(function(addresses) {
	// All addresses resolved
}).catch(function(reason) {
	// At least one of the lookups failed
});
```

For additional flexibility, you can use the optional `transform` function to do things like renaming:

```js
// Lift all of the fs methods, but name them with an 'Async' suffix
var fs = require('fs');
var promisedFs = node.liftAll(fs, function(promisedFs, liftedFunc, name) {
	promisedFs[name + 'Async'] = liftedFunc;
	return promisedFs;
});

promisedFs.readFileAsync('file.txt').done(console.log.bind(console));
```

You can also supply your own destination object onto which all of the lifted functions will be added:

```js
// Lift all of the fs methods, but name them with an 'Async' suffix
// and add them back onto fs!
var fs = require('fs');
var promisedFs = node.liftAll(fs, function(promisedFs, liftedFunc, name) {
	promisedFs[name + 'Async'] = liftedFunc;
	return promisedFs;
}, fs);

fs.readFileAsync('file.txt').done(console.log.bind(console));
```

## node.call

```js
var promisedResult = nodefn.call(nodeStyleFunction, arg1, arg2/*...more args*/);
```

Analogous to [`fn.call()`](#fncall) and [`callbacks.call()`](#callbackscall): Takes a function plus optional arguments to that function, and returns a promise for its final value. The promise will be resolved or rejected depending on whether the conventional error argument is passed or not.

```js
var fs     = require('fs');
var nodefn = require('when/node');

var loadPasswd = nodefn.call(fs.readFile, '/etc/passwd');

loadPasswd.done(function(passwd) {
	console.log('Contents of /etc/passwd:\n' + passwd);
}, function(error) {
	console.log('Something wrong happened: ' + error);
});
```

## node.apply

```js
var promisedResult = nodefn.apply(nodeStyleFunction, [arg1, arg2/*...more args*/]);
```

Following the tradition from `when/function` and `when/callbacks`, `when/node` also provides a array-based alternative to `nodefn.call()`.

```js
var fs     = require('fs');
var nodefn = require('when/node');

var loadPasswd = nodefn.apply(fs.readFile, ['/etc/passwd']);

loadPasswd.done(function(passwd) {
	console.log('Contents of /etc/passwd:\n' + passwd);
}, function(error) {
	console.log('Something wrong happened: ' + error);
});
```

## node.liftCallback

```js
var promiseAcceptingFunction = nodefn.liftCallback(nodeback);
```

Transforms a node-style callback function into a function that accepts a
promise.  This allows you to bridge promises and node-style in "the other
direction".  For example, if you have a node-style callback,
and a function that returns promises, you can lift the former to allow the
two functions to be composed.

The lifted function will always returns its input promise, and always executes
`nodeback` in a future turn of the event loop.  Thus, the outcome of `nodeback`
has no bearing on the returned promise.

If `nodeback` throws an exception, it will propagate to the host environment,
just as it would when using node-style callbacks with typical Node.js APIs.

```js
var nodefn = require('when/node');

function fetchData(key) {
	// go get the data and,
	return promise;
}

function handleData(err, result) {
	if(err) {
		// handle the error
	} else {
		// Use the result
	}
}

// Lift handleData
var handlePromisedData = nodefn.liftCallback(handleData);

var dataPromise = fetchData(123);

handlePromisedData(dataPromise);
```

## node.bindCallback

```js
var resultPromise = nodefn.bindCallback(promise, nodeback);
```

Lifts and then calls the node-style callback on the provided promise.  This is a one-shot version of [nodefn.liftCallback](#nodeliftcallback), and the `resultPromise` will behave as described there.

```js
var nodefn = require('when/node');

function fetchData(key) {
	// go get the data and,
	return promise;
}

function handleData(err, result) {
	if(err) {
		// handle the error
	} else {
		// Use the result
	}
}

// Lift handleData
var dataPromise = fetchData(123);

nodefn.bindCallback(dataPromise, handleData);
```

## node.createCallback

```js
var nodeStyleCallback = nodefn.createCallback(resolver);
```

A helper function of the `when/node` implementation, which might be useful for cases that aren't covered by the higher level API. It takes an object that responds to the resolver interface (`{ resolve:function, reject:function }`) and returns a function that can be used with any node-style asynchronous function, and will call `resolve()` or `reject()` on the resolver depending on whether the conventional error argument is passed to it.

```js
var when   = require('when');
var nodefn = require('when/node');

function nodeStyleAsyncFunction(callback) {
    if(Math.random() * 2 > 1) {
      callback(new Error('Oh no!'));
    } else {
      callback(null, "Interesting value");
    }
}

var deferred = when.defer();
nodeStyleAsyncFunction(nodefn.createCallback(deferred.resolver));

deferred.promise.then(function(interestingValue) {
  console.log(interestingValue)
},function(err) {
  console.error(err)
});
```

## Support Promises and Node-style callback Functions

Sometimes you may want to support both promises and node-style callbacks from within a method, rather than [`lift`](#nodelift) or [`liftAll`](#nodeliftall). To do this you can use [`bindCallback`](#nodebindcallback) which returns the promise you pass to it, and also checks whether a callback is provided or not.

```js
var when = require('when');
var bindCallback = require('when/node').bindCallback;

module.exports = {
    getFullName: function (firstName, lastName, callback) {
        return bindCallback(when.promise(function(resolve, reject) {
            if (firstName && lastName) {
                var fullName = firstName + " " + lastName;
                resolve(fullName);
            }
            else {
                reject("First and last name must be passed.");
            }
        }), callback);
    }
};
```

# Asynchronous functions

Much of the asynchronous functionality available to javascript developers, be it directly from the environment or via third party libraries, is callback/errback-based. The `when/callbacks` module provides functions to interact with those APIs via promises in a transparent way, without having to write custom wrappers or change existing code. All the functions on this module (with the exception of `callbacks.promisify()`) assume that the callback and errback will be on the "standard" positions - the penultimate and last arguments, respectively.


### callbacks.lift

```js
var promiseFunc = callbacks.lift(callbackTakingFunc);

// Deprecated: using lift to partially apply while lifting
var promiseFunc = callbacks.lift(callbackTakingFunc, arg1, arg2/* ...more args */);
```

Much like [`fn.lift()`](#fnlift), `callbacks.lift` creates a promise-friendly function, based on an existing function, but following the asynchronous resolution patterns from [`callbacks.call()`](#callbackscall) and [`callbacks.apply()`](#callbacksapply). It can be useful when a particular function needs to be called in multiple places, or for creating an alternative API for a library.

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
	promiseAjax: callbacks.lift(traditionalAjax)
};
```

### callbacks.liftAll

```js
var liftedApi = callbacks.liftAll(srcApi);

var liftedApi = callbacks.liftAll(srcApi, transform);

var destApi = callbacks.liftAll(srcApi, transform, destApi);
```

Lifts all the methods of a source object, returning a new object with all the lifted methods.  The optional `transform` function allows you to rename or otherwise customize how the lifted functions are added to the returned object.  If `destApi` is provided, lifted methods will be added to it, instead of to a new object, and `destApi` will be returned.


### callbacks.call

```js
var promisedResult = callbacks.call(callbackTakingFunc, arg1, arg2/* ...more args */);
```

Takes a callback-taking function and returns a promise for its final value, forwarding any additional arguments. The promise will be resolved when the function calls its callback, and the resolution value will be callback's first argument. If multiple values are passed to the callback, the promise will resolve to an array. The same thing happens if the function call the errback, with the difference that the promise will be rejected instead.

```js
var domIsLoaded = callbacks.call($);
domIsLoaded.then(doMyDomStuff);
```

```js
// Fictional ajax library function
function traditionalAjax(method, url, callback, errback) {
	var xhr = new XMLHttpRequest();
	xhr.open(method, url);

	xhr.onload = callback;
	xhr.onerror = errback;

	xhr.send();
}

var xhrResult = callbacks.call(traditionalAjax, 'GET', url);
xhrResult.then(function(result) {
	console.log("Got result", result);
});
```

### callbacks.apply

```js
var promisedResult = callbacks.apply(callbackTakingFunc, [arg1, arg2/* ...more args */]);
```

The array-taking analog to `callbacks.call`, as `Function.prototype.apply` is to `Function.prototype.call`.

```js
// This example simulates fading away an element, fading in a new one, fetching
// two remote resources, and then waiting for all that to finish before going
// forward. The APIs are all callback-based, but only promises are manipulated.

// Function.prototype.bind is needed to preserve the context
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

### callbacks.promisify

**DEPRECATED**

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

### Which one should I use?

|                            | fn | node | callback |
|----------------------------|----|------|----------|
|**The function looks like:**|```doStuff(x, y);```<br/> Synchronous, no callbacks.| ```doStuff(x,y, callback);```<br/>The last parameter is a callback like ```function(err, result)```. | ```doStuff(x, y, callback, errback);```<br/>The next-to-last is callback, last is errback.|
|**Use this:**               | ```require('when');```<br/>```when.lift(doStuff)(x,y).then(...);```|```nodefn = require('when/node');```<br/>```nodefn.lift(doStuff)(x,y).then(...);```|```callbacks = require('when/callbacks');```<br/>```callbacks.lift(doStuff)(x,y).then(...);```|


# ES6 generators

**Experimental**: Requires an environment that supports ES6 generators and the `yield` keyword.

## when/generator

The `when/generator` module provides APIs for using ES6 generators as coroutines.  You can `yield` promises to await their resolution while control is transferred back to the JS event loop.  You can write code that looks and acts like synchronous code, even using synchronous `try`, `catch` and `finally`.

The following example uses `generator.call` to fetch a list of todos for a user, `yield`ing control until the promise returned by `getTodosForUser` is resolved.  If the promise fulfills, execution will continue and show the todos.  If the promise rejects, the rejection will be translated to a synchronous exception (using ES6 generator `.throw()`).  As you'd expect, control will jump to the `catch` and show an error.

```js
var gen = require('when/generator');

gen.call(function*(todosFilter, userId) {
	var todos;
	try {
		todos = yield getTodosForUser(userId);
		showTodos(todos.filter(todosFilter));
	} catch(e) {
		showError(e);
	}
}, isRecentTodo, 123);

function getTodosForUser(userId) {
	// returns a promise for an array of the user's todos
}

```

## generator.lift
```js
var coroutine = generator.lift(es6generator*);

// Deprecated: using lift to partially apply while lifting
var coroutine = generator.lift(es6generator*, arg1, arg2/*...more args*/);
```

Lifts `es6generator` to a promise-aware coroutine, instead of calling it immediately.  Returns a function that, when called, can use `yield` to await promises.  This can be more convenient than using `generator.call` or `generator.apply` by allowing you to create the coroutine once, and call it repeatedly as a plain function.

Additional arguments provided to `generator.lift` will be partially applied to the lifted coroutine.

Here is a revised version of the above example using `generator.lift`.  Note that we're also partially applying the `isRecentTodos` filtering function.

```js
var gen = require('when/generator');

// Use generator.lift to create a function that acts as a coroutine
var getRecentTodosForUser = gen.lift(function*(userId) {
	var todos;
	try {
		todos = yield getTodosForUser(userId);
		showTodos(todos.filter(isRecentTodo));
	} catch(e) {
		showError(e);
	}
});

function getTodosForUser(userId) {
	// returns a promise for an array of the user's todos
}

// Get the recent todos for user 123.
getRecentTodosForUser(123);
```

In addition to `try`, `catch`, and `finally`, `return` also works as expected.  In this revised example, `yield` allows us to return a result and move error handling out to the caller.

```js
var gen = require('when/generator');

// Use generator.lift to create a function that acts as a coroutine
var getRecentTodosForUser = gen.lift(function*(userId) {
	var todos = yield getTodosForUser(userId);
	return todos.filter(isRecentTodo);
});

function getTodosForUser(userId) {
	// returns a promise for an array of the user's todos
}

// filteredTodos is a promise for the recent todos for user 123
var filteredTodos = getRecentTodosForUser(123);
```

## generator.call

```js
var resultPromise = generator.call(es6generator*, arg1, arg2/*...more args*/);
```

Immediately calls `es6generator` with the supplied args, and allows it use `yield` to await promises.

## generator.apply

```js
var resultPromise = generator.apply(es6generator*, [arg1, arg2/*...more args*/]);
```

Similar to `generator.call`, immediately calls `es6generator` with the supplied args array, and allows it use `yield` to await promises.

# Limiting Concurrency

## when/guard

```js
var guard = require('when/guard');

var guarded = guard(condition, function() {
	// .. Do important stuff
});
```

Where:

* `condition` is a concurrency limiting condition, such as [guard.n](#guardn)

Limit the concurrency of a function.  Creates a new function whose concurrency is limited by `condition`.  This can be useful with operations such as [when.map](#whenmap), [when/parallel](#whenparallel), etc. that allow tasks to execute in "parallel", to limit the number which can be inflight simultaneously.

```js
// Using when/guard with when.map to limit concurrency
// of the mapFunc

var guard, guardedAsyncOperation, mapped;

guard = require('when/guard');

// Allow only 1 inflight execution of guarded
guardedAsyncOperation = guard(guard.n(1), asyncOperation);

mapped = when.map(array, guardedAsyncOperation);
mapped.then(function(results) {
	// Handle results as usual
});
```

```js
// Using when/guard with when/parallel to limit concurrency
// across *all tasks*

var guard, parallel, guardTask, tasks, taskResults;

guard = require('when/guard');
parallel = require('when/parallel');

tasks = [/* Array of async functions to execute as tasks */];

// Use bind() to create a guard that can be applied to any function
// Only 2 tasks may execute simultaneously
guardTask = guard.bind(null, guard.n(2));

// Use guardTask to guard all the tasks.
tasks = tasks.map(guardTask);

// Execute the tasks with concurrency/"parallelism" limited to 2
taskResults = parallel(tasks);
taskResults.then(function(results) {
	// Handle results as usual
});
```

## Guard conditions

### guard.n

```js
var condition = guard.n(number);
```

Creates a condition that allows at most `number` of simultaneous executions inflight.

# Error types

### TimeoutError

```js
var TimeoutError = when.TimeoutError;
// or
var TimeoutError = require('when/lib/TimeoutError');
```

[Timeout promises](#promisetimeout) reject with `TimeoutError` unless a custom reason is provided.

# Debugging promises

Errors in an asynchronous operation always occur in a different call stack than the the one that initiated the operation.  Because of that, such errors cannot be caught using synchronous `try/catch`.  Promises help to manage that process by capturing the error and rejecting the associated promise, so that application code can handle the error using promise error handling features, such as [`promise.catch`](#promisecatch).  This is generally a good thing.  If promises *didn't* do this, *any* thrown exception would be uncatchable, even those errors that could have been handled by the application, and would instead cause a crash.

However, this also means that errors captured in rejected promises often go silent until observed by calling `promise.catch`.  In nearly all promise implementations, if application code never calls `promise.catch`, the error will be silent.

By default, when.js logs *potentially unhandled rejections* to `console.error`, along with stack traces.  This works even if you don't call [`promise.done`](#promisedone), or if you never call `promise.catch`, and is much like uncaught synchronous exceptions.

Tracking down asynchronous failures can be tricky, so to get even richer debugging information, including long, asynchronous, stack traces, you can enable [`when/monitor/console`](#whenmonitorconsole).

## Potentially unhandled rejections

For example, the following error will be completely silent in most promise implementations.

```js
var when = require('when');

when.resolve(123).then(function(x) {
	// This code executes in a future call stack, and the
	// ReferenceError cannot be caught with try/catch
	oops(x);
});
```

In when.js, you will get an error stack trace to the console:

```
Potentially unhandled rejection [1] ReferenceError: oops is not defined
    at /Users/brian/Projects/cujojs/when/experiments/unhandled.js:4:2
    at tryCatchReject (/Users/brian/Projects/cujojs/when/lib/makePromise.js:806:14)
    at FulfilledHandler.when (/Users/brian/Projects/cujojs/when/lib/makePromise.js:602:9)
    at ContinuationTask.run (/Users/brian/Projects/cujojs/when/lib/makePromise.js:726:24)
    at Scheduler._drain (/Users/brian/Projects/cujojs/when/lib/scheduler.js:56:14)
    at Scheduler.drain (/Users/brian/Projects/cujojs/when/lib/scheduler.js:21:9)
    at process._tickCallback (node.js:419:13)
    at Function.Module.runMain (module.js:499:11)
    at startup (node.js:119:16)
    at node.js:906:3
```

The error is tagged with "Potentially unhandled rejection" and an *id*, `[1]` in this case, to visually call out that it is potentially unhandled.  If the rejection is handled at a later time, a second message including the same id will be logged to help correlate which rejection was handled.  Read on to find out why this might happen.

### Rejections handled later

It's important to remember that potentially unhandled rejections are, well, *potentially* unhandled. Due to their asynchronous nature, rejected promises may be handled at a later time.  For example, a rejection could be handled after a call to `setTimeout`, even though this is very rare in practice.

Promise rejections fall into 3 categories:

#### Typical usage

In typical usage, rejections should be handled quickly (by calling `then`, `catch`, etc.) either by code higher in the current call stack as a promise is returned, or by code in the current promise chain.

In these most common cases, where all rejections are handled, no errors will be logged just as you expect in synchronous code where all exceptions are caught and handled using `try/catch`.

#### Developer errors

These cases typically represent coding mistakes, such as `ReferenceError`s.  In these cases, the errors will be logged as potentially unhandled rejections, again just as you expect in synchronous code where there is an uncaught exception.

#### Edge cases

In rare cases, application code may leave a rejected promise unobserved for a longer period of time, and then at some point later (for example, after a `setTimeout`), handle it.

In such cases, the rejection may be reported as being potentially unhandled.  When that rejection *is* handled, when.js will log a second message to let you know. For example:

```js
var when = require('when');

var p = when.resolve(123).then(function() {
	throw new Error('this rejection will be handled later');
});

setTimeout(function() {
	p.catch(function(e) {
		// ... handled ...
	});
}, 1000);
```

```
Potentially unhandled rejection [1] Error: this rejection will be handled later
    at /Users/brian/Projects/cujojs/when/experiments/unhandled.js:4:8
    at tryCatchReject (/Users/brian/Projects/cujojs/when/lib/makePromise.js:806:14)
    at FulfilledHandler.when (/Users/brian/Projects/cujojs/when/lib/makePromise.js:602:9)
    at ContinuationTask.run (/Users/brian/Projects/cujojs/when/lib/makePromise.js:726:24)
    at Scheduler._drain (/Users/brian/Projects/cujojs/when/lib/scheduler.js:56:14)
    at Scheduler.drain (/Users/brian/Projects/cujojs/when/lib/scheduler.js:21:9)
    at process._tickCallback (node.js:419:13)
    at Function.Module.runMain (module.js:499:11)
    at startup (node.js:119:16)
    at node.js:906:3

... one second later ...

Handled previous rejection [1] Error: this rejection will be handled later
```

In this case, the rejection was handled later.  As mentioned above, the second message includes the id and the original message to correlate with the original error.

## promise.then vs. promise.done

Remember the golden rule: either `return` your promise, or call `done` on it.

At first glance, `then`, and `done` seem very similar.  However, there are important distinctions:

1. The *intent*
2. The error handling characteristics

### Intent

The intent of `then` is to *transform* a promise's value and to pass or return a new promise for the transformed value along to other parts of your application.

The intent of `done` is to *consume* a promise's value, transferring *responsibility* for the value to your code.

### Errors

In addition to transforming a value, `then` allows you to recover from, or propagate, *intermediate* errors.  Any errors that are not handled will be caught by the promise machinery and used to reject the promise returned by `then`.

**Note:** [`catch`](#promisecatch) is almost always a better choice for handling errors than `then`. It is more readable, and accepts a `predicate` for matching particular error types.

Calling `done` transfers all responsibility for errors to your code.  If an error (either a thrown exception or returned rejection) escapes the `handleValue`, or `handleError` you provide to `done`, it will be rethrown in an uncatchable way to the host environment, causing a loud stack trace or a crash.

This can be a big help with debugging, since most environments will then generate a loud stack trace.  In some environments, such as Node.js, the VM will also exit immediately, making it very obvious that a fatal error has escaped your promise chain.

### A Note on JavaScript Errors

JavaScript allows `throw`ing and `catch`ing any value, not just the various builtin Error types (Error, TypeError, ReferenceError, etc).  However, in most VMs, *only Error types* will produce a usable stack trace.  If at all possible, you should always `throw` Error types, and likewise always reject promises with Error types.

To get good stack traces, do this:

```js
return when.promise(function(resolve, reject) {
	// ...
	reject(new Error('Oops!'));
});
```

And not this:

```js
return when.promise(function(resolve, reject) {
	// ...
	reject('Oops!');
});
```

Do this:

```js
return promise.then(function(x) {
	// ...
	throw new Error('Oops!');
})
```

And not this:

```js
return promise.then(function(x) {
	// ...
	throw 'Oops!';
})
```

## when/monitor/console

Experimental promise monitoring and debugging utilities for when.js.

## What does it do?

tl;dr Load `when/monitor/console` and get awesome async stack traces, even if you forget to return promises or forget to call `promise.done`:

```js
require('when/monitor/console');
var when = require('when');

when().then(function f1() {
	when().then(function f2() {
		when().then(function f3() {
			doh();
		});
	});
});
```

```
ReferenceError: doh is not defined
    at f3 (/Users/brian/Projects/cujojs/when/experiments/trace.js:7:4)
from execution context:
    at f2 (/Users/brian/Projects/cujojs/when/experiments/trace.js:6:21)
from execution context:
    at f1 (/Users/brian/Projects/cujojs/when/experiments/trace.js:5:10)
from execution context:
    at Object.<anonymous> (/Users/brian/Projects/cujojs/when/experiments/trace.js:4:9)
```

It monitors promise state transitions and then takes action, such as logging to the console, when certain criteria are met, such as when a promise has been rejected but has no `onRejected` handlers attached to it, and thus the rejection would have been silent.

Since promises are asynchronous and their execution may span multiple disjoint stacks, it will also attempt to stitch together a more complete stack trace.  This synthesized trace includes the point at which a promise chain was created, through other promises in the chain to the point where the rejection "escaped" the end of the chain without being handled.

## Using it

Load `when/monitor/console` in your environment as early as possible.  That's it.  If you have no unhandled rejections, it will be silent, but when you do have them, it will report them to the console, complete with synthetic stack traces.

It works in modern browsers (AMD), and in Node and RingoJS (CommonJS).

### AMD

Load `when/monitor/console` early, such as using curl.js's `preloads`:

```js
curl.config({
	packages: [
		{ name: 'when', location: 'path/to/when', main: 'when' },
		// ... other packages
	],
	preloads: ['when/monitor/console']
});

curl(['my/app']);
```

### Node/Ringo/CommonJS

```js
require('when/monitor/console');
```

### Browserify

```js
browserify -s PromiseMonitor when/monitor/console.js -o PromiseMonitor.js
```

### PrettyMonitor for when.js and Node

[PrettyMonitor](https://github.com/AriaMinaei/pretty-monitor) by [@AriaMinaei](https://github.com/AriaMinaei) is an alternative promise monitor on Node.  It's built using when.js's own monitoring apis and modules, and provides a very nice visual display of unhandled rejections in Node.

## Roll your own!

The monitor modules are building blocks.  The [when/monitor/console](../monitor/console.js) module is one particular, and fairly simple, monitor built using the monitoring APIs and tools (PrettyMonitor is another, prettier one!).  Using when/monitor/console as an example, you can build your own promise monitoring tools that look for specific types of errors, or patterns and log or display them in whatever way you need.

# Upgrading to 3.0 from 2.x

While there have been significant architectural changes in 3.0, it remains almost fully backward compatible.  There are a few things that were deprecated and have now been removed, and functionality that has moved to a new preferred spot.

## ES5 Required

As of version 3.0, when.js requires an ES5 environment.  In older environments, use an ES5 shim such as [poly](https://github.com/cujojs/poly) or [es5-shim](https://github.com/es-shims/es5-shim).  For more information, see the [installation docs](installation.md).

## Backward incompatible changes

Previously deprecated features that have been removed in 3.0:

* `promise.always` was removed. Use [`promise.finally(cleanup)`](#promisefinally) (or its ES3 alias [`promise.ensure`](#promisefinally)), or [`promise.then(cleanup, cleanup)`](#promisethen) instead.
* `deferred.resolve`, `deferred.reject`, `deferred.resolver.resolve`, and `deferred.resolver.reject` no longer return promises. They always return `undefined`.  You can simply return `deferred.promise` instead if you need.
* [`when.all`](#whenall), [`when.any`](#whenany), and [`when.some`](#whensome) no longer directly accept `onFulfilled`, `onRejected`, and `onProgress` callbacks.  Simply use the returned promise instead.
	* For example, do this: `when.all(array).then(handleResults)` instead of this: `when.all(array, handleResults)`
* `when.isPromise` was removed. Use [`when.isPromiseLike`](#whenispromiselike) instead.

## Moved functionality

Some functionality has moved to a new, preferred API.  The old APIs still work, and were left in place for backward compatibility, but will eventually be removed:

* `when/delay` module. Use [`promise.delay`](#promisedelay) instead.
* `when/timeout` module. Use [`promise.timeout`](#promisetimeout) instead.
* `when/node/function` module. Use the [`when/node`](#node-style-asynchronous-functions) module instead.
* `when/unfold` and `when/unfold/list` modules. Use [`when.unfold`](#whenunfold) instead
* `when/function` `lift` and `call`. Use [`when.lift`](#whenlift) and [`when.try`](#whentry) instead.
* In the [browserify build](installation.md), `when.node` is now the preferred alias over `when.nodefn`.

# Progress events are deprecated

Progress events are now deprecated, and will be removed in a future release.  They are problematic for several reasons, including:

1. They're implemented in inconsistent ways across promise libraries, making them unreliable when mixing promises.
1. They don't work in a predictable way when combining promises with `all`, `race`, `any`, etc.
1. Returning a promise from a progress handler doesn't have the expected effect of making a promise chain wait.

## Refactoring progress

There is a simple alternative using `promise.tap` that can replace many usages of progress.  Here's an example of the pattern using `tap` to issue progress updates.

```js
var progressBar = //...;

function showProgressUpdate(update) {
	progressBar.setValue(update);
}

functionThatUsesPromiseProgress(showProgressUpdate)
	.then(showCompletedMessage);

// Accept the progress update function as an argument and use
// tap() to call it with progress values
function functionThatUsesPromiseProgress(notify) {
	return doFirstTask()
		.tap(function() {
			// `return` is optional, depending on your needs.
			// Returning allows notify to delay subsequent steps if it returns
			// a promise.  If you don't want that, just call notify and discard
			// its return value.
			return notify(0.333);
		})
		.then(doSecondTask)
		.tap(function() {
			return notify(0.667);
		}
		.then(doThirdTask)
		.tap(function() {
			return notify(1.0);
		});
}
```
