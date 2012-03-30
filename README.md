Please Note: this project has moved from briancavalier/when to cujojs/when.
Any existing forks have been automatically moved to cujojs/when. However,
you'll need to update your clone and submodule remotes manually.

Update the url in your .git/config, and also .gitmodules for submodules:

```
git://github.com/cujojs/when.git
https://cujojs@github.com/cujojs/when.git
```

Helpful link for updating submodules:
[Git Submodules: Adding, Using, Removing, Updating](http://chrisjean.com/2009/04/20/git-submodules-adding-using-removing-and-updating/)

----

[![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when)

A lightweight [CommonJS](http://wiki.commonjs.org/wiki/Promises) [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) and `when()` implementation.  It also provides several other useful Promise-related concepts, such as joining and chaining, and has a robust unit test suite.

It's **just over 1k** when compiled with Google Closure (w/advanced optimizations) and gzipped.

when.js was derived from the async core of [wire.js](https://github.com/cujojs/wire).

What's New?
===========

### 1.0.4

* [Travis CI](http://travis-ci.org/cujojs/when) integration
* Fix for cancelable deferred not invoking progress callbacks. ([#24](https://github.com/cujojs/when/pull/24) Thanks [@scothis](https://github.com/scothis))
* The promise returned by `when.chain` now rejects when the input promise rejects.

### 1.0.3

* Fix for specific situation where `null` could incorrectly be used as a promise resolution value ([#23](https://github.com/cujojs/when/pull/23))

### 1.0.2

* Updated README for running unit tests in both Node and Browsers.  See **Running the Unit Tests** below.
* Set package name to 'when' in package.json

### 1.0.1

* Fix for rejections propagating in some cases when they shouldn't have been ([#19](https://github.com/cujojs/when/issues/19))
* Using [buster.js](http://busterjs.org/) for unit tests now.

### 1.0.0

* First official when.js release as a part of [cujojs](https://github.com/cujojs).
* Added [when/cancelable](https://github.com/cujojs/when/wiki/when-cancelable) decorator for creating cancelable deferreds
* Added [when/delay](https://github.com/cujojs/when/wiki/when-delay) and [when/timeout](https://github.com/cujojs/when/wiki/when-timeout) helpers for creating delayed promises and promises that timeout and reject if not resolved first.

[Full Changelog](https://github.com/cujojs/when/wiki/Changelog)

Quick Start
===========

### AMD

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. Configure your loader with a package:

	```javascript
	packages: [
		{ name: 'when', location: 'path/to/when/', main: 'when' },
		// ... other packages ...
	]
	```

1. `define(['when', ...], function(when, ...) { ... });` or `require(['when', ...], function(when, ...) { ... });`

### Script Tag

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. `<script src="path/to/when/when.js"></script>`
1. `when` will be available as `window.when`

### Node

1. `npm install git://github.com/cujojs/when` (**NOTE:** npm seems to require a url that starts with "git" rather than http or https)
1. `var when = require('when');`

### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

Docs & Examples
===============

See the API section below, and the [wiki for more detailed docs](https://github.com/cujojs/when/wiki) and [examples](https://github.com/cujojs/when/wiki/Examples)

API
===

when()
------

Register a handler for a promise or immediate value:

```javascript
when(promiseOrValue, callback, errback, progressback)

// Always returns a promise, so can be chained:

when(promiseOrValue, callback, errback, progressback).then(anotherCallback, anotherErrback, anotherProgressback)
```

when.defer()
------------

Create a new Deferred containing separate `promise` and `resolver` parts:

```javascript
var deferred = when.defer();

var promise = deferred.promise;
var resolver = deferred.resolver;
```

The deferred has the full `promise` + `resolver` API:

```javascript
deferred.then(callback, errback, progressback);
deferred.resolve(value);
deferred.reject(reason);
deferred.progress(update);
```

The `promise` API:

```javascript
// var promise = deferred.promise;
promise.then(callback, errback, progressback);
```

The `resolver` API:

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


when.some()
-----------

```javascript
when.some(promisesOrValues, howMany, callback, errback, progressback)
```

Return a promise that will resolve when `howMany` of the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array of length `howMany` containing the resolutions values of the triggering `promisesOrValues`.

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

when.chain()
------------

```javascript
when.chain(promiseOrValue, resolver, optionalValue)
```

Ensure that resolution of `promiseOrValue` will complete `resolver` with the completion value of `promiseOrValue`, or instead with `optionalValue` if it is provided.

Returns a new promise that will complete when `promiseOrValue` is completed, with the completion value of `promiseOrValue`, or instead with `optionalValue` if it is provided.

**Note:** If `promiseOrValue` is not an immediate value, it can be anything that supports the promise API (i.e. `then()`), so you can pass a `deferred` as well.  Similarly, `resolver` can be anything that supports the resolver API (i.e. `resolve()`, `reject()`), so a `deferred` will work there, too.

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

when.execute()
--------------

The internal function that is used to call/execute a handler.
This function can be configured.

```javascript
when.execute(handler, value)
```

Where:

* `handler` is the function (or something *executable*) that will be called
* `value` is the data that will be passed to the function

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

Configuration
=============

The exported `when` object can be configured/customized in some extent.
To do this it is necessary to create the global `when` object before loading of the `when.js` module.

```javascript
when = {
    customize: function(api) {
        // Deletes global config object
        delete this.when; 
    },
    execute: function(handler, value) {
        // This is the default implementation
        return handler(value);
    },
    functionalHandler: false
};
```

The following configuration parameters are supported:

* `customize`: function that should be called before returning module definition;
    the module definition is passed as an argument; for example, can be used to change public API
    or clear/delete global config.
* `execute`: function that should be used to call/execute any handler/callback instead of default implementation; 
    a handler is passed as the first argument, the resolution/rejection/progress value is passed as the second argument.
* `functionalHandler`: a boolean value that specifies whether only functions are allowed as handlers/callbacks;
    it is useful when redefining `execute` function; the default value is `true`.
    
All of the configuration parameters are optional. 

Running the Unit Tests
======================

Install [buster.js](http://busterjs.org/)

`npm install -g buster`

Run unit tests in Node:

1. `buster test -e node`

Run unit tests in Browsers (and Node):

1. `buster server` - this will print a url
2. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
3. `buster test` or `buster test -e browser`

References
----------

Much of this code was inspired by @[unscriptable](https://github.com/unscriptable)'s [tiny promises](https://github.com/unscriptable/promises), the async innards of [wire.js](https://github.com/cujojs/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)

Some of the code has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
