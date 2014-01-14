/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) { 'use strict';
define(function() {

	var bind, uncurryThis, call, forEach, slice;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	call = uncurryThis(bind.call);
	slice = uncurryThis(Array.prototype.slice);
	forEach = uncurryThis(Array.prototype.forEach);
	return makePromise;

	function makePromise(environment) {

		var enqueue, setTimer, cancelTimer;

		enqueue = environment.enqueue;
		setTimer = environment.setTimeout;
		cancelTimer = environment.clearTimeout;

		/**
		 * Trusted Promise constructor.  A Promise created from this constructor is
		 * a trusted when.js promise.  Any other duck-typed promise is considered
		 * untrusted.
		 * @constructor
		 * @returns {Promise} promise whose fate is determine by resolver
		 * @name Promise
		 */
		function Promise(resolver) {
			var p = this;
			this._handler = new PendingHandler();

			// Call the resolver to seal the promise's fate
			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch(e) {
				promiseReject(e);
			}

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} x resolution value
			 */
			function promiseResolve(x) {
				p._handler = p._handler.resolve(getHandler(p, x));
			}

			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {*} reason reason for the rejection
			 */
			function promiseReject(reason) {
				p._handler = p._handler.resolve(new RejectedHandler(reason));
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} update progress event payload to pass to all listeners
			 */
			function promiseNotify(update) {
				p._handler.notify(update);
			}
		}

		function FulfilledPromise(x) {
			this._handler = new FulfilledHandler(x);
		}

		FulfilledPromise.prototype = Object.create(Promise.prototype);

		function RejectedPromise(x) {
			this._handler = new RejectedHandler(x);
		}

		RejectedPromise.prototype = Object.create(Promise.prototype);

		function ResolvedPromise(x) {
			this._handler = getHandler(this, x);
		}

		ResolvedPromise.prototype = Object.create(Promise.prototype);

		function getHandler(p, x) {
			if(p === x) {
				return new RejectedHandler(new TypeError());
			}

			if(x instanceof Promise) {
				return new FollowingHandler(x);
			}

			try {
				var untrustedThen = x === Object(x) && x.then;

				return typeof untrustedThen === 'function'
					? wrapThenable(untrustedThen, x)
					: new FulfilledHandler(x);
			} catch(e) {
				return new RejectedHandler(e);
			}
		}

		function wrapThenable (untrustedThen, x) {
			return new FollowingHandler(new Promise(function (r, reject, n) {
				enqueue(function () {
					try {
						call(untrustedThen, x, r, reject, n);
					} catch(e) {
						reject(e);
					}
				});
			}));
		}

		function PendingHandler() {
			this.consumers = [];
		}

		PendingHandler.prototype.inspect = toPendingState;

		PendingHandler.prototype.resolve = function(handler) {
			var queue = this.consumers;
			this.consumers = void 0;

			if(queue.length > 0) {
				runHandlers(queue, handler);
			}

			return handler;
		};

		PendingHandler.prototype.when = function(resolve, reject, notify, f, r, u) {
			this.consumers.push(function(handler) {
				handler.when(resolve, reject, notify, f, r, u);
			});
		};

		PendingHandler.prototype.notify = function(x) {
			var queue = this.consumers;
			enqueue(function () {
				runHandlers(queue, new ProgressHandler(x));
			});
		};

		function ProgressHandler(x) {
			this.value = x;
		}

		ProgressHandler.prototype.when = function(_, __, notify, f, r, u) {
			try {
				notify(typeof u === 'function' ? u(this.value) : this.value);
			} catch(e) {
				notify(e);
			}
		};

		function FollowingHandler(x) {
			this.promise = x;
		}

		FollowingHandler.prototype.inspect = function() {
			return this.promise.inspect();
		};

		FollowingHandler.prototype.when = function(resolve, reject, notify, f, r, u) {
			this.promise._handler.when(resolve, reject, notify, f, r, u);
		};

		function FulfilledHandler(x) {
			this.value = x;
		}

		FulfilledHandler.prototype.inspect = function() {
			return toFulfilledState(this.value);
		};

		FulfilledHandler.prototype.when = function(resolve, reject, notify, f) {
			var self = this;
			enqueue(function() {
				try {
					resolve(typeof f === 'function' ? f(self.value) : self.value);
				} catch(e) {
					reject(e);
				}
			});
		};

		function RejectedHandler(x) {
			this.value = x;
		}

		RejectedHandler.prototype.inspect = function() {
			return toRejectedState(this.value);
		};

		RejectedHandler.prototype.when = function(resolve, reject, notify, f, r) {
			var self = this;
			enqueue(function() {
				try {
					typeof r === 'function' ? resolve(r(self.value)) : reject(self.value);
				} catch(e) {
					reject(e);
				}
			});
		};

		FollowingHandler.prototype.resolve
			= FulfilledHandler.prototype.resolve
			= RejectedHandler.prototype.resolve
			= function() { return this; };

		FollowingHandler.prototype.notify
			= FulfilledHandler.prototype.notify
			= RejectedHandler.prototype.notify
			= function() {};


		// Creation

		Promise.of = of;
		Promise.empty = empty;
		Promise.cast = cast;
		Promise.resolve = resolve;
		Promise.reject = reject;
		Promise.unfold = unfold;
		Promise.iterate = iterate;

		/**
		 * Casts x to a trusted promise. If x is already a trusted promise, it is
		 * returned, otherwise a new trusted Promise which follows x is returned.
		 * @param {*} x
		 * @returns {Promise}
		 */
		function cast(x) {
			return x instanceof Promise ? x : resolve(x);
		}

		/**
		 * Returns a resolved promise. The returned promise will be
		 *  - fulfilled with promiseOrValue if it is a value, or
		 *  - if promiseOrValue is a promise
		 *    - fulfilled with promiseOrValue's value after it is fulfilled
		 *    - rejected with promiseOrValue's reason after it is rejected
		 * In contract to cast(x), this always creates a new Promise
		 * @param  {*} x
		 * @return {Promise}
		 */
		function resolve(x) {
			return new ResolvedPromise(x);
		}

		/**
		 * Return a reject promise with x as its reason (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} rejected promise
		 */
		function reject(x) {
			return new RejectedPromise(x);
		}

		/**
		 * Return a fulfilled promise with x as its value (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} fulfilled promise
		 */
		function of(x) {
			return new FulfilledPromise(x);
		}

		/**
		 * Return a promise that remains pending forever
		 * @returns {Promise} forever-pending promise.
		 */
		function empty() {
			return new Promise(identity);
		}

		/**
		 * Anamorphic unfold/map that generates values by applying
		 * handler(generator(seed)) iteratively until condition(seed)
		 * returns true.
		 * @param {function} unspool function that generates a [value, newSeed]
		 *  given a seed.
		 * @param {function} condition function that, given the current seed, returns
		 *  truthy when the unfold should stop
		 * @param {function} handler function to handle the value produced by unspool
		 * @param x {*|Promise} starting value, may be a promise
		 * @return {Promise} the result of the last value produced by unspool before
		 *  condition returns true
		 */
		function unfold(unspool, condition, handler, x) {
			return cast(x).then(function(seed) {

				return cast(condition(seed)).then(function(done) {
					return done ? seed : cast(unspool(seed)).spread(next);
				});

				function next(item, newSeed) {
					return cast(handler(item)).then(function() {
						return unfold(unspool, condition, handler, newSeed);
					});
				}
			});
		}

		/**
		 * Generate a (potentially infinite) stream of promised values:
		 * x, f(x), f(f(x)), etc. until condition(x) returns true
		 * @param {function} f function to generate a new x from the previous x
		 * @param {function} condition function that, given the current x, returns
		 *  truthy when the iterate should stop
		 * @param {function} handler function to handle the value produced by f
		 * @param {*|Promise} x starting value, may be a promise
		 * @return {Promise} the result of the last call to f before
		 *  condition returns true
		 */
		function iterate(f, condition, handler, x) {
			return cast(x).then(function(x) {

				return cast(condition(x)).then(function(done) {
					return done ? x : cast(f(x)).then(next);
				});

				function next(nextValue) {
					return cast(handler(nextValue)).then(function() {
						return iterate(f, condition, handler, nextValue);
					});
				}
			});
		}

		// Flow control operations

		/**
		 * Register handlers for this promise.
		 * @param [onFulfilled] {Function} fulfillment handler
		 * @param [onRejected] {Function} rejection handler
		 * @param [onProgress] {Function} progress handler
		 * @return {Promise} new Promise
		 */
		Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			var self = this;
			return new this.constructor(function(resolve, reject, notify) {
				self._handler.when(resolve, reject, notify, onFulfilled, onRejected, onProgress);
			});
		};

		Promise.prototype.inspect = function() {
			return this._handler.inspect();
		};

		/**
		 * Handle the ultimate fulfillment value or rejection reason, and assume
		 * responsibility for all errors.  If an error propagates out of handleResult
		 * or handleFatalError, it will be rethrown to the host, resulting in a
		 * loud stack track on most platforms and a crash on some.
		 * @param {function?} handleResult
		 * @param {function?} handleError
		 * @returns {undefined}
		 */
		Promise.prototype.done = function(handleResult, handleError) {
			this.then(handleResult, handleError)['catch'](crash);
		};

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
			return this.then(void 0, onRejected);
		};

		/**
		 * Ensures that onFulfilledOrRejected will be called regardless of whether
		 * this promise is fulfilled or rejected.  onFulfilledOrRejected WILL NOT
		 * receive the promises' value or reason.  Any returned value will be disregarded.
		 * onFulfilledOrRejected may throw or return a rejected promise to signal
		 * an additional error.
		 * @param {function} onFulfilledOrRejected handler to be called regardless of
		 *  fulfillment or rejection
		 * @returns {Promise}
		 */
		Promise.prototype['finally'] = Promise.prototype.ensure = function(onFulfilledOrRejected) {
			return typeof onFulfilledOrRejected === 'function'
				? this.then(injectHandler, injectHandler)['yield'](this)
				: this;

			function injectHandler() {
				return resolve(onFulfilledOrRejected());
			}
		};

		/**
		 * Return a promise that rejects with errorValue as the reason
		 * @param {*} errorValue
		 * @returns {Promise} a promise that rejects in all cases
		 */
		Promise.prototype['throw'] = function(errorValue) {
			return this.then(function() {
				throw errorValue;
			});
		};

		/**
		 * Recover from a failure by returning a defaultValue
		 * @param {*} defaultValue
		 * @returns {Promise} a promise that fulfills in all cases
		 */
		Promise.prototype['else'] = function(defaultValue) {
			return this['catch'](function() {
				return defaultValue;
			});
		};

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @return {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		Promise.prototype['yield'] = function(value) {
			return this.then(function() {
				return value;
			});
		};

		/**
		 * When this promise fulfills with an array, do
		 * onFulfilled.apply(void 0, array)
		 * @param (function) onFulfilled function to apply
		 * @returns {Promise} promise for the result of applying onFulfilled
		 */
		Promise.prototype.spread = function(onFulfilled) {
			return this.then(function(array) {
				return all(array).then(function(array) {
					return onFulfilled.apply(void 0, array);
				});
			});
		};

		/**
		 * Runs a side effect when this promise fulfills, without changing the
		 * fulfillment value.
		 * @param {function} onFulfilledSideEffect
		 * @returns {Promise}
		 */
		Promise.prototype.tap = function(onFulfilledSideEffect) {
			return this.then(onFulfilledSideEffect)['yield'](this);
		};

		/**
		 * Register a progress handler for this promise
		 * @param {function} onProgress
		 * @returns {Promise}
		 */
		Promise.prototype.progress = function(onProgress) {
			return this.then(void 0, void 0, onProgress);
		};

		// Timing operations

		/**
		 * Return a new promise that fulfills with the same
		 * @param ms
		 * @returns {Object.constructor}
		 */
		Promise.prototype.delay = function(ms) {
			var self = this;

			return new this.constructor(function(resolve, reject, notify) {
				self.then(function(x) {
					setTimer(function() {
						resolve(x);
					}, ms);
				}, reject, notify);
			});
		};

		/**
		 * Return a new promise that rejects after ms milliseconds unless
		 * this promise fulfills earlier, in which case the returned promise
		 * fulfills with the same value.
		 * @param {number} ms milliseconds
		 * @returns {Promise}
		 */
		Promise.prototype.timeout = function(ms) {
			var self = this;
			return new this.constructor(function(resolve, reject, notify) {

				var timer = setTimer(function onTimeout() {
					reject(new Error('timed out after ' + ms + 'ms'));
				}, ms);

				self.then(
					function onFulfill(x) {
						cancelTimer(timer);
						resolve(x);
					},
					function onReject(x) {
						cancelTimer(timer);
						reject(x);
					},
					notify
				);
			});
		};

		// Algebraic operations

		/**
		 * Transform the fulfillment value of this promise, and return
		 * a new promise for the transformed result.
		 * @param {function} f function to use to transform
		 * @returns {Promise}
		 */
		Promise.prototype.map = function(f) {
			return this.flatMap(function(x) {
				return new FulfilledPromise(f(x));
			});
		};

		Promise.prototype.flatMap = function(f) {
			return this.then(function(x) {
				return f(x).then(identity);
			});
		};

		Promise.prototype.ap = function(promise) {
			return this.flatMap(function(f) {
				return promise.map(f);
			});
		};

		Promise.prototype.concat = function(promise) {
			return any([this, promise]);
		};

		Promise.prototype.filter = function(predicate) {
			return this.map(function(x) {
				return predicate(x) ? x : new RejectedPromise(new Error());
			});
		};

		Promise.prototype.reduce = function(f) {
			return arguments.length === 1 ? this.foldl1(f) : this.foldl(f, arguments[1]);
		};

		Promise.prototype.reduceRight = function(f) {
			return arguments.length < 2 ? this.foldr1(f) : this.foldr(f, arguments[1]);
		};

		Promise.prototype.foldl = Promise.prototype.foldr = function(f, initial) {
			return this.map(function(x) {
				return f(initial, x);
			});
		};

		Promise.prototype.foldl1 = Promise.prototype.foldr1 = function(f) {
			/*jshint unused:false*/
			return resolve(this);
		};

		// Static array operations

		Promise.all = all;
		Promise.any = any;
		Promise.some = some;
		Promise.race = race;
		Promise.settle = settle;

		function all(promises) {
			return new Promise(function(resolve, reject, notify) {
				var pending = 0;
				var results = [];

				forEach(promises, function(x, i) {
					++pending;
					cast(x).then(function(x) {
						results[i] = x;

						if(--pending === 0) {
							resolve(results);
						}
					}, reject, notify);
				});

				if(pending === 0) {
					resolve(results);
				}
			});
		}

		function any(promises) {
			return new Promise(function(resolve, reject) {
				var pending = 0;
				var errors = [];

				forEach(promises, function(p) {
					++pending;
					cast(p).then(resolve, handleReject);
				});

				if(pending === 0) {
					resolve();
				}

				function handleReject(e) {
					errors.push(e);
					if(--pending === 0) {
						reject(errors);
					}
				}
			});
		}

		function some(promises, n) {
			return new Promise(function(resolve, reject, notify) {
				var pending = 0;
				var results = [];
				var errors = [];

				forEach(promises, function(p) {
					++pending;
					cast(p).then(handleResolve, handleReject, notify);
				});

				if(pending === 0) {
					resolve(results);
				}

				n = Math.min(n, pending);

				function handleResolve(x) {
					--pending;
					results.push(x);
					if(results.length === n) {
						resolve(slice(results));
					}
				}

				function handleReject(e) {
					errors.push(e);
					if(--pending < n) {
						reject(errors);
					}
				}
			});
		}

		function race(promises) {
			return new Promise(function(resolve, reject) {
				forEach(promises, function(p) {
					cast(p).then(resolve, reject);
				});
			});
		}

		function settle(promises) {
			return all(promises.map(function(p) {
				p = cast(p);
				return p.then(inspect, inspect);

				function inspect() {
					return p.inspect();
				}
			}));
		}

		/**
		 * Run a queue of functions as quickly as possible, passing
		 * value to each.
		 */
		function runHandlers(queue, value) {
			for (var i = 0; i < queue.length; i++) {
				queue[i](value);
			}
		}

		// Snapshot states

		/**
		 * Creates a fulfilled state snapshot
		 * @private
		 * @param {*} x any value
		 * @returns {{state:'fulfilled',value:*}}
		 */
		function toFulfilledState(x) {
			return { state: 'fulfilled', value: x };
		}

		/**
		 * Creates a rejected state snapshot
		 * @private
		 * @param {*} x any reason
		 * @returns {{state:'rejected',reason:*}}
		 */
		function toRejectedState(x) {
			return { state: 'rejected', reason: x };
		}

		/**
		 * Creates a pending state snapshot
		 * @private
		 * @returns {{state:'pending'}}
		 */
		function toPendingState() {
			return { state: 'pending' };
		}

		function crash(fatalError) {
			enqueue(function() {
				throw fatalError;
			});
			throw fatalError;
		}

		function identity(x) {
			return x;
		}

		return Promise;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
