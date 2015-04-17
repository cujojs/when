# Debug APIs

**NOTE:** This document describes APIs that provide support to external debugging tools. Do not use these APIs in normal application logic.  For info and help on debugging promises in your application, see [Debugging Promises](api.md#debugging-promises).

These APIs allow debugging tools to receive information about promise errors.  For example, when.js's default [builtin unhandled rejection reporting](#debugging-promises) is built using these APIs, as is the long async stack trace support in [`when/monitor/console`](#whenmonitorconsole).

A debugger could use them to do any number of things, such as display a list of "currently unhandled promise rejections", or send error reports to an error aggregation service.

## Global rejection events

when.js &gt;= 3.7.0 supports global `window` events in browsers, and `process` events in Node, similar to Node's `'uncaughtException'` event. This allows applications to register a handler to receive events from all promise implementations that support these global events.

The events are:

* `'unhandledRejection'`: fired when an unhandled rejection is detected
* `'rejectionHandled'`: fired when rejection previously reported via an '`unhandledRejection'` event becomes handled

## Browser window events

The following example shows how to use global `window` events in browsers to implement simple debug output.  The `event` object has the following extra properties:

* `event.detail.reason` - the rejection reason (typically an `Error` instance)
* `event.detail.key` - opaque unique key representing the promise that was rejected.  This key can be used to correlate corresponding `unhandledRejection` and `rejectionHandled` events for the same promise.

```js
window.addEventListener('unhandledRejection', function(event) {
	// Calling preventDefault() suppresses when.js's default rejection logging
	// in favor of your own.
	event.preventDefault();
	reportRejection(event.detail.reason, event.detail.key);
}, false);

window.addEventListener('rejectionHandled', function(event) {
	// Calling preventDefault() suppresses when.js's default rejection logging
	// in favor of your own.
	event.preventDefault();
	reportHandled(event.detail.key);
}, false);

function reportRejection(error, key) {
	// Implement whatever logic your application requires
	// Log or record error state, etc.
}

function reportHandled(key) {
	// Implement whatever logic your application requires
	// Log that error has been handled, etc.
}
```

## Node global process events

The following example shows how to use global `process` events in Node.js to implement simple debug output.  The parameters passed to the `process` event handlers:

* `reason` - the rejection reason (typically an `Error` instance)
* `key` - opaque unique key representing the promise that was rejected.  This key can be used to correlate corresponding `unhandledRejection` and `rejectionHandled` events for the same promise.


```js
process.on('unhandledRejection', function(reason, key) {
	reportRejection(reason, key);
});

process.on('rejectionHandled', function(key) {
	reportHandled(key);
});

function reportRejection(error, key) {
	// Implement whatever logic your application requires
	// Log or record error state, etc.
}

function reportHandled(key) {
	// Implement whatever logic your application requires
	// Log that error has been handled, etc.
}
```

## Local when.js instance API

### Example

A good example is the default implementation in `when/lib/decorators/unhandledRejection`, which logs unhandled rejections to the `console`.

The following example shows how to combine `Promise.onPotentiallyUnhandledRejection` and `Promise.onPotentiallyUnhandledRejectionHandled` to implement a simple debug UI:

```js
var Promise = require('when').Promise;

Promise.onPotentiallyUnhandledRejection = function(rejection) {
	addToDebugDisplay(rejection.id, rejection.value);
}

Promise.onPotentiallyUnhandledRejectionHandled = function(rejection) {
	removeFromDebugDisplay(rejection.id);
}

function addToDebugDisplay(id, error) {
	// Add to custom debug UI here
}

function removeFromDebugDisplay(id) {
	// Remove from custom debug UI here
}
```

### Promise.onPotentiallyUnhandledRejection

Called for each rejected promise that appears not to have been handled.  A rejection descriptor is provided as the argument:

```
{
	id: <unique id of the rejection>
	value: <the rejection's reason>
	handled: <boolean indicating if this rejection has been handled>
	// may contain other, internal/bookkeeping fields
}
```

Technically, this is called after the internal task queue has been flushed, for each rejected promise that hasn't yet been *observed*, for example by calling its `.then` or `.catch` methods.

The `handled` flag is useful if your implementation of `onPotentiallyUnhandledRejection` uses `setTimeout` or another technique to delay reporting, since the rejection *may be handled* between the instant you call `setTimeout` and the instant the timeout function executes.  IOW, if you use `setTimeout`, you should check `handled` to verify that the rejection is still unhandled.

The default implementation in `when/lib/decorators/unhandledRejection` logs error information to `console.error` that includes the `id`.

### Promise.onPotentiallyUnhandledRejectionHandled

Called when a rejection previously passed to `Promise.onPotentiallyUnhandledRejection` becomes handled, for example if it is observed later by calling its `.then` or `.catch` methods.

It is passed the same rejection descriptor object as `Promise.onPotentiallyUnhandledRejection`.  The `handled` field will always be `true` when a descriptor is passed to `onPotentiallyUnhandledRejectionHandled`.

The default implementation in `when/lib/decorators/unhandledRejection` logs an additional message to `console.log` with the `id` indicating that the rejection has been handled.

### Promise.onFatalRejection

Called when an error propagates out of a terminal [`promise.done`](#promisedone), for example, if a callback passed to `promise.done` throws an exception.

The default implementation in `when/lib/decorators/unhandledRejection` throws an uncatchable exception that will be logged to `console.error` by browsers and will halt (crash) Node.js.
