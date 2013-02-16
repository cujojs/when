/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 2.x.x
 */

(function(define) { 'use strict';
define(function() {
	var undef, nextTick, slice, reduceArray;

	/*global setImmediate:true */
	nextTick = typeof process === 'object' ? process.nextTick
	: typeof setImmediate === 'function' ? setImmediate
	: function(task) { setTimeout(task, 0); };

	function identity(x) { return x; }
	function noop() {}


	function Promise(then) {
		this.then = then;
	}

	Promise.prototype = {
		/**
		 * Register a callback that will be called when a promise is
		 * fulfilled or rejected.  Optionally also register a progress handler.
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress)
		 * @param {function?} [onFulfilledOrRejected]
		 * @param {function?} [onProgress]
		 * @return {Promise}
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		},

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @return {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		yield: function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.spread(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @return {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		}
	};


	// Duck-typing for promises
	function isPromise(p) {
		return (p && typeof p.then === 'function');
	}

	// Wrap an external promise with a trusted promise.
	function canonize(promise) {
		var trigger = defer();
		promise.then(
			function(x) { trigger.resolve(x);  },
			function(x) { trigger.reject(x);   },
			function(x) { trigger.progress(x); });
		return trigger.promise;
	}

	function promiseFor(value, defaultKind) {
		if (!isPromise(value)) {
			return defaultKind(value);
		} else if (!(value instanceof Promise)) {
			return canonize(value);
		} else {
			return value;
		}
	}


	// A promise that immediately calls an onFulfilled handler with a value.
	function fulfilled(value) {
		var self = new Promise(function(onFulfilled) {
			if (typeof onFulfilled !== 'function') {
				return self;
			}

			try {
				return promiseFor(onFulfilled(value), fulfilled);
			} catch (err) {
				return rejected(err);
			}
		});

		return self;
	}

	// A promise that immediately calls an onRejected handler with a reason.
	function rejected(reason) {
		var self = new Promise(function(onFulfilled, onRejected) {
			if (typeof onRejected !== 'function') {
				return self;
			}

			try {
				return promiseFor(onRejected(reason), fulfilled);
			} catch (err) {
				return rejected(err);
			}
		});

		return self;
	}

	function progressing(update) {
		var self = new Promise(function(onFulfilled, onRejected, onProgress) {
			if (typeof onProgress !== 'function') {
				return self;
			}

			try {
				return promiseFor(onProgress(update), progressing);
			} catch (err) {
				return progressing(err);
			}
		});

		return self;
	}


	// Pumps through a chain of handlers for every external stimulus.
	var gTrampoline = (function() {
		var stack = [];
		var running = false;

		function pump() {
			running = true;
			try {
				while (stack.length > 0) {
					stack.pop()();
				}
			} finally {
				running = false;
			}
		}

		return {
			invoke: function(f) {
				stack.push(f);
				if (!running) {
					pump();
				}
			},

			push: function(f) {
				stack.push(f);
			},

			pump: pump
		};
	})();

	// Defers the execution of a chain of handlers until a later tick
	// in the event loop.
	function Trampoline() {
		var _invoke;
		var stack = [];

		function callLater(f) {
			stack.push(f);
			_invoke = callPush;

			nextTick(function() {
				_invoke = callImmediate;
				while (stack.length > 0) {
					gTrampoline.push(stack.pop());
				}

				gTrampoline.pump();
			});
		}

		function callPush(f) {
			stack.push(f);
		}

		function callImmediate(f) {
			gTrampoline.invoke(f);
		}

		_invoke = callLater;

		return {
			invoke: function(f) {
				return _invoke(f);
			}
		};
	}


	// Resolves an associate promise, invoking it handlers via
	// the provided trampoline.
	function deferred(trampoline) {
		var _handlers = [];
		var _promise;
		var _then, _resolve, _reject, _progress;

		function liveThen(onFulfilled, onRejected, onProgress) {
			var trigger = deferred(trampoline);

			_handlers.push(function(promise) {
				promise
					.then(onFulfilled, onRejected, onProgress)
					.then(
						function(x) { trigger.resolve(x);  },
						function(x) { trigger.reject(x);   },
						function(x) { trigger.progress(x); });
			});

			return trigger.promise;
		}

		function deadThen(onFulfilled, onRejected, onProgress) {
			trampoline = new Trampoline();
			_handlers = [];
			_then = liveThen;

			fire(_promise);
			return liveThen(onFulfilled, onRejected, onProgress);
		}

		function fire(promise) {
			var _trampoline = trampoline;
			_trampoline.invoke(function() {
				_then = deadThen;

				for (var i = _handlers.length - 1; i >= 0; --i) {
					_trampoline.invoke(_handlers[i].bind(undef, promise));
				}
			});
		}

		function freeze(promise) {
			var oldPromise = _promise;
			_promise = promise;

			_resolve = function(value) {
				return defer().resolve(value);
			};
			_reject = function(reason) {
				return defer().reject(reason);
			};
			_progress = identity;

			return oldPromise;
		}


		_resolve = function(value) {
			value = promiseFor(value, fulfilled);
			fire(value);
			return freeze(value);
		};

		_reject = function(reason) {
			reason = rejected(reason);
			fire(reason);
			return freeze(reason);
		};

		_progress = function(update) {
			fire(progressing(update));
			trampoline = new Trampoline();
			return update;
		};

		_then = liveThen;
		_promise = new Promise(function(onSuccess, onFailure, onProgress) {
			return _then(onSuccess, onFailure, onProgress);
		});

		var resolver = {
			resolve: function(value) {
				return _resolve(value);
			},

			reject: function(reason) {
				return _reject(reason);
			},

			progress: function(update) {
				return _progress(update);
			}
		};

		return {
			promise: _promise,
			resolver: resolver,

			then: _promise.then,
			resolve: resolver.resolve,
			reject: resolver.reject,
			progress: resolver.progress
		};
	}

	function defer() {
		return deferred(new Trampoline());
	}


	function when(promise, onFulfilled, onRejected, onProgress) {
		return defer().resolve(promise).then(onFulfilled, onRejected, onProgress);
	}

	when.defer = defer;
	when.isPromise = isPromise; // Determine if a thing is a promise
	when.resolve = function(value) {
		return defer().resolve(value);
	};
	when.reject = function(reason) {
		// Rejection passes the reason on verbatim, whether or not it's a promise.
		//   Because we -do- want to chain onto the reason here if it's a promise,
		//   we have to send it through the success path first, then redirect it
		//   into the failure path.
		//
		// This has the side effect that
		//   when.defer().reject(x) is not the same as when.reject(x).
		return defer().resolve(reason).then(rejected);
	};


	/*
	 * Non-core primitives
	 */

	slice = [].slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.
	reduceArray = [].reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/

			// ES5 dictates that reduce.length === 1

			// This implementation deviates from ES5 spec in the following ways:
			// 1. It does not check if reduceFunc is a Callable

			var arr, args, reduced, len, i;

			i = 0;
			// This generates a jshint warning, despite being valid
			// "Missing 'new' prefix when invoking a constructor."
			// See https://github.com/jshint/jshint/issues/392
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				// Skip holes
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	/**
	 * Helper that checks arrayOfCallbacks to ensure that each element is either
	 * a function, or null or undefined.
	 * @private
	 * @param {number} start index at which to start checking items in arrayOfCallbacks
	 * @param {Array} arrayOfCallbacks array to check
	 * @throws {Error} if any element of arrayOfCallbacks is something other than
	 * a functions, null, or undefined.
	 */
	function checkCallbacks(start, arrayOfCallbacks) {
		// TODO: Promises/A+ update type checking and docs
		var arg, i = arrayOfCallbacks.length;

		while(i > start) {
			arg = arrayOfCallbacks[--i];

			if (arg != null && typeof arg != 'function') {
				throw new Error('arg '+i+' must be a function');
			}
		}
	}


	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 * resolved first, or will reject with an array of (promisesOrValues.length - howMany) + 1
	 * rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		checkCallbacks(2, arguments);

		return when(promisesOrValues, function(promisesOrValues) {

			var toResolve, toReject, values, reasons, deferred, fulfillOne, rejectOne, progress, len, i;

			len = promisesOrValues.length >>> 0;

			toResolve = Math.max(0, Math.min(howMany, len));
			values = [];

			toReject = (len - toResolve) + 1;
			reasons = [];

			deferred = defer();

			// No items in the input, resolve immediately
			if (!toResolve) {
				deferred.resolve(values);

			} else {
				progress = deferred.progress;

				rejectOne = function(reason) {
					reasons.push(reason);
					if(!--toReject) {
						fulfillOne = rejectOne = noop;
						deferred.reject(reasons.slice());
					}
				};

				fulfillOne = function(val) {
					// This orders the values based on promise resolution order
					// Another strategy would be to use the original position of
					// the corresponding promise.
					values.push(val);

					if (!--toResolve) {
						fulfillOne = rejectOne = noop;
						deferred.resolve(values.slice());
					}
				};

				for(i = 0; i < len; ++i) {
					if(i in promisesOrValues) {
						when(promisesOrValues[i], fulfiller, rejecter, progress);
					}
				}
			}

			return deferred.then(onFulfilled, onRejected, onProgress);

			function rejecter(reason) {
				rejectOne(reason);
			}

			function fulfiller(val) {
				fulfillOne(val);
			}

		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		checkCallbacks(1, arguments);
		return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @return {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return map(arguments, identity);
	}

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @param {Array|Promise} promise array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function} mapFunc mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(promise, mapFunc) {
		return when(promise, function(array) {
			var results, len, toResolve, resolve, i, d;

			// Since we know the resulting length, we can preallocate the results
			// array to avoid array expansions.
			toResolve = len = array.length >>> 0;
			results = [];
			d = defer();

			if(!toResolve) {
				d.resolve(results);
			} else {

				resolve = function resolveOne(item, i) {
					when(item, mapFunc).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							d.resolve(results);
						}
					}, d.reject);
				};

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolve(array[i], i);
					} else {
						--toResolve;
					}
				}

			}

			return d.promise;

		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = slice.call(arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	/**
	 * Ensure that resolution of promiseOrValue will trigger resolver with the
	 * value or reason of promiseOrValue, or instead with resolveValue if it is provided.
	 *
	 * @param promiseOrValue
	 * @param {Object} resolver
	 * @param {function} resolver.resolve
	 * @param {function} resolver.reject
	 * @param {*} [resolveValue]
	 * @returns {Promise}
	 */
	function chain(promiseOrValue, resolver, resolveValue) {
		var useResolveValue = arguments.length > 2;

		return when(promiseOrValue,
			function(val) {
				val = useResolveValue ? resolveValue : val;
				resolver.resolve(val);
				return val;
			},
			function(reason) {
				resolver.reject(reason);
				return rejected(reason);
			},
			resolver.progress
		);
	}

	when.join      = join;      // Join 2 or more promises

	when.all       = all;       // Resolve a list of promises
	when.map       = map;       // Array.map() for promises
	when.reduce    = reduce;    // Array.reduce() for promises

	when.any       = any;       // One-winner race
	when.some      = some;      // Multi-winner race

	when.chain     = chain;     // Make a promise trigger another resolver

	return when;
});
})(typeof define == 'function' && define.amd
	? define
	: function (factory) { typeof exports === 'object'
		? (module.exports = factory())
		: (this.when      = factory());
	}
	// Boilerplate for AMD, Node, and browser global
);
