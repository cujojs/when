A lightweight CommonJS Promises/A compliant and `when()` implementation.  It also provides several other useful Promise-related concepts, such as joining and chaining.

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

create a new Deferred containing separate `promise` and `resolver` parts:

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
var promise = deferred.promise;
promise.then(callback, errback, progressback);
```

The `resolver` API:

```javascript
resolver.resolve(value);
resolver.reject(err);
resolver.progress(update);
```

when.some()
-----------

```javascript
when.some(promisesOrValues, howMany, callback, errback, progressback)
```

return a promise that will resolve when `howMany` of the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array of length `howMany` containing the resolutions values of the triggering `promisesOrValues`.

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
when.chain(promise, resolver, optionalValue)
```

Ensures that resolution of `promise` will cause `resolver` to complete (resolve or reject) with the completion value of `promise`, or instead with `optionalValue` if it is provided.

References
----------

Much of this code is based on @[unscriptable](http://github.com/unscriptable)'s [tiny promises](http://github.com/unscriptable/promises), the async innards of [wire.js](http://github.com/briancavalier/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)
