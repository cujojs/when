A lightweight [CommonJS](http://wiki.commonjs.org/wiki/Promises) [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) and `when()` implementation.  It also provides several other useful Promise-related concepts, such as joining and chaining.

when.js is derived from the async core of [wire.js](http://github.com/briancavalier/wire), and future versions of wire will use when.js directly.

A Simple Example
================

A simple example of using promise to signal when an image has loaded, adapted from @unscriptable's [tiny promise example](https://github.com/unscriptable/promises/blob/master/examples/tinyImageLoader.js)

``` javascript
function loadImage (src) {
	var deferred = when.defer(),
		img = document.createElement('img');
	img.onload = function () { 
		deferred.resolve(img); 
	};
	img.onerror = function () { 
		deferred.reject(new Error('Image not found: ' + src));
	};
	img.src = src;

	// Return only the promise, so that the caller cannot
	// resolve, reject, or otherwise muck with the original deferred.
	return deferred.promise;
}

// example usage:
loadImage('http://google.com/favicon.ico').then(
	function gotIt (img) {
		document.body.appendChild(img);
	},
	function doh (ex) {
		document.body.appendChild(document.createTextNode(ex.message));
	}
).then(
	function shout (img) {
		alert('see my new ' + img.src + '?');
	}
);
```

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

when.some()
-----------

```javascript
when.some(promisesOrValues, howMany, callback, errback, progressback)
```

Return a promise that will resolve when `howMany` of the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array of length `howMany` containing the resolutions values of the triggering `promisesOrValues`.

when.all()
----------

```javascript
when.some(promisesOrValues, callback, errback, progressback)
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

References
----------

Much of this code is based on @[unscriptable](http://github.com/unscriptable)'s [tiny promises](http://github.com/unscriptable/promises), the async innards of [wire.js](http://github.com/briancavalier/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)
