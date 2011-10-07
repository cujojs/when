/**
 * @license Copyright (c) 2011 Brian Cavalier
 * LICENSE: see the LICENSE.txt file. If file is missing, this file is subject
 * to the MIT License at: http://www.opensource.org/licenses/mit-license.php.
 */

/**
 * when.js
 * @version 0.9.4
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
	 * Allocate a new Array of size n
	 * @private
	 * @param n {number} size of new Array
	 * @returns {Array}
	 */
	function allocateArray(n) {
		return new Array(n);
	}

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
        var deferred, promise, resolver, result, listeners, _then, _progress, complete;

        listeners = [];

		/**
		 * @private
		 * @param callback
		 * @param errback
		 * @param progback
		 */
		_then = function unresolvedThen(callback, errback, progback) {
            var d = defer();
            
            listeners.push({
				deferred: d,
				resolve: callback,
				reject: errback,
				progress: progback
			});

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
			var listener, progress, i = 0;

            while(listener = listeners[i++]) {
                progress = listener.progress;
                progress && progress(update);
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
            
            function notifyAll(result) {
                var listener, ldeferred, newResult, handler, i = 0;

                while(listener = listeners[i++]) {

                    ldeferred = listener.deferred;

                    handler = listener[which];
                    if (handler) {
                        try {
                            newResult = handler(result);

                            if (isPromise(newResult)) {
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
                        } catch (e) {
                            // Exceptions cause chained deferreds to complete
                            // TODO: Should it *also* switch this promise's handlers to failed??
                            // I think no.
                            // which = 'reject';

                            ldeferred.reject(e);
                        }
                    }
                }

                listeners = [];
            }

            // In case this promise was resolved with another promise!
            if(isPromise(result)) {
                result.then(notifyAll);
            } else {
                notifyAll(result);
            }
		}

		/**
		 * The full Deferred object, with both {@link Promise} and {@link Resolver}
		 * parts
		 * @class Deferred
		 * @name Deferred
		 * @augments Resolver
		 * @augments Promise
		 */
		deferred = {};

		// Promise and Resolver parts

		/**
		 * The Promise API
		 * @namespace Promise
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
		 * @namespace Resolver
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
	 * @param promiseOrValue anything
	 * @param {Function} [callback]
	 * @param {Function} [errback]
	 * @param {Function} [progressHandler]
	 *
	 * @returns {Promise}
	 */
	function when(promiseOrValue, callback, errback, progressHandler) {
        var resolve, reject;
        
        resolve = callback ? callback : function(val) { return val; };
        reject = errback ? errback : function(err) { return err; };

        return isPromise(promiseOrValue)
            ? promiseOrValue.then(resolve, reject, progressHandler)
            : resolved(resolve(promiseOrValue));

    }

    /**
     * Creates a promise that is immediately resolved to the supplied value
     * @param value anything
     */
    function resolved(value) {
        var deferred = defer();
        deferred.resolve(value);
        return deferred.promise;
    }

	/**
	 * Return a promise that will resolve when howMany of the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array of
	 * length howMany containing the resolutions values of the triggering promisesOrValues.
	 *
	 * @memberOf when
	 * 
	 * @param promisesOrValues {Array} array of anything, may contain a mix
	 *      of {@link Promise}s and values
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
			// This orders the values based on promise resolution order
			// Another strategy would be to use the original position of
			// the corresponding promise.
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
			var promiseOrValue, i = 0;
			while ((promiseOrValue = promisesOrValues[i++])) {
				when(promiseOrValue, resolve, reject, progress);
			}
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
	 * @param promisesOrValues {Array} array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param [callback] {Function}
	 * @param [errback] {Function}
	 * @param [progressHandler] {Function}
	 *
	 * @returns {Promise}
	 */
	function all(promisesOrValues, callback, errback, progressHandler) {

		function reduceIntoArray(current, val, i) {
			current[i] = val;
			return current;
		}

		var results, promise;
		
		results = allocateArray(promisesOrValues.length);
		promise = reduce(promisesOrValues, reduceIntoArray, results);

		return when(promise, callback, errback, progressHandler);
	}

	/**
	 * Return a promise that will resolve when any one of the supplied promisesOrValues
	 * has resolved. The resolution value of the returned promise will be the resolution
	 * value of the triggering promiseOrValue.
	 *
	 * @memberOf when
	 *
	 * @param promisesOrValues {Array} array of anything, may contain a mix
	 *      of {@link Promise}s and values
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

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @memberOf when
	 *
	 * @param promisesOrValues {Array} array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param mapFunc {Function} mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 *
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(promisesOrValues, mapFunc) {

		function mapIntoArray(current, value, i) {
			current[i] = mapFunc(value);
			return current;
		}

		var results = allocateArray(promisesOrValues.length);

		return reduce(promisesOrValues, mapIntoArray, results);
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain {@link Promise}s and/or values, but reduceFunc
	 * may return either a value or a {@link Promise}, *and* initialValue may
	 * be a {@link Promise} for the starting value.
	 * 
	 * @memberOf when
	 *
	 * @param promisesOrValues {Array} array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param reduceFunc {Function} reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @param initialValue starting value, or a {@link Promise} for the starting value
	 *
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promisesOrValues, reduceFunc, initialValue) {

		var total, deferred, reject;

		total = promisesOrValues.length;
		deferred = defer();
		reject = deferred.reject;
		
		function reduceNext(current, i) {
			if (i === total) return current;
			
			return when(current,
				function(currentValue) {

					// Maybe make progress updates optional?
//					deferred.progress({ i: i, value: current });

					return when(promisesOrValues[i],
						function(value) {
							return reduceNext(reduceFunc(currentValue, value, i, total), i + 1);
						},
						reject
					);
				},
				reject
			);
		}

		return _chain(reduceNext(initialValue, 0), deferred).promise;
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