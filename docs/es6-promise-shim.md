# ES6 Promise shim

When 3.0.0 includes a shim for [ES6 Promise](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-constructor).  To use it, simply load `when/es6-shim/Promise.js` via script tag or as a module.  The shim will create a global `Promise` constructor.

## Global script

```html
<script src="path/to/when/es6-shim/Promise.js></script>

<script>
	// window.Promise is available
	Promise.resolve('hello Promise!').then(alert);
</script>
```

## AMD

```js
// AMD Loader Config
// for example, using curl.js
curl.config({
	// ... other config ...
	// preload and window.Promise will be available
	preloads: ['when/es6-shim/Promise']
});

// Elsewhere
define(function() {

	// Use window.Promise
	return function myXhrGet(url) {
		return new Promise(function(resolve, reject) {
			// Do XHR stuff
			resolve(theData);
		});
	}

});
```

## Node/CommonJS

```js
// Load this somewhere, early and it will add global Promise
require('when/es6-shim/Promise');

// Elsewhere
// use global Promise
function doAsyncStuff() {
	return new Promise(function(resolve, reject) {
		// Do stuff
		resolve(theAnswer);
	});
}
```

## Promise API

Brief descriptions of the ES6 Promise API are provided here for quick reference.  For complete documentation, see the [ES6 Draft Spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-promise-constructor)

### Promise Constructor

```js
var promise = new Promise(resolver)
```

Create a new Promise whose fate is controller by the provided `resolver` function, which has the signature `function resolver(resolve:function, reject:function)`.

### Promise.resolve

```js
var promise = Promise.resolve(x)
```

Get a Promise for the supplied `x`. If `x` is already a trusted promise, it is returned.  If `x` is a value, the returned promise will be fulfilled with `x`.  If `x` is a thenable, the returned promise will follow `x`, adopting its eventual state (fulfilled or rejected).

**Note:** When's Promise shim provides `Promise.resolve` because [it was recently decided](http://esdiscuss.org/topic/the-promise-resolve-cast-tldr) that `Promise.cast` would be renamed to `Promise.resolve`.

### Promise.reject

```js
var promise = Promise.reject(error)
```

Create a new rejected Promise with the supplied error as the rejection reason.

### Promise.all

```js
var promise = Promise.all(array)
```

Create a new Promise that will fulfill once all promises in the input array fulfill, or will reject when any one promise in the input array rejects.

### Promise.race

```js
var promise = Promise.race(array)
```

Create a new Promise that will settle to the same state as the first input promise to settle.

### promise.then

```js
var promise2 = promise1.then(onFulfilled, onRejected)
```

Transform the value of a Promise, returning a new Promise for the result.

### promise.catch

```js
var promise2 = promise1.catch(onRejected)
```

Attempt to recover from intermediate errors, returning a new Promise for the result.