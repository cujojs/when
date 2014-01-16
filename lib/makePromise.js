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

		var scheduler, setTimer, cancelTimer;

		scheduler = environment.scheduler;
		setTimer = environment.setTimeout;
		cancelTimer = environment.clearTimeout;

		/**
		 * Create a promise whose fate is determined by resolver
		 * @constructor
		 * @returns {Promise} promise
		 * @name Promise
		 */
		function Promise(resolver) {
			var self = this;
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
				var handler = self === x
					? new RejectedHandler(new TypeError())
					: getHandler(x);
				self._handler = self._handler.join(handler);
			}

			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {*} reason reason for the rejection
			 */
			function promiseReject(reason) {
				self._handler = self._handler.join(new RejectedHandler(reason));
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} update progress event payload to pass to all listeners
			 */
			function promiseNotify(update) {
				self._handler.notify(update);
			}
		}

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
			return new InternalPromise(getHandler(x));
		}

		/**
		 * Return a reject promise with x as its reason (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} rejected promise
		 */
		function reject(x) {
			return new InternalPromise(new RejectedHandler(x));
		}

		/**
		 * Return a fulfilled promise with x as its value (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} fulfilled promise
		 */
		function of(x) {
			return new InternalPromise(new FulfilledHandler(x));
		}

		/**
		 * Return a promise that remains pending forever
		 * @returns {Promise} forever-pending promise.
		 */
		function empty() {
			return new InternalPromise(new EmptyHandler());
		}

		/**
		 * Generate a (potentially infinite) stream of promised values
		 * by applying handler(generator(seed)) iteratively until
		 * condition(seed) returns true.
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

		// Flow control

		/**
		 * Register handlers for this promise.
		 * @param [onFulfilled] {Function} fulfillment handler
		 * @param [onRejected] {Function} rejection handler
		 * @param [onProgress] {Function} progress handler
		 * @return {Promise} new promise
		 */
		Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			var p = this;
			return new p.constructor(function (resolve, reject, notify) {
				p._handler.when(resolve, reject, notify, onFulfilled, onRejected, onProgress);
			});
		};

		/**
		 * Return a snapshot of this promise's current status at the instant of call
		 * @returns {{state:String}}
		 */
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
				return of(f(x));
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
				return predicate(x) ? x : reject(new Error());
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

		/**
		 * Return a promise that will fulfill when all promises in the
		 * input array have fulfilled, or will reject when one of the
		 * promises rejects.
		 * @param {array} promises array of promises
		 * @returns {Promise} promise for array of fulfillment values
		 */
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

		/**
		 * One-winner competitive race.
		 * Return a promise that will fulfill when one of the promises
		 * in the input array fulfills, or will reject when all promises
		 * have rejected.
		 * @param {array} promises
		 * @returns {Promise} promise for the first fulfilled value
		 */
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

		/**
		 * N-winner competitive race
		 * Return a promise that will fulfill when n input promises have
		 * fulfilled, or will reject when it becomes impossible for n
		 * input promises to fulfill (ie when promises.length - n + 1
		 * have rejected)
		 * @param {array} promises
		 * @param {number} n
		 * @returns {Promise} promise for the earliest n fulfillment values
		 */
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

		/**
		 * Fulfill-reject competitive race
		 * Return a promise that will settle to the same state as the
		 * earliest input promise to settle.
		 * @param {array} promises
		 * @returns {Promise}
		 */
		function race(promises) {
			return new Promise(function(resolve, reject) {
				forEach(promises, function(p) {
					cast(p).then(resolve, reject);
				});
			});
		}

		/**
		 * Return a promise that will always fulfill with an array containing
		 * the outcome states of all input promises.  The returned promise
		 * will never reject.
		 * @param {array} promises
		 * @returns {Promise}
		 */
		function settle(promises) {
			return all(promises.map(function(p) {
				p = cast(p);
				return p.then(inspect, inspect);

				function inspect() {
					return p.inspect();
				}
			}));
		}

		// Promise internals

		/**
		 * InternalPromise represents a promise that is either already
		 * fulfilled or reject, or is following another promise, based
		 * on the provided handler.
		 * @private
		 * @param {object} handler
		 * @constructor
		 */
		function InternalPromise(handler) {
			this._handler = handler;
		}

		InternalPromise.prototype = Object.create(Promise.prototype);

		/**
		 * Create an appropriate handler for x
		 * @param {*} x
		 * @returns {object} handler
		 */
		function getHandler(x) {
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

		/**
		 * Wrap an untrusted thenable in a handler that will assimilate it
		 * in a future stack
		 * @param {function} untrustedThen
		 * @param {{then: function}} x
		 * @returns {FollowingHandler}
		 */
		function wrapThenable (untrustedThen, x) {
			return new FollowingHandler(new Promise(function (resolve, reject, notify) {
				scheduler.enqueue(new AssimilateTask(untrustedThen, x, resolve, reject, notify));
			}));
		}

		/**
		 * Handler that manages a queue of consumers waiting on a
		 * pending promise
		 * @private
		 * @constructor
		 */
		function PendingHandler() {
			this.consumers = [];
		}

		PendingHandler.prototype.join = function(handler) {
			if(this.consumers.length > 0) {
				var queue = this.consumers;
				this.consumers = void 0;
				runHandlers(queue, handler.traverse());
			}

			return handler;
		};

		PendingHandler.prototype.when = function(resolve, reject, notify, f, r, u) {
			this.consumers.push(function(handler) {
				handler.when(resolve, reject, notify, f, r, u);
			});
		};

		PendingHandler.prototype.notify = function(x) {
			if(this.consumers.length === 0) {
				return;
			}

			scheduler.enqueue(new QueueTask(this.consumers, new ProgressHandler(x)));
		};

		/**
		 * Handler that follows another promise's state
		 * @private
		 * @param {Promise} x
		 * @constructor
		 */
		function FollowingHandler(x) {
			this.promise = x;
		}

		FollowingHandler.prototype.inspect = function() {
			return this.traverse().inspect();
		};

		FollowingHandler.prototype.when = function(resolve, reject, notify, f, r, u) {
			this.traverse().when(resolve, reject, notify, f, r, u);
		};

		FollowingHandler.prototype.traverse = function() {
			return this.promise._handler.traverse();
		};

		/**
		 * Handler for a fulfilled promise
		 * @private
		 * @param {*} x fulfillment value
		 * @constructor
		 */
		function FulfilledHandler(x) {
			this.value = x;
		}

		FulfilledHandler.prototype.inspect = function() {
			return toFulfilledState(this.value);
		};

		FulfilledHandler.prototype.when = function(resolve, reject, notify, f) {
			scheduler.enqueue(new FulfillTask(resolve, reject, f, this.value));
		};

		/**
		 * Handler for a rejected promise
		 * @private
		 * @param {*} x rejection reason
		 * @constructor
		 */
		function RejectedHandler(x) {
			this.value = x;
		}

		RejectedHandler.prototype.inspect = function() {
			return toRejectedState(this.value);
		};

		RejectedHandler.prototype.when = function(resolve, reject, notify, _, r) {
			scheduler.enqueue(new RejectTask(resolve, reject, r, this.value));
		};

		/**
		 * Handler the issues progress updates through a promise
		 * @private
		 * @param {*} x progress update value
		 * @constructor
		 */
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

		/**
		 * Handler for a promise that is pending forever
		 * @private
		 * @constructor
		 */
		function EmptyHandler() {}

		EmptyHandler.prototype.when = function() {};

		EmptyHandler.prototype.inspect
			= PendingHandler.prototype.inspect
			= toPendingState;

		PendingHandler.prototype.traverse
			= ProgressHandler.prototype.traverse
			= FulfilledHandler.prototype.traverse
			= FulfilledHandler.prototype.join
			= RejectedHandler.prototype.traverse
			= RejectedHandler.prototype.join
			= FollowingHandler.prototype.join
			= function() { return this; };

		FollowingHandler.prototype.notify
			= FulfilledHandler.prototype.notify
			= RejectedHandler.prototype.notify
			= noop;

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

		/**
		 * Run a queue of functions as quickly as possible, passing
		 * value to each.
		 */
		function runHandlers(queue, value) {
			for (var i = 0; i < queue.length; i++) {
				queue[i](value);
			}
		}

		// Task runners

		/**
		 * Task that applies an onFulfilled handler and resolves the
		 * next promise in the chain with the outcome
		 * @private
		 * @constructor
		 */
		function FulfillTask(resolve, reject, map, value) {
			this.resolve = resolve;
			this.reject = reject;
			this.map = map;
			this.value = value;
		}

		FulfillTask.prototype.run = function() {
			var t, x, map;
			t = this;
			x = t.value;
			map = t.map;
			try {
				t.resolve(typeof map === 'function' ? map(x) : x);
			} catch(e) {
				t.reject(e);
			}
		};

		/**
		 * Task that applies an onRejected handler and resolves the
		 * next promise in the chain with the outcome
		 * @private
		 * @constructor
		 */
		function RejectTask(resolve, reject, map, value) {
			this.resolve = resolve;
			this.reject = reject;
			this.map = map;
			this.value = value;
		}

		RejectTask.prototype.run = function() {
			var t, x, map;
			t = this;
			x = t.value;
			map = t.map;
			try {
				typeof map === 'function' ? t.resolve(map(x)) : t.reject(x);
			} catch(e) {
				t.reject(e);
			}
		};

		/**
		 * Task that extracts the value of an untrusted thenable by calling
		 * its then() method in a future stack
		 * @private
		 * @constructor
		 */
		function AssimilateTask(then, thenable, resolve, reject, notify) {
			this.untrustedThen = then;
			this.thenable = thenable;
			this.resolve = resolve;
			this.reject = reject;
			this.notify = notify;
		}

		AssimilateTask.prototype.run = function() {
			try {
				call(this.untrustedThen, this.thenable,
					this.resolve, this.reject, this.notify);
			} catch (e) {
				this.reject(e);
			}
		};

		/**
		 * Task that runs a queue of functions, passing a value to each
		 * @private
		 * @constructor
		 */
		function QueueTask(q, value) {
			this.q = q;
			this.value = value;
		}

		QueueTask.prototype.run = function() {
			runHandlers(this.q, this.value);
		};

		/**
		 * Task that throws a fatal error in a future stack
		 * @private
		 * @constructor
		 */
		function FatalErrorTask(e) {
			this.error = e;
		}

		FatalErrorTask.prototype.run = function() {
			throw this.error;
		};

		/**
		 * Enqueue a FatalErrorTask to throw fatalError in a future
		 * stack, and rethrow fatalError in the current stack
		 * @param {*} fatalError typically an Error, but can be anything
		 */
		function crash(fatalError) {
			scheduler.enqueue(new FatalErrorTask(fatalError));
			throw fatalError;
		}

		function identity(x) {
			return x;
		}

		function noop() {}

		return Promise;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
