A lightweight CommonJS Promises/A and `when()` implementation.  It also provides several other useful Promise-related concepts, such as joining and chaining.

Specifically, when.js provides:

`when(promiseOrValue, callback, errback, progressback)` - register a handler for a promise or immediate value.

`when.Deferred()` - create a new Deferred containing separate `promise` and `resolver` parts.

  * `promise.then(callback, errback, progressback)`
  * `resolver.resolve(value)`
  * `resolver.reject(err)`
  * `resolver.progress(update)`

`when.some(promisesOrValues, howMany)` - return a promise that will resolve when `howMany` of the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array of length `howMany` containing the resolutions values of the triggering `promisesOrValues`.

`when.all(promisesOrValues)` - return a promise that will resolve only once *all* the supplied `promisesOrValues` have resolved.  The resolution value of the returned promise will be an array containing the resolution values of each of the `promisesOrValues`.

`when.any(promisesOrValues)` - return a promise that will resolve when any one of the supplied `promisesOrValues` has resolved.  The resolution value of the returned promise will be the resolution value of the triggering `promiseOrValue`.

`when.chain(firstPromise, secondPromise, optionalValue)` - ensures that resolution of `firstPromise` will cause `secondPromise` to resolve with the resolution value of `firstPromise`, or instead with `optionalValue` if it is provided.

## References

Much of this code is based on @[unscriptable](http://github.com/unscriptable)'s [tiny promises](http://github.com/unscriptable/promises), the async innards of [wire.js](http://github.com/briancavalier/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)
