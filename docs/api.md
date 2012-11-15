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
1. [Helpers](#helpers)
	* [when/apply](#whenapply)
1. [Configuration](#configuration)
	* [Paranoid mode](#paranoid-mode)

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

**Note:** Although a deferred has the full `promise` + `resolver` API, this should used *for convenience only, by the creator of the deferred*.  Only the `promise` and `resolver` should be given to consumers and producers.

```js
deferred.then(onFulfilled, onRejected, onProgress);
deferred.resolve(promiseOrValue);
deferred.reject(reason);
deferred.progress(update);
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