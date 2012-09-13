API
===

1. [when](#when)
1. [Deferred](#deferred)
1. [Promise](#promise)
	* [Extended Promise API](#extended-promise-api)
1. [Resolver](#resolver)
1. [Creating promises](#creating-promises)
	* [when.defer](#whendefer)
	* [when.resolve](#whenresolve)
	* [when.reject](#whenreject)
1. [Joining promises](#joining-promises)
	* [when.all](#whenall)
	* [when.any](#whenany)
	* [when.some](#whensome)
1. [Higher order operations](#higher-order-operations)
	* [when.map](#whenmap)
	* [when.reduce](#whenreduce)
1. [Timed Promises](#timed-promises)
	* [when/delay](#whendelay)
	* [when/timeout](#whentimeout)
1. [Helpers](#helpers)
	* [when/apply](#whenapply)


when()
------

```js
when(promiseOrValue, callback, errback, progressback)
```

Observe a promise or immediate value.

```js
// Returns a promise for the result of the callback or errback
var promise = when(promiseOrValue, callback, errback);

// Always returns a promise, so it is guaranteed to be chainable:
when(promiseOrValue, callback, errback, progressback).then(anotherCallback, anotherErrback, anotherProgressback);

// All parameters except the first are optional
// For example, you can register only a callback
when(promiseOrValue, callback);

```

when() can observe any promise that provides a Promises/A-like `.then()` method, even promises that aren't fully Promises/A compliant, such as jQuery's Deferred.  It will assimilate such promises and make them behave like Promises/A.

[Read more about when() here](https://github.com/cujojs/when/wiki/when)

Deferred
--------

A deferred has the full `promise` + `resolver` API:

```js
deferred.then(callback, errback, progressback);
deferred.resolve(promiseOrValue);
deferred.reject(reason);
deferred.progress(update);
```

And separate `promise` and `resolver` parts that can be *safely* given out to calling code.

```js
var promise = deferred.promise;
var resolver = deferred.resolver;
```

Promise
-------

```js
// Get a deferred promise
var promise = deferred.promise;

// Or a resolved promise
var promise = when.resolve(promiseOrValue);

// Or a rejected promise
var promise = when.reject(value);
```

Main Promise API
----------------

```js
// then()
// Main promise API
// Register callback, errback, and/or progressback
var newPromise = promise.then(callback, errback, progressback);
```

Registers new success, error, and/or progress handlers with a promise.  All parameters are optional.  As per the [Promises/A spec](http://wiki.commonjs.org/wiki/Promises/A#Proposal), returns a *new promise* that will be resolved with the result of `callback` if `promise` is fulfilled, or with the result of `errback` if `promise` is rejected.

A promise makes the following guarantees about handlers registered in the same call to `.then()`:

1. Only one of `callback` or `errback` will be called, never both.
1. `callback` and `errback` will never be called more than once.
1. `progressback` may be called multiple times.

Extended Promise API
--------------------

Convenience methods that are not part of the Promises/A proposal.  These are simply shortcuts for using `.then()`.

### always()

```js
promise.always(alwaysback [, progressback]);
```

Register an alwaysback that will be called when the promise resolves or rejects

### otherwise()

```js
promise.otherwise(errback);
```

Register only an errback

Resolver
--------

```js
var resolver = deferred.resolver;
resolver.resolve(promiseOrValue);
resolver.reject(err);
resolver.progress(update);
```

Creating promises
=================

when.defer()
------------

```js
var deferred = when.defer();
```

Create a new [Deferred](#deferred) that can resolved at a later time.

when.resolve()
--------------
```js
var resolved = when.resolve(promiseOrValue);
```

Create a resolved promise for the supplied promiseOrValue. If promiseOrValue is a value, it will be the resolution value of the returned promise.  Returns promiseOrValue if it's a trusted promise. If promiseOrValue is a foreign promise, returns a promise in the same state (resolved or rejected) and with the same value as promiseOrValue.

when.reject()
-------------

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

when.isPromise()
----------------

```js
var is = when.isPromise(anything);
```

Return true if `anything` is truthy and implements the then() promise API.  Note that this will return true for both a deferred (i.e. `when.defer()`), and a `deferred.promise` since both implement the promise API.

Joining promises
================

when.all()
----------

```js
var promise = when.all(promisesOrValues, callback, errback, progressback)
```

Return a promise that will resolve only once *all* the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the `promisesOrValues`.

when.any()
----------

```js
var promise = when.any(promisesOrValues, callback, errback, progressback)
```

Return a promise that will resolve when any one of the supplied `promisesOrValues` has resolved.  The resolution value of the returned promise will be the resolution value of the triggering `promiseOrValue`.

when.some()
-----------

```js
var promise = when.some(promisesOrValues, howMany, callback, errback, progressback)
```

Return a promise that will resolve when `howMany` of the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array of length `howMany` containing the resolutions values of the triggering `promisesOrValues`.

when.chain()
------------

```js
var promise = when.chain(promiseOrValue, resolver, optionalValue)
```

Ensure that resolution of `promiseOrValue` will complete `resolver` with the completion value of `promiseOrValue`, or instead with `optionalValue` if it is provided.

Returns a new promise that will complete when `promiseOrValue` is completed, with the completion value of `promiseOrValue`, or instead with `optionalValue` if it is provided.

**Note:** If `promiseOrValue` is not an immediate value, it can be anything that supports the promise API (i.e. `then()`), so you can pass a `deferred` as well.  Similarly, `resolver` can be anything that supports the resolver API (i.e. `resolve()`, `reject()`), so a `deferred` will work there, too.

Higher order operations
=======================

when.map()
----------

```js
var promise = when.map(promisesOrValues, mapFunc)
```

Traditional map function, similar to `Array.prototype.map()`, but allows input to contain promises and/or values, and mapFunc may return either a value or a promise.

The map function should have the signature:

```js
mapFunc(item)
```

Where:

* `item` is a fully resolved value of a promise or value in `promisesOrValues`

when.reduce()
-------------

```js
var promise = when.reduce(promisesOrValues, reduceFunc, initialValue)
```

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

Timed Promises
==============

when/delay
------------
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


when/timeout
------------
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
