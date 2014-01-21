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

	var bind, uncurryThis, call;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	call = uncurryThis(bind.call);

	return makePromise;

	function makePromise(environment) {

		var scheduler = environment.scheduler;

		/**
		 * Create a promise whose fate is determined by resolver
		 * @constructor
		 * @returns {Promise} promise
		 * @name Promise
		 */
		function Promise(resolver) {
			this._handler = new PendingHandler();
			runResolver(resolver, this);
		}

		function runResolver(resolver, promise) {
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
				promise._handler = promise._handler.resolve(promise, x);
			}

			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {*} reason reason for the rejection, typically an Error
			 */
			function promiseReject(reason) {
				promise._handler = promise._handler.reject(reason);
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} x progress event payload to pass to all listeners
			 */
			function promiseNotify(x) {
				promise._handler.notify(x);
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
			var h = this._handler;
			return new this.constructor(function (resolve, _, notify) {
				h.when(resolve, notify, onFulfilled, onRejected, onProgress);
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
		 * Recover from a failure by returning a defaultValue
		 * @param {*} defaultValue
		 * @returns {Promise} a promise that fulfills in all cases
		 */
		Promise.prototype['else'] = Promise.prototype.orElse = function(defaultValue) {
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

		InternalPromise.prototype = Promise.prototype;

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

		function resolveHandler(p, x) {
			return p === x
				? new RejectedHandler(new TypeError())
				: getHandler(x);
		}

		/**
		 * Wrap an untrusted thenable in a handler that will assimilate it
		 * in a future stack
		 * @param {function} untrustedThen
		 * @param {{then: function}} x
		 * @returns {FollowingHandler}
		 */
		function wrapThenable (untrustedThen, x) {
			return new FollowingHandler(new Promise(function (resolve, _, notify) {
				scheduler.enqueue(new AssimilateTask(untrustedThen, x, resolve, notify));
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
				runHandlers(queue, handler);
			}

			return handler;
		};

		PendingHandler.prototype.when = function(resolve, notify, f, r, u) {
			this.consumers.push(new ForwardingTask(resolve, notify, f, r, u));
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
			return this.promise.inspect();
		};

		FollowingHandler.prototype.when = function(resolve, notify, f, r, u) {
			this.promise._handler.when(resolve, notify, f, r, u);
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

		FulfilledHandler.prototype.when = function(resolve, notify, f) {
			scheduler.enqueue(new FulfillTask(resolve, f, this.value));
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

		RejectedHandler.prototype.when = function(resolve, notify, _, r) {
			scheduler.enqueue(new RejectTask(resolve, r, this.value));
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

		ProgressHandler.prototype.when = function(_, notify, f, r, u) {
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

		FollowingHandler.prototype.resolve
			= FulfilledHandler.prototype.resolve
			= RejectedHandler.prototype.resolve
			= PendingHandler.prototype.resolve = function(p, x) {
			return this.join(resolveHandler(p, x));
		};

		FollowingHandler.prototype.reject
			= FulfilledHandler.prototype.reject
			= RejectedHandler.prototype.reject
			= PendingHandler.prototype.reject = function(x) {
			return this.join(new RejectedHandler(x));
		};

		FollowingHandler.prototype.join
			= FulfilledHandler.prototype.join
			= RejectedHandler.prototype.join
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
				queue[i].run(value);
			}
		}

		// Task runners

		/**
		 * Task that applies an onFulfilled handler and resolves the
		 * next promise in the chain with the outcome
		 * @private
		 * @constructor
		 */
		function FulfillTask(resolve, map, value) {
			this.resolve = resolve;
			this.map = map;
			this.value = value;
		}

		FulfillTask.prototype.run = function() {
			var t = this;
			var map = t.map;
			try {
				t.resolve(typeof map === 'function' ? map(t.value) : t.value);
			} catch(e) {
				doReject(t.resolve, e);
			}
		};

		/**
		 * Task that applies an onRejected handler and resolves the
		 * next promise in the chain with the outcome
		 * @private
		 * @constructor
		 */
		function RejectTask(resolve, map, value) {
			this.resolve = resolve;
			this.map = map;
			this.value = value;
		}

		RejectTask.prototype.run = function() {
			var t = this;
			var map = typeof t.map === 'function' ? t.map : reject;
			try {
				t.resolve(map(t.value));
			} catch(e) {
				doReject(t.resolve, e);
			}
		};

		/**
		 * Task that extracts the value of an untrusted thenable by calling
		 * its then() method in a future stack
		 * @private
		 * @constructor
		 */
		function AssimilateTask(then, thenable, resolve, notify) {
			this.untrustedThen = then;
			this.thenable = thenable;
			this.resolve = resolve;
			this.notify = notify;
		}

		AssimilateTask.prototype.run = function() {
			var resolve = this.resolve;
			try {
				call(this.untrustedThen, this.thenable,
					resolve, function(e) {
						doReject(resolve, e);
					}, this.notify);
			} catch (e) {
				doReject(resolve, e);
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

		function ForwardingTask(a,b,c,d,e) {
			this.a = a;
			this.b = b;
			this.c = c;
			this.d = d;
			this.e = e;
		}

		ForwardingTask.prototype.run = function(handler) {
			handler.when(this.a, this.b, this.c, this.d, this.e);
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

		function doReject(resolve, e) {
			resolve(reject(e));
		}

		/**
		 * Enqueue a FatalErrorTask to throw fatalError in a future
		 * stack, and rethrow fatalError in the current stack
		 * @param {*} fatalError typically an Error, but can be anything
		 */
		function crash(fatalError) {
			scheduler.enqueue(new FatalErrorTask(fatalError));
			throw fatalError;
		}

		function noop() {}

		return Promise;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
