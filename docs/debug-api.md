# Debug APIs

**NOTE:** This document describes APIs that provide support to external debugging tools. Do not use these APIs in application code.  For info and help on debugging promises in your application, see [Debugging Promises](api.md#debugging-promises).

These APIs allow debugging tools to receive information about promise errors.  For example, when.js's default [builtin unhandled rejection reporting](#debugging-promises) is built using these APIs, as is the long async stack trace support in [`when/monitor/console`](#whenmonitorconsole).

A debugger could use them to do any number of things, such as display a list of "currently unhandled promise rejections", or send error reports to an error aggregation service.

## Examples

A good example is the default implementation in `when/lib/decorators/unhandledRejection`, which logs unhandled rejections to the `console`.

The following example shows how to combine `Promise.onPotentiallyUnhandledRejection` and `Promise.onPotentiallyUnhandledRejectionHandled` to implement a simple debug UI:

```js
var Promise = require('when').Promise;

Promise.onPotentiallyUnhandledRejection = function(rejection) {
	addToDebugDisplay(rejection.id, rejection.value);
}

Promise.onPotentiallyUnhandledRejection = function(rejection) {
	removeFromDebugDisplay(rejection.id);
}

function addToDebugDisplay(id, error) {
	// Add to custom debug UI here
}

function removeFromDebugDisplay(id) {
	// Remove from custom debug UI here
}
```

## API

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