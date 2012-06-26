API
===

1. [when](#when)
1. [Deferred](#Deferred)
1. [Promise](#Promise)
1. [Resolver](#Resolver)
1. [Creating promises](#Creatingpromises)
	1. [when.defer](#whendefer)
	1. [when.resolve](#whenresolve)
	1. [when.reject](#whenreject)
1. [Joining promises](#Joiningpromises)
	1. [when.all](#whenall)
	1. [when.any](#whenany)
	1. [when.some](#whensome)
1. [Higher order operations](#Higherorderoperations)
	1. [when.map](#whenmap)
	1. [when.reduce](#whenreduce)

when()
------

Register a handler for a promise or immediate value:

```javascript
when(promiseOrValue, callback, errback, progressback)

// Always returns a promise, so can be chained:

when(promiseOrValue, callback, errback, progressback).then(anotherCallback, anotherErrback, anotherProgressback)
```

Creating promises
=================

when.defer()
------------

Create a new Deferred containing separate `promise` and `resolver` parts:

```javascript
var deferred = when.defer();

var promise = deferred.promise;
var resolver = deferred.resolver;
```

when.resolve()
--------------
```js
var resolved = when.resolve(promiseOrValue);
```

Return a resolved promise for the supplied promiseOrValue. If promiseOrValue is a value, it will be the resolution value of the returned promise.  Returns promiseOrValue if it's a trusted promise. If promiseOrValue is a foreign promise, returns a promise in the same state (resolved or rejected) and with the same value as promiseOrValue.

when.reject()
-------------

```javascript
var rejected = when.reject(promiseOrValue);
```

Return a rejected promise for the supplied promiseOrValue. If promiseOrValue is a value, it will be the rejection value of the returned promise.  If promiseOrValue is a promise, its completion value will be the rejected value of the returned promise.

This can be useful in situations where you need to reject a promise *without* throwing an exception.  For example, it allows you to propagate a rejection with the value of another promise.

```javascript
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

Deferred
--------

The deferred has the full `promise` + `resolver` API:

```javascript
deferred.then(callback, errback, progressback);
deferred.resolve(value);
deferred.reject(reason);
deferred.progress(update);
```

Promise
-------

```javascript
// var promise = deferred.promise;

// then()
// Main promise API
// Register callback, errback, and/or progressback
promise.then(callback, errback, progressback);
```

**Extended Promise API**

Convenience methods that are not part of the Promises/A proposal.

```js
// always()
// Register an alwaysback that will be called when the promise resolves or rejects
promise.always(alwaysback [, progressback]);

// otherwise()
// Convenience method to register only an errback
promise.otherwise(errback);
```

Resolver
--------

```javascript
// var resolver = deferred.resolver;
resolver.resolve(value);
resolver.reject(err);
resolver.progress(update);
```

when.isPromise()
----------------

```javascript
var is = when.isPromise(anything);
```

Return true if `anything` is truthy and implements the then() promise API.  Note that this will return true for both a deferred (i.e. `when.defer()`), and a `deferred.promise` since both implement the promise API.

Joining promises
================

when.all()
----------

```javascript
when.all(promisesOrValues, callback, errback, progressback)
```

Return a promise that will resolve only once *all* the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the `promisesOrValues`.

when.any()
----------

```javascript
when.any(promisesOrValues, callback, errback, progressback)
```

Return a promise that will resolve when any one of the supplied `promisesOrValues` has resolved.  The resolution value of the returned promise will be the resolution value of the triggering `promiseOrValue`.

when.some()
-----------

```javascript
when.some(promisesOrValues, howMany, callback, errback, progressback)
```

Return a promise that will resolve when `howMany` of the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array of length `howMany` containing the resolutions values of the triggering `promisesOrValues`.

when.chain()
------------

```javascript
when.chain(promiseOrValue, resolver, optionalValue)
```

Ensure that resolution of `promiseOrValue` will complete `resolver` with the completion value of `promiseOrValue`, or instead with `optionalValue` if it is provided.

Returns a new promise that will complete when `promiseOrValue` is completed, with the completion value of `promiseOrValue`, or instead with `optionalValue` if it is provided.

**Note:** If `promiseOrValue` is not an immediate value, it can be anything that supports the promise API (i.e. `then()`), so you can pass a `deferred` as well.  Similarly, `resolver` can be anything that supports the resolver API (i.e. `resolve()`, `reject()`), so a `deferred` will work there, too.

Higher order operations
=======================

when.map()
----------

```javascript
when.map(promisesOrValues, mapFunc)
```

Traditional map function, similar to `Array.prototype.map()`, but allows input to contain promises and/or values, and mapFunc may return either a value or a promise.

The map function should have the signature:

```javascript
mapFunc(item)
```

Where:

* `item` is a fully resolved value of a promise or value in `promisesOrValues`

when.reduce()
-------------

```javascript
when.reduce(promisesOrValues, reduceFunc, initialValue)
```

Traditional reduce function, similar to `Array.prototype.reduce()`, but input may contain promises and/or values, and reduceFunc may return either a value or a promise, *and* initialValue may be a promise for the starting value.

The reduce function should have the signature:

```javascript
reduceFunc(currentValue, nextItem, index, total)
```

Where:

* `currentValue` is the current accumulated reduce value
* `nextItem` is the fully resolved value of the promise or value at `index` in `promisesOrValues`
* `index` the *basis* of `nextItem` ... practically speaking, this is the array index of the promiseOrValue corresponding to `nextItem`
* `total` is the total number of items in `promisesOrValues`

when/apply
----------

```javascript
function functionThatAcceptsMultipleArgs(array) {
    // ...
}

var functionThatAcceptsAnArray = apply(functionThatAcceptsMultipleArgs);
```

Helper that allows using callbacks that take multiple args, instead of an array, with `when.all/some/map`:

```javascript
when.all(arrayOfPromisesOrValues, apply(functionThatAcceptsMultipleArgs));
```

[See the wiki](https://github.com/cujojs/when/wiki/when-apply) for more info and examples.
