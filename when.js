/**
 * @license Copyright (c) 2011 Brian Cavalier
 * LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
 * to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */

/**
 * @fileOverview when.js
 * @version 0.9.3
 * @author brian@hovercraftstudios.com
 */
(function(define, undef) {
define([], function() {

	// No-op function used in function replacement in various
	// places below.
	function noop() {}

	// Use freeze if it exists
	var freeze = Object.freeze || noop;

	/**
	 * Creates a new, CommonJS compliant, Deferred with fully isolated
	 * resolver and promise parts, either or both of which may be given out
	 * safely to consumers.
	 * The Deferred itself has the full API: resolve, reject, progress, and
	 * then. The resolver has resolve, reject, and progress.  The promise
	 * only has then.
	 *
	 * @memberOf when
	 * @function
	 *
	 * @returns {Deferred}
	 */
	function defer() {
		var deferred, promise, resolver, result, listeners, tail,
			_then, _progress, complete;

		/**
		 * @private
		 * @param callback
		 * @param errback
		 * @param progback
		 */
		_then = function(callback, errback, progback) {
			var d, listener;

			listener = {
				deferred: (d = defer()),
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
		};

		/**
		 * Registers a handler for this {@link Deferred}'s {@link Promise}
		 *
		 * @memberOf Promise
		 *
		 * @param callback {Function}
		 * @param [errback] {Function}
		 * @param [progback] {Function}
		 */
		function then(callback, errback, progback) {
			return _then(callback, errback, progback);
		}

		/**
		 * Resolves this {@link Deferred}'s {@link Promise} with val as the
		 * resolution value.
		 *
		 * @memberOf Resolver
		 *
		 * @param val anything
		 */
		function resolve(val) {
			complete('resolve', val);
		}

		/**
		 * Rejects this {@link Deferred}'s {@link Promise} with err as the
		 * reason.
		 *
		 * @memberOf Resolver
		 *
		 * @param err anything
		 */
		function reject(err) {
			complete('reject', err);
		}

		/**
		 * @private
		 * @param update
		 */
		_progress = function(update) {
			var listener, progress;

			listener = listeners;

			while(listener) {
				progress = listener.progress;
				if(progress) progress(update);
				listener = listener.next;
			}
		};

		/**
		 * Emits a progress update to all progress observers registered with
		 * this {@link Deferred}'s {@link Promise}
		 *
		 * @memberOf Resolver
		 *
		 * @param update anything
		 */
		function progress(update) {
			_progress(update);
		}

		complete = function(which, val) {
			// Save original _then
			var origThen = _then;

			// Replace _then with one that immediately notifies
			// with the result.
			_then = function newThen(callback, errback) {
				var promise = origThen(callback, errback);
				notify(which);
				return promise;
			};

			// Replace complete so that this Deferred
			// can only be completed once.  Note that this leaves
			// notify() intact so that it can be used in the
			// rewritten _then above.
			// Replace _progress, so that subsequent attempts
			// to issue progress throw.
			complete = _progress = function alreadyCompleted() {
				throw new Error("already completed");
			};

			// Final result of this Deferred.  This is immutable
			result = val;

			// Notify listeners
			notify(which);
		};

        function notify(which) {
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
							_chain(newResult, ldeferred);

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
						// TODO: Should it *also* switch this promise's handlers to failed??
						// I think no.
						// which = 'reject';

						ldeferred.reject(e);
					}
				}
			}
		}

		/**
		 * The full Deferred object, with both {@link Promise} and {@link Resolver}
		 * parts
		 * @class Deferred
		 * @name Deferred
		 * @extends Resolver
		 * @extends Promise
		 */
		deferred = {};

		// Promise and Resolver parts

		/**
		 * The Promise API
		 * @class Promise
		 * @name Promise
		 */
		promise =
		/**
		 * The {@link Promise} for this {@link Deferred}
		 * @memberOf Deferred
		 * @name promise
		 * @type {Promise}
		 */
		deferred.promise = {
			then: (deferred.then = then)
		};

		/**
		 * The Resolver API
		 * @class Resolver
		 * @name Resolver
		 */
		resolver =
		/**
		 * The {@link Resolver} for this {@link Deferred}
		 * @memberOf Deferred
		 * @name resolver
		 * @type {Resolver}
		 */
		deferred.resolver = {
			resolve:  (deferred.resolve  = resolve),
			reject:   (deferred.reject   = reject),
			progress: (deferred.progress = progress)
		};

		// Freeze Promise and Resolver APIs
		freeze(promise);
		freeze(resolver);

		return deferred;
	}

	/**
	 * Determines if promiseOrValue is a promise or not.  Uses the feature
	 * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
	 * promiseOrValue is a promise.
	 *
	 * @param promiseOrValue anything
	 *
	 * @returns {Boolean} true if promiseOrValue is a {@link Promise}
	 */
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @function
	 * @name when
	 * @namespace
	 *
	 * @param promiseOrValue
	 * @param {Function} [callback]
	 * @param {Function} [errback]
	 * @param {Function} [progressHandler]
	 *
	 * @returns {Promise}
	 */
	function when(promiseOrValue, callback, errback, progressHandler) {
		var deferred, resolve, reject;

		deferred = defer();

		resolve = callback ? callback : function(val) { return val; };
		reject  = errback  ? errback  : function(err) { return err; };

		if(isPromise(promiseOrValue)) {
			// If it's a promise, ensure that deferred will complete when promiseOrValue
			// completes.
			promiseOrValue.then(resolve, reject, progressHandler);
			_chain(promiseOrValue, deferred);

		} else {
			// If it's a value, resolve immediately
			deferred.resolve(resolve(promiseOrValue));

		}

		return deferred.promise;
	}

	/**
	 * Return a promise that will resolve when howMany of the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array of
	 * length howMany containing the resolutions values of the triggering promisesOrValues.
	 *
	 * @memberOf when
	 * 
	 * @param promisesOrValues
	 * @param howMany
	 * @param [callback]
	 * @param [errback]
	 * @param [progressHandler]
	 *
	 * @returns {Promise}
	 */
	function some(promisesOrValues, howMany, callback, errback, progressHandler) {
		var toResolve, results, ret, deferred, resolver, rejecter, handleProgress;

		toResolve = Math.max(0, Math.min(howMany, promisesOrValues.length));
		results = [];
		deferred = defer();
		ret = (callback || errback || progressHandler)
			? deferred.then(callback, errback, progressHandler)
			: deferred.promise;

		// Resolver for promises.  Captures the value and resolves
		// the returned promise when toResolve reaches zero.
		// Overwrites resolver var with a noop once promise has
		// be resolved to cover case where n < promises.length
		resolver = function(val) {
			results.push(val);
			if(--toResolve === 0) {
				resolver = handleProgress = noop;
				deferred.resolve(results);
			}
		};

		// Wrapper so that resolver can be replaced
		function resolve(val) {
			resolver(val);
		}

		// Rejecter for promises.  Rejects returned promise
		// immediately, and overwrites rejecter var with a noop
		// once promise to cover case where n < promises.length.
		// TODO: Consider rejecting only when N (or promises.length - N?)
		// promises have been rejected instead of only one?
		rejecter = function(err) {
			rejecter = handleProgress = noop;
			deferred.reject(err);
		};

		// Wrapper so that rejecer can be replaced
		function reject(err) {
			rejecter(err);
		}

		handleProgress = function(update) {
			deferred.progress(update);
		};

		function progress(update) {
			handleProgress(update);
		}

		if(toResolve === 0) {
			deferred.resolve(results);
		} else {
			_each(promisesOrValues, resolve, reject, progress);
		}

		return ret;
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 *
	 * @memberOf when
	 *
	 * @param promisesOrValues {Array}
	 * @param [callback] {Function}
	 * @param [errback] {Function}
	 * @param [progressHandler] {Function}
	 *
	 * @returns {Promise}
	 */
	function all(promisesOrValues, callback, errback, progressHandler) {
		return some(promisesOrValues, promisesOrValues.length, callback, errback, progressHandler);
	}

	/**
	 * Return a promise that will resolve when any one of the supplied promisesOrValues
	 * has resolved. The resolution value of the returned promise will be the resolution
	 * value of the triggering promiseOrValue.
	 *
	 * @memberOf when
	 *
	 * @param promisesOrValues {Array}
	 * @param [callback] {Function}
	 * @param [errback] {Function}
	 * @param [progressHandler] {Function}
	 *
	 * @returns {Promise}
	 */
	function any(promisesOrValues, callback, errback, progressHandler) {

		function unwrapSingleResult(val) {
			return callback(val[0]);
		}
		
		return some(promisesOrValues, 1, unwrapSingleResult, errback, progressHandler);
	}

	function _each(promisesOrValues, resolve, reject, progress) {
		var promiseOrValue, i = 0;

		while ((promiseOrValue = promisesOrValues[i++])) {
			when(promiseOrValue, resolve, reject, progress);
		}
	}

	function each(promisesOrValues, resolve, reject, progress) {
		return all(_each(promisesOrValues, resolve, reject, progress));
	}

	function map(promisesOrValues, mapFunc) {
		var promiseOrValue, results, i = 0;

		results = new Array(promisesOrValues.length);

		for (; (promiseOrValue = promisesOrValues[i]); i++) {
			results[i] = when(promiseOrValue)
				.then(function(val) {
					return mapFunc(val);
				});
		}

		// Not sure whether it's better to return the array of promises
		// or a single promise for all of them to complete
		return all(results);
	}

	function reduce(promisesOrValues, reduceFunc, initialValue) {

		var total = promisesOrValues.length;

		function reduceNext(current, i) {
			if (i === total) return current;

			return when(current).then(
				function(currentValue) {

					return when(promisesOrValues[i]).then(
						function(value) {
							return reduceNext(reduceFunc(currentValue, value, i, total), i + 1);
						});
				});
		}

		return reduceNext(initialValue, 0);
	}

	/**
	 * Ensure that resolution of promiseOrValue will complete resolver with the completion
	 * value of promiseOrValue, or instead with optionalValue if it is provided.
	 *
	 * @memberOf when
	 *
	 * @param promiseOrValue
	 * @param resolver {Resolver}
	 * @param [resolveValue] anything
	 *
	 * @returns {Promise}
	 */
	function chain(promiseOrValue, resolver, resolveValue) {
		var inputPromise, initChain;

		inputPromise = when(promiseOrValue);

		// Check against args length instead of resolvedValue === undefined, since
		// undefined may be a valid resolution value.
		initChain = arguments.length > 2
			? function(resolver) { return _chain(inputPromise, resolver, resolveValue) }
			: function(resolver) { return _chain(inputPromise, resolver); };

		// Setup chain to supplied resolver
		initChain(resolver);

		// Setup chain to new promise
		return initChain(when.defer()).promise;
	}

	/**
	 * @private
	 * Internal chain helper that does not create a new deferred/promise
	 * Always returns it's 2nd arg.
	 * NOTE: deferred must be a when.js deferred, or a resolver whose functions
	 * can be called without their original context.
	 *
	 * @param promise
	 * @param deferred
	 * @param resolveValue
	 *
	 * @returns deferred
	 */
	function _chain(promise, deferred, resolveValue) {
		promise.then(
			// If resolveValue was supplied, need to wrap up a new function
			// If not, can use deferred.resolve directly
			arguments.length > 2
				? function() { deferred.resolve(resolveValue) }
				: deferred.resolve,
			deferred.reject,
			deferred.progress
		);

		return deferred;
	}

	//
	// Public API
	//

	when.defer     = defer;

	when.isPromise = isPromise;
	when.some      = some;
	when.all       = all;
	when.any       = any;

	when.reduce    = reduce;
	when.map       = map;

	when.chain     = chain;

	return when;

}); // define
})(typeof define != 'undefined'
	// use define for AMD if available
	? define
	// If no define, look for module to export as a CommonJS module.
	// If no define or module, attach to current context.
	: typeof module != 'undefined'
		? function(deps, factory) { module.exports = factory(); }
		: function(deps, factory) { this.when = factory(); }
);