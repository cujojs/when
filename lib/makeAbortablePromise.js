/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function makeAbortablePromise(Promise) {

		function AbortablePromise(resolver) {
			Promise.call(this, makeAbortableResolver(resolver, this));
		}

		AbortablePromise.prototype = Object.create(Promise.prototype);

		// Set constructor so that Promise.prototype.then will work
		AbortablePromise.prototype.constructor = AbortablePromise;

		AbortablePromise.prototype.then = function(f, r, p) {
			var child = Promise.prototype.then.call(this, f, r, p);

			// Propagate abort to child via handler
			child._handler.abort = this._handler.abort;

			return child;
		};

		AbortablePromise.prototype.abort = function() {
			var handler = this._handler;

			if (typeof handler.abort !== 'function') {
				return;
			}

			// Detach abort so it can only be called once
			var fn = handler.abort;
			handler.abort = null;

			try {
				// aborter may return a promise to control the outcome of
				// the abort process.
				var abortResult = fn.apply(void 0, arguments);
				handler.resolve(abortResult);

				// Ensure return value is always a promise, specifically a
				// non-abortable promise
				return Promise.resolve(abortResult);
			} catch (e) {
				console.error(e.stack);
				handler.reject(e);
			}
		};

		function makeAbortableResolver(task, abortablePromise) {
			return function() {
				runAbortableTask(task, abortablePromise._handler);
			};
		}

		function runAbortableTask(task, handler) {
			// Make rejecting be the default abort behavior.
			handler.abort = defaultAbort;

			// Resolver may return an aborter function
			var result = task(abortableResolve, abortableReject);

			// If it did, stash it on the handler
			if(typeof result === 'function') {
				handler.abort = result;
			}

			function abortableResolve(x) {
				// If x is also an abortable promise, propagate its abort function
				// to handler.
				handler.abort = getAbort(x);
				handler.resolve(x);
			}

			function abortableReject(e) {
				// Always disable abort upon reject
				handler.abort = null;
				handler.reject(e);
			}

			function defaultAbort(x) {
				handler.reject(x);
			}
		}

		return AbortablePromise;
	};

	function getAbort (x) {
		// Make a reasonable attempt to recognize abortable thenables
		return maybeThenable(x) ? x.abort : null;
	}

	function maybeThenable(x) {
		return (typeof x === 'object' || typeof x === 'function') && x !== null;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
