/**
 * @license Copyright (c) 2011 Brian Cavalier
 * LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
 * to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */

/*
	File: when.js
	Version: 0.5
*/

(function(define, undef) {
define([], function() {

	// No-op function used in function replacement in various
	// places below.
	function noop() {}

	var freeze = Object.freeze || noop;

	/*
		Constructor: Deferred
		Creates a new, CommonJS compliant, Deferred with fully isolated
		resolver and promise parts, either or both of which may be given out
		safely to consumers.
		The Deferred itself has the full API: resolve, reject, progress, and
		then. The resolver has resolve, reject, and progress.  The promise
		only has then.
	*/
	function Deferred() {
		var deferred, promise, resolver, result, listeners, tail;

		function _then(callback, errback, progback) {
			var d, listener;

			listener = {
				deferred: (d = Deferred()),
				resolve: callback,
				reject: errback,
				progress: progback
			};

			if(listeners) {
				// Append new listener if linked list already initialized
				tail = tail.next = listener;
			} else {
				// Init linked list
				listeners = tail = listener;
			}

			return d.promise;
		}

		function then(callback, errback, progback) {
			return _then(callback, errback, progback);
		}

		function resolve(val) { 
			complete('resolve', val);
		}

		function reject(err) {
			complete('reject', err);
		}
		
		function _progress(update) {
			var listener, progress;
			
			listener = listeners;

			while(listener) {
				progress = listener.progress;
				progress && progress(update);
				listener = listener.next;
			}
		}

		function progress(update) {
			_progress(update);
		}

		function complete(which, val) {
			// Save original thenImpl
			var origThen = _then;

			// Replace thenImpl with one that immediately notifies
			// with the result.
			_then = function newThen(callback, errback) {
				var promise = origThen(callback, errback);
				notify(which, result);
				return promise;
			};

			// Replace complete so that this Deferred
			// can only be completed once.  Note that this leaves
			// notify() intact so that it can be used in the
			// rewritten thenImpl above.
			// Replace progressImpl, so that subsequent attempts
			// to issue progress throw.
			complete = _progress = function alreadyCompleted() {
				throw new Error("already completed");
			};

			// Final result of this Deferred.  This is immutable
			result = val;

			// Notify listeners
			notify(which, val);
		}

		function notify(which, val) {
			// Traverse all listeners registered directly with this Deferred,
			// also making sure to handle chained thens
			while(listeners) {
				var listener, ldeferred, newResult, handler;

				listener  = listeners;
				ldeferred = listener.deferred;
				listeners = listeners.next;

				handler = listener[which];
				if(handler) {
					try {
						newResult = handler(result);

						if(isPromise(newResult)) {
							// If the handler returned a promise, chained deferreds
							// should complete only after that promise does.
							newResult.then(ldeferred.resolve, ldeferred.reject, ldeferred.progress);
						
						} else {
							// Complete deferred from chained then()
							// FIXME: Which is correct?
							// The first always mutates the chained value, even if it is undefined
							// The second will only mutate if newResult !== undefined
							// ldeferred[which](newResult);
							
							ldeferred[which](newResult === undef ? result : newResult);							

						}
					} catch(e) {
						// Exceptions cause chained deferreds to complete
						// TODO: Should this always reject()?
						// ldeferred.reject(result);
						// TODO: Should it *also* switch this promise's handlers to failed??
						// I think no.
						// which = 'reject';

						ldeferred[which](result);
					}
				}
			}			
		}

		// The full Deferred object, with both Promise and Resolver parts
		deferred = {};

		// Promise and Resolver parts

		// Expose Promise API
		promise = deferred.promise  = {
			then: (deferred.then = then)
		};

		// Expose Resolver API
		resolver = deferred.resolver = {
			resolve:  (deferred.resolve  = resolve),
			reject:   (deferred.reject   = reject),
			progress: (deferred.progress = progress)
		};

		// Freeze Promise and Resolver APIs
		freeze(promise);
		freeze(resolver);

		return deferred;
	}

	/*
		Function: isPromise
		Determines if promiseOrValue is a promise or not.  Uses the feature
		test from http://wiki.commonjs.org/wiki/Promises/A to determine if
		promiseOrValue is a promise.

		Parameters:
			promiseOrValue - anything

		Return:
		true if and only if promiseOrValue is a promise.
	*/
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/*
		Function: when
	*/
	function when(promiseOrValue, callback, errback, progressHandler) {
		var result;

		if(arguments.length == 1) {
			// If exactly one arg, assume the caller wants a promise to
			// be returned, no matter what.  If promiseOrValue is a
			// promise, return it.  If it's a value, return a new
			// promise, with promiseOrValue as the resolution value.
			if(isPromise(promiseOrValue)) {
				result = promiseOrValue;		
			} else {
				result = Deferred();
				result.resolve(promiseOrValue);
				// Make sure we return only the promise
				result = result.promise;
			}
		} else {
			// If callback args were provided, implement the "traditional"
			// when behavior, and return the result of registering
			// the callbacks with promiseOrValue if it is a promise,
			// or the result of invoking callback with promiseOrValue.
			result = isPromise(promiseOrValue)
				? promiseOrValue.then(callback, errback, progressHandler)
				: callback(promiseOrValue);
		}

		return result;
	}

	/*
		Function: some
	*/
	function some(promisesOrValues, howMany) {
		var toResolve, results, deferred;

		toResolve = Math.max(0, Math.min(howMany, promises.length));
		results = [];
		deferred = Deferred();

		// Resolver for promises.  Captures the value and resolves
		// the returned promise when toResolve reaches zero.
		// Overwrites resolver var with a noop once promise has
		// be resolved to cover case where n < promises.length
		function resolver(val) {
			results.push(val);
			if(--toResolve == 0) {
				resolver = noop;
				deferred.resolve(results);
			}
		}

		// Wrapper so that resolver can be replaced
		function resolve(val) {
			resolver(val);
		}

		// Rejecter for promises.  Rejects returned promise
		// immediately, and overwrites rejecter var with a noop
		// once promise to cover case where n < promises.length.
		// TODO: Consider rejecting only when N (or promises.length - N?)
		// promises have been rejected instead of only one?
		function rejecter(err) {
			rejecter = noop;
			deferred.reject(err);		
		}

		// Wrapper so that rejecer can be replaced
		function reject(err) {
			rejecter(err);
		}

		function handleProgress(update) {
			handleProgress = noop;
			deferred.progress(update);
		}

		function progress(update) {
			handleProgress(update);
		}

		var promiseOrValue, i = 0;
		while((promiseOrValue = promisesOrValues[i++])) {
			when(pv, resolve, reject, progress);
		}

		// TODO: Return Promise instead of Deferred
		return deferred;
	}

	/*
		Function: all
	*/
	function all(promisesOrValues, callback, errback, progressHandler) {
		return some(promisesOrValues, promisesOrValues.length, callback, errback, progressHandler);
	}

	/*
		Function: any
	*/
	function any(promisesOrValues, callback, errback, progressHandler) {
		return some(promisesOrValues, 1, callback, errback, progressHandler);		
	}

	/*
		Section: Public API
	*/

	when.Deferred  = Deferred;

	when.isPromise = isPromise;
	when.some      = some;
	when.all       = all;
	when.any       = any;

	return when;

});
})(typeof define != 'undefined' ? define : function(deps, factory){
    // global when, if not loaded via require
    this.when = factory();
});