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
1. [Arrays of promises](#arrays-of-promises)
	* [when.all](#whenall)
	* [when.map](#whenmap)
	* [when.reduce](#whenreduce)
	* [when.settle](#whensettle)
1. [Competitive races](#competitive-races)
	* [when.any](#whenany)
	* [when.some](#whensome)
1. [Object keys](#object-keys)
	* [when/keys all](#whenkeys-all)
	* [when/keys map](#whenkeys-map)
1. [Unbounded lists](#unbounded-lists)
	* [when/unfold](#whenunfold)
	* [when/unfold/list](#whenunfoldlist)
1. [Timed promises](#timed-promises)
	* [when/delay](#whendelay)
	* [when/timeout](#whentimeout)
1. [Concurrency](#concurrency)
	* [when/sequence](#whensequence)
	* [when/pipeline](#whenpipeline)
	* [when/parallel](#whenparallel)
	* [when/guard](#whenguard)
	* [Guard conditions](#guard-conditions)
1. [Polling with promises](#polling-with-promises)
	* [when/poll](#whenpoll)
1. [Interacting with non-promise code](#interacting-with-non-promise-code)
	* [Synchronous functions](#synchronous-functions)
	* [Asynchronous functions](#asynchronous-functions)
	* [Node-style asynchronous functions](#node-style-asynchronous-functions)
1. [Helpers](#helpers)
	* [when/apply](#whenapply)

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

**Note:** Although a deferred has the full `resolver` API, this should used *for convenience only, by the creator of the deferred*.  Only the `resolver` should be given to consumers and producers.

```js
deferred.resolve(promiseOrValue);
deferred.reject(reason);
deferred.notify(update);
```

## Resolver

The resolver represents *responsibility*--the responsibility of fulfilling or rejecting the associated promise.  This responsibility may be given out separately from the promise itself.

```js
var resolver = deferred.resolver;
resolver.resolve(promiseOrValue);
resolver.reject(reason);
resolver.notify(update);
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

### otherwise()

```js
promise.otherwise(onRejected);
```

Arranges to call `onRejected` on the promise's rejection reason if it is rejected.  It's a shortcut for:

```js
promise.then(undefined, onRejected);
```

### ensure()

```js
promise.ensure(onFulfilledOrRejected);
```

Ensure allows you to execute "cleanup" type tasks in a promise chain.  It arranges for `onFulfilledOrRejected` to be called, *with no arguments*, when promise is either fulfilled or rejected.  `onFulfilledOrRejected` cannot modify `promise`'s fulfillment value, but may signal a new or additional error by throwing an exception or returning a rejected promise.

`promise.ensure` should be used instead of `promise.always`.  It is safer in that it *cannot* transform a failure into a success by accident (which `always` could do simply by returning successfully!).

When combined with `promise.otherwise`, `promise.ensure` allows you to write code that is similar to the familar synchronous `catch`/`finally` pair.  Consider the following synchronous code:

```js
try {
  return doSomething(x);
} catch(e) {
	return handleError(e);
} finally {
	cleanup();
}
```

Using `promise.ensure`, similar asynchronous code (with `doSomething()` that returns a promise) can be written:

```js
return doSomething()
	.otherwise(handleError)
	.ensure(cleanup);
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

In other words, it's much like:

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

### inspect()

```js
var status = promise.inspect();
```

Returns a snapshot descriptor of the current state of `promise`.  This descriptor is *not live* and will not update when `promise`'s state changes.  The descriptor is an object with the following properties.  When promise is:

* pending: `{ state: 'pending' }`
* fulfilled: `{ state: 'fulfilled', value: <promise's fulfillment value> }`
* rejected: `{ state: 'rejected', reason: <promise's rejection reason> }`

While there are use cases where synchronously inspecting a promise's state can be helpful, the use of `inspect` is discouraged.  It is almost always preferable to simply use `when()` or `promise.then` to be notified when the promise fulfills or rejects.

#### See also:
* [when.settle()](#whenall) - settling an Array of promises

### always()

**DEPRECATED:** Will be removed in an upcoming version

```js
promise.always(onFulfilledOrRejected [, onProgress]);
```

Arranges to call `onFulfilledOrRejected` on either the promise's value if it is fulfilled, or on it's rejection reason if it is rejected.  It's a shortcut for:

```js
promise.then(onFulfilledOrRejected, onFulfilledOrRejected [, onProgress]);
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
d.notify(update);
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
d.notify(update);

// Results in:
// logProgress(1);
// logProgress(2);
```

# Creating promises

Typically, promises are created as part of a [Deferred](#deferred) operation.  However, there are occasions when the fate of a promise is already known.

## when.defer()

```js
var deferred = when.defer();
var promise = deferred.promise;
```

Create a new [Deferred](#deferred) that can be used to resolve or reject its associated promise at a later time.

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

Promises can be immensely helpful when coordinating multiple *eventual outcomes*.

## when.join()

```js
var joinedPromise = when.join(promiseOrValue1, promiseOrValue2, ...);
```

Return a promise that will resolve only once *all* the inputs have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the inputs.

If any of the input promises is rejected, the returned promise will be rejected with the reason from the first one that is rejected.

```js
// largerPromise will resolve to the greater of two eventual values
var largerPromise = when.join(promise1, promise2).then(function (values) {
	return values[0] > values[1] ? values[0] : values[1];
});
```

### See also:
* [when.all()](#whenall) - resolving an Array of promises

# Arrays of promises

When.js provides methods to use array-like patterns to coordinate several promises.

## when.all()

```js
var promise = when.all(array)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Return a promise that will resolve only once *all* the items in `array` have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the items in `array`.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

### See also:
* [when.join()](#whenjoin) - joining multiple promises
* [when.settle()](#whenall) - settling an Array of promises

## when.map()

```js
var promise = when.map(array, mapFunc)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Traditional array map function, similar to `Array.prototype.map()`, but allows input to contain promises and/or values, and mapFunc may return either a value or a promise.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

The map function should have the signature:

```js
mapFunc(item)
```

Where:

* `item` is a fully resolved value

## when.reduce()

```js
var promise = when.reduce(array, reduceFunc [, initialValue])
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Traditional array reduce function, similar to `Array.prototype.reduce()`, but input may contain promises and/or values, and reduceFunc may return either a value or a promise, *and* initialValue may be a promise for the starting value.

The reduce function should have the signature:

```js
reduceFunc(currentResult, value, index, total)
```

Where:

* `currentResult` is the current accumulated reduce value
* `value` is the fully resolved value at `index` in `array`
* `index` is the *basis* of `value` ... practically speaking, this is the array index of the array corresponding to `value`
* `total` is the total number of items in `array`

```js
// sum the eventual values of several promises
var sumPromise = when.reduce(inputPromisesOrValues, function (sum, value) {
	return sum += value;
}, 0);
```

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

## when.settle()

```js
var promise = when.settle(array);
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Returns a promise for an array containing the same number of elements as the input array.  Each element is a descriptor object describing of the outcome of the corresponding element in the input.  The returned promise will only reject if `array` itself is a rejected promise.  Otherwise, it will always fulfill with an array of descriptors.  This is in contrast to [when.all](#whenall), which will reject if any element of `array` rejects.

If the corresponding input promise is:

* fulfilled, the descriptor will be: `{ state: 'fulfilled', value: <fulfillmentValue> }`
* rejected, the descriptor will be: `{ state: 'rejected', reason: <rejectionReason> }`

```js
// Process all successful results, and also log all errors

// Input array
var array = [when.reject(1), 2, when.resolve(3), when.reject(4)];

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
* [when.all()](#whenall) - resolving an Array of promises
* [promise.inspect()](#inspect) - inspecting a promise's state

# Object Keys

the `when/keys` module provides `all()`, and `map()` for working with object keys, for the times when organizing promises in a hash using object keys is more convenient than using an array.

**NOTE:** Key enumeration order (via `for..in` and `Object.keys()`) in JavaScript/ECMAScript is not defined, making an inherently ordered operation like reduce/fold impossible to implement reliably across VMs (For example, see [this v8 bug](http://code.google.com/p/v8/issues/detail?id=164) showing that v8 key ordering has changed across versions).  Thus, `when/keys` does not provide `keys.reduce()`.

## when/keys all

```js
var promise = keys.all(object)
```

Where:

* object is an Object *or a promise for an Object*, whose keys represent promises and/or values.

Return a promise that will resolve only once *all* the items in `object` have resolved.  The resolution value of the returned promise will be an object containing the resolved key-value pairs of each of the items in `object`.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

### See also:
* [when.all()](#whenall)

## when/keys map

```js
var promise = keys.map(array, mapFunc)
```

Where:

* object is an Object *or a promise for an Object*, whose keys represent promises and/or values.

Similar to `when.map`, but for object keys, returns a promise for the key-mappedValue pairs by applying `mapFunc` to every value.  `mapFunc` may return either a promise or a value.

If any of the promises is rejected, the returned promise will be rejected with the rejection reason of the first promise that was rejected.

The map function should have the signature:

```js
mapFunc(value)
```

Where:

* `value` is a fully resolved value

### See also:
* [when.map()](#whenmap)

# Competitive races

The *competitive race* pattern may be used if one or more of the entire possible set of *eventual outcomes* are sufficient to resolve a promise.

## when.any()

```js
var promise = when.any(array)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.

Initiates a competitive race that allows one winner, returning a promise that will resolve when any one of the items in `array` resolves.  The returned promise will only reject if *all* items in `array` are rejected.  The resolution value of the returned promise will be the fulfillment value of the winning promise.  The rejection value will be an array of all rejection reasons.

## when.some()

```js
var promise = when.some(array, howMany)
```

Where:

* array is an Array *or a promise for an array*, which may contain promises and/or values.
* howMany is the number of promises from array that must fulfill to end the race

Initiates a competitive race that allows `howMany` winners, returning a promise that will resolve when `howMany` of the items in `array` resolve.  The returned promise will reject if it becomes impossible for `howMany` items to resolve--that is, when `(array.length - howMany) + 1` items reject.  The resolution value of the returned promise will be an array of `howMany` winning promise fulfillment values.  The rejection value will be an array of `(array.length - howMany) + 1` rejection reasons.

```js
// try all of the p2p servers and fail if at least one doesn't respond
var remotes = [connect('p2p.cdn.com'), connect('p2p2.cdn.com'), connect('p2p3.cdn.com')];
when.some(remotes, 1).then(initP2PServer, failGracefully);
```

# Unbounded lists

[when.reduce](#whenreduce), [when/sequence](#whensequence), and [when/pipeline](#whenpipeline) are great ways to process asynchronous arrays of promises and tasks.  Sometimes, however, you may not know the array in advance, or may not need or want to process *all* the items in the array.  For example, here are a few situations where you may not know the bounds:

1. You need to process a queue to which items are still being added as you process it
1. You need to execute a task repeatedly until a particular condition becomes true
1. You need to selectively process items in an array, rather than all items

In these cases, you can use `when/unfold` to iteratively (and asynchronously) process items until a particular condition, which you supply, is true.

## when/unfold

```js
var unfold, promise;

unfold = require('when/unfold');

promise = unfold(unspool, condition, handler, seed);
```

Where:
* `unspool` - function that, given a seed, returns a `[valueToSendToHandler, newSeed]` pair. May return an array, array of promises, promise for an array, or promise for an array of promises.
* `condition` - function that should return truthy when the unfold should stop
* `handler` - function that receives the `valueToSendToHandler` of the current iteration. This function can process `valueToSendToHandler` in whatever way you need.  It may return a promise to delay the next iteration of the unfold.
* `seed` - intial value provided to the first `unspool` invocation. May be a promise.

Send values produced by `unspool` iteratively to `handler` until a `condition` is true.  The `unspool` function acts like a generator, taking a seed and producing a pair of `[value, newSeed]` (or a promised pair, see above).  The `value` will be passed to `handler`, which can do any necessary on or with `value`, and may return a promise.  The `newSeed` will be passed as the seed to the next iteration of `unspool`.

### Examples

This example generates random numbers at random intervals for 10 seconds.

The `condition` could easily be modified (to `return false;`) to generate random numbers *forever*.  Interestingly, this would not overflow the call stack, and would not starve application code since it is asynchronous.

```js
var when, delay, unfold, end, start;

when = require('../when');
delay = require('../delay');
unfold = require('../unfold');

end = Date.now() + 10000;

// Generate random numbers at random intervals!
// Note that we could generate these forever, and never
// blow the call stack, nor would we starve the application
function unspool(seed) {
	// seed is passed in, although for this example, we don't need it

	// Return a random number as the value, and the time it was generated
	// as the new seed
	var next = [Math.random(), Date.now()];

	// Introduce a delay, just for fun, to show that we can return a promise
	return delay(next, Math.random() * 1000);
}

// Stop after 10 seconds
function condition(time) {
	return time >= end;
}

function log(value) {
	console.log(value);
}

start = Date.now();
unfold(unspool, condition, log, start).then(function() {
	console.log('Ran for', Date.now() - start, 'ms');
});
```

This example iterates over files in a directory, mapping each file to the first line (or first 80 characters) of its content.  It uses a `condition` to terminate early, which would not be possible with `when.map`.

Notice that, while the pair returned by `unspool` is an Array (not a promise), it does *contain* a promise as it's 0th element.  The promise will be resolved by the `unfold` machinery.

Notice also the use of `when/node/function`'s [`call()`](#node-style-asynchronous-functions) to call Node-style async functions (`fs.readdir` and `fs.readFile`), and return a promise instead of requiring a callback.  This allows node-style functions can be promisified and composed with other promise-aware functions.

```js
var when, delay, unfold, nodefn, fs, files;

when = require('../when');
delay = require('../delay');
unfold = require('../unfold');
nodefn = require('../node/function');
fs = require('fs');

// Use when/node/function to promisify-call fs.readdir
// files is a promise for the file list
files = nodefn.call(fs.readdir, '.');

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
	content = nodefn.call(fs.readFile, file)
		.otherwise(function(e) {
			return '[Skipping dir ' + file + ']';
		});
	return [content, files.slice(1)];
}

function condition(remaining) {
	// This could be any test we want.  For fun, stop when
	// the next file name starts with a 'p' stop.
	return remaining[0].charAt(0) === 'p';
}

function printFirstLine(content) {
	// Even though contents was a promise in unspool() above,
	// when/unfold ensures that it is fully resolved here, i.e. it is
	// not a promise any longer.
	// We can do any work, even asyncrhonous work, we need
	// here on the current file

	// Node fs returns buffers, convert to string
	content = String(content);

	// Print the first line, or only the first 80 chars if the fist line is longer
	console.log(content.slice(0, Math.min(80, content.indexOf('\n'))));
}

unfold(unspool, condition, printFirstLine, files).otherwise(console.error);
```


## when/unfold/list

```js
var unfoldList, resultPromise;

unfoldList = require('when/unfold/list');

resultPromise = unfoldList(unspool, condition, seed);
```

Where:
* `unspool` - function that, given a seed, returns a `[valueToAddToList, newSeed]` pair. May return an array, array of promises, promise for an array, or promise for an array of promises.
* `condition` - function that should return truthy when the unfold should stop
* `seed` - intial value provided to the first `unspool` invocation. May be a promise.

Generate a list of items from a seed by executing the `unspool` function while `condition` returns true.  The `resultPromise` will fulfill with an array containing all each `valueToAddToList` that is generated by `unspool`.

### Example

```js
function condition(i) {
	// Terminate the unfold when i == 3;
	return i == 3;
}

// unspool will be called initially with the seed value, 0, passed
// to unfoldList() below
function unspool(x) {
	// Return a pair
	// item 0: will be added to the resulting list
	// item 1: will be passed to the next call to condition() and unspool()
	return [x, x+1];
}

// Logs:
// [0, 1, 2]
unfoldList(unspool, condition, 0).then(console.log.bind(console));
```

# Timed promises

## when/delay

```js
var delayed = delay(milliseconds [, promiseOrValue]);
var delayed = delay(milliseconds);

// DEPRECATED, but currently works:
var delayed = delay(promiseOrValue, milliseconds);
```

Create a promise that resolves after a delay, or after a delay following the resolution of another promise.

```js
var delay, delayed;

delay = require('when/delay');

// delayed is a pending promise that will become fulfilled
// in 1 second (with the value `undefined`)
// Useful as a timed trigger when the value doesn't matter
delayed = delay(1000);

// delayed is a pending promise that will become fulfilled
// in 1 second with the value "hello"
delayed = delay(1000, "hello")

// delayed is a pending promise that will become fulfilled
// 1 second after anotherPromise resolves, or will become rejected
// *immediately* after anotherPromise rejects.
delayed = delay(1000, anotherPromise);

// Do something after 1 second, similar to using setTimeout
delay(1000).then(doSomething);

// Do something 1 second after triggeringPromise resolves
delay(1000, triggeringPromise).then(doSomething, handleRejection);
```

More when/delay [examples on the wiki](https://github.com/cujojs/when/wiki/when-delay)


## when/timeout

```js
var timed = timeout(milliseconds, promiseOrValue);

// DEPRECATED, but currently works:
var delayed = delay(promiseOrValue, milliseconds);
```

Create a promise that will reject after a timeout if promiseOrValue does not resolved or rejected beforehand.  If promiseOrValue is a value, the returned promise will resolve immediately.  More interestingly, if promiseOrValue is a promise, if it resolved before the timeout period, the returned promise will resolve.  If it doesn't, the returned promise will reject.

```js
var timeout, timed, d;

timeout = require('when/timeout');

// timed will reject after 5 seconds unless anotherPromise resolves beforehand.
timed = timeout(5000, anotherPromise);

d = when.defer();
// Setup d however you need

// return a new promise that will timeout if d doesn't resolve/reject first
return timeout(1000, d.promise);
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

## when/guard

```js
var guard, guarded;

guard = require('when/guard');

guarded = guard(condition, function() {
	// .. Do important stuff
});
```

Where:

* `condition` is a concurrency limiting condition, such as [guard.n](#guardn)

Limit the concurrency of a function.  Creates a new function whose concurrency is limited by `condition`.  This can be useful with operations such as [when.map](#whenmap), [when/parallel](#whenparallel), etc. that allow tasks to execute in "parallel", to limit the number which can be inflight simultanously.

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

### `guard.n`

```js
var condition = guard.n(number);
```

Creates a condition that allows at most `number` of simultaneous executions inflight.

# Polling with promises

## when/poll

```js
var poll, resultPromise;

poll = require('when/poll');

resultPromise = poll(work, interval, condition /*, initialDelay */);
```

Where:

* `work` - function to be called periodically
* `interval` - interval between calls to `work`. It may be a number *or* a function that returns a promise. If it's a function, the next polling iteration will wait until the promise fulfills.
* `condition` - function that evaluates each result of `work`. Polling will continue until it returns a truthy value.
* `initialDelay` - if provided and truthy, the first execution of `work` will be delayed by `interval`.  If not provided, or falsey, the first execution of `work` will happen as soon as possible.

Execute a task (`work`) repeatedly at the specified `interval`, until the `condition` function returns true.  The `resultPromise` will be resolved with the most recent value returned from `work`.  If `work` fails (throws an exception or returns a rejected promise) before `condition` returns true, the `resultPromise` will be rejected.

# Interacting with non-promise code

These modules are aimed at dampening the friction between code that is based on promises and code that follows more conventional approaches to make asynchronous tasks and/or error handling. By using them, you are more likely to be able to reuse code that already exists, while still being able to reap the benefits of promises on your new code.

## Synchronous functions

The `when/function` module contains functions for calling and adapting "normal" functions (i.e. those that take plain values, return plain values, and throw exceptions on errors). By calling those functions with `fn.call` and `fn.apply`, or by creating a new function with `fn.lift`, the return value will always be a promise, and thrown exceptions will be turned into rejections. As a bonus, promises given as arguments will be transparently resolved before the call.

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

### `fn.lift()`

**DEPRECATED ALIAS:** `fn.bind()`

```js
var promiseFunction = fn.lift(normalFunction, arg1, arg2/* ...more args */);
```

When the same function will be called through `fn.call()` or `fn.apply()` multiple times, it can be more efficient to create a wrapper function that has promise-awareness and exposes the same behavior as the original function. That's what `fn.lift()` does: It takes a normal function and returns a new, promise-aware version of it. As `Function.prototype.bind`, it makes partial application of any additional arguments.

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

// Creating a new function using fn.lift()
var promiseSetText = fn.lift(setText);
promiseSetText(element, getMessage());

// Leveraging the partial application
var setElementMessage = fn.lift(setText, element);
setElementMessage(geMessage());
```

### `fn.compose()`

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

### `callbacks.lift()`

**DEPRECATED ALIAS:** `callbacks.bind()`

```js
var promiseFunc = callbacks.lift(callbackTakingFunc, arg1, arg2/* ...more args */);
```

Much like [`fn.lift()`](#fnlift), `callbacks.lift` creates a promise-friendly function, based on an existing function, but following the asynchronous resolution patters from [`callbacks.call()`](#callbackscall) and [`callbacks.apply()`](#callbacksapply). It can be useful when a particular function needs no be called on multiple places, or for creating an alternative API for a library.

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

### `nodefn.lift()`

**DEPRECATED ALIAS:** `nodefn.bind()`

```js
var promiseFunc = nodefn.lift(nodeStyleFunction, arg1, arg2/*...more args*/);
```

Function based on the same principles from [`fn.lift()`](#fnlift) and [`callbacks.lift()`](#callbackslift), but tuned to handle nodejs-style async functions.

```js
var dns, when, nodefn;

dns    = require("dns");
when   = require("when");
nodefn = require("when/node/function");

var resolveAddress = nodefn.lift(dns.resolve);

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

# Helpers

## when/apply

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

