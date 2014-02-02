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

	var bind, uncurryThis, forEach;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	forEach = uncurryThis(Array.prototype.forEach);

	return makePromise;

	function makePromise(environment) {

		var tasks = environment.scheduler;
		var emptyPromise;

		/**
		 * Create a promise whose fate is determined by resolver
		 * @constructor
		 * @returns {Promise} promise
		 * @name Promise
		 */
		function Promise(resolver) {
			var self = this;
			this._handler = new DeferredHandler();

			callResolver(resolver, promiseResolve, promiseReject, promiseNotify);

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} x resolution value
			 */
			function promiseResolve (x) {
				self._handler = self._handler.join(getHandler(self, x));
			}
			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {*} reason reason for the rejection, typically an Error
			 */
			function promiseReject (reason) {
				self._handler = self._handler.join(new RejectedHandler(reason));
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} x progress event payload to pass to all listeners
			 */
			function promiseNotify (x) {
				self._handler.notify(x);
			}
		}

		function callResolver (resolver, promiseResolve, promiseReject, promiseNotify) {
			// Call the resolver to seal the promise's fate
			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch (e) {
				promiseReject(e);
			}
		}

		// Creation

		Promise.cast = cast;
		Promise.resolve = resolve;
		Promise.reject = reject;
		Promise.of = of;
		Promise.empty = empty;

		/**
		 * Casts x to a trusted promise. If x is already a trusted promise, it is
		 * returned, otherwise a new trusted Promise which follows x is returned.
		 * @param {*} x
		 * @returns {Promise} x or a new promise
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
		 * @return {Promise} new promise
		 */
		function resolve(x) {
			return new InternalPromise(getHandler(void 0, x));
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
			return emptyPromise; // Should be frozen
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
			var p = new InternalPromise(new DeferredHandler(this._handler.receiver));
			return _then(this._handler, p, onFulfilled, onRejected, onProgress);
		};

		function _then (from, to, onFulfilled, onRejected, onProgress) {
			from.when(function (x) {
				to._handler = to._handler.join(getHandler(to, x));
			}, function (x) {
				to._handler.notify(x);
			}, from.receiver, onFulfilled, onRejected, onProgress);

			return to;
		}

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
			return this.then(void 0, onRejected);
		};

		/**
		 * WARNING: Promises returned from `with`/`withThis` are NOT Promises/A+
		 * compliant, specifically violating 2.2.5 (http://promisesaplus.com/#point-41)
		 *
		 * Returns a promise whose handlers will be called with `this` set to
		 * the supplied `thisArg`.  Subsequent promises derived from the
		 * returned promise will also have their handlers called with `thisArg`.
		 * Calling `with` with undefined or no arguments will return a promise
		 * whose handlers will again be called in the usual Promises/A+ way (no `this`)
		 * thus safely undoing any previous `with` in the promise chain.
		 * @param {object} thisArg `this` value for all handlers attached to
		 *  the returned promise.
		 * @returns {Promise}
		 */
		Promise.prototype['with'] = Promise.prototype.withThis = function(thisArg) {
			return new InternalPromise(new FollowingHandler(this, thisArg));
		};

		/**
		 * Enqueue a FatalErrorTask to throw fatalError in a future
		 * stack, and rethrow fatalError in the current stack
		 * @param {*} fatalError typically an Error, but can be anything
		 */
		Promise.prototype._fatal = function(fatalError) {
			tasks.enqueue(new FatalErrorTask(fatalError));
		};

		// Array combinators

		Promise.all = all;
		Promise.race = race;

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
		 * Fulfill-reject competitive race
		 * Return a promise that will settle to the same state as the
		 * earliest input promise to settle.
		 * @param {array} promises
		 * @returns {Promise}
		 */
		function race(promises) {
			if(Object(promises) === promises && promises.length === 0) {
				return emptyPromise;
			}

			return new Promise(function(resolve, reject) {
				forEach(promises, function(p) {
					cast(p).then(resolve, reject);
				});
			});
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
		 * @param {Promise} promise for which handler is being created
		 * @param {*} x
		 * @returns {object} handler
		 */
		function getHandler(p, x) {
			if(Object(x) !== x) {
				return new FulfilledHandler(x);
			}

			if(x instanceof Promise) {
				return p === x
					? new RejectedHandler(new TypeError())
					: new FollowingHandler(x);
			}

			return getHandlerUntrusted(x);
		}

		function getHandlerUntrusted(x) {
			try {
				var untrustedThen = x.then;
				return typeof untrustedThen === 'function'
					? new ThenableHandler(untrustedThen, x)
					: new FulfilledHandler(x);
			} catch(e) {
				return new RejectedHandler(e);
			}
		}

		/**
		 * Handler that manages a queue of consumers waiting on a pending promise
		 * @private
		 * @constructor
		 */
		function DeferredHandler(receiver) {
			this.consumers = [];
			this.receiver = receiver;
		}

		DeferredHandler.prototype.join = function(handler) {
			runTasks(this.consumers, handler);
			this.consumers = void 0;

			return handler;
		};

		DeferredHandler.prototype.when = function(resolve, notify, receiver, f, r, u) {
			this.consumers.push(new ForwardingTask(resolve, notify, receiver, f, r, u));
		};

		DeferredHandler.prototype.notify = function(x) {
			tasks.enqueue(new QueueTask(this.consumers, new ProgressHandler(x)));
		};

		/**
		 * Handler that follows another promise's state
		 * @private
		 * @param {Promise} x
		 * @param {object=undefined} receiver
		 * @constructor
		 */
		function FollowingHandler(x, receiver) {
			this.value = x;
			this.receiver = receiver;
		}

		FollowingHandler.prototype.inspect = function() {
			return this.value.inspect();
		};

		FollowingHandler.prototype.when = function(resolve, notify, receiver, f, r, u) {
			// Because handlers are allowed to be shared among promises,
			// each of which possibly having a different receiver, we have
			// to insert our own receiver into the chain if it has been set
			// so that callbacks (f, r, u) will be called using our receiver
			this.value._handler.when(resolve, notify, this.receiver === void 0 ? receiver : this.receiver, f, r, u);
		};

		/**
		 * Handler that wraps an untrusted thenable in a handler that will assimilate it
		 * in a future stack
		 * @private
		 * @param {function} then
		 * @param {{then: function}} x
		 * @constructor
		 */
		function ThenableHandler(then, x) {
			FollowingHandler.call(this, new Promise(function (resolve, reject, notify) {
				tasks.enqueue(new AssimilateTask(then, x, resolve, reject, notify));
			}));
		}

		ThenableHandler.prototype = FollowingHandler.prototype;

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

		FulfilledHandler.prototype.when = function(resolve, _, receiver, f) {
			tasks.enqueue(new FulfillTask(resolve, receiver, f, this.value));
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

		RejectedHandler.prototype.when = function(resolve, _, receiver, __, r) {
			tasks.enqueue(new RejectTask(resolve, receiver, r, this.value));
		};

		/**
		 * Handler that issues progress updates through a promise
		 * @private
		 * @param {*} x progress update value
		 * @constructor
		 */
		function ProgressHandler(x) {
			this.value = x;
		}

		ProgressHandler.prototype.when = function(_, notify, receiver, __, ___, u) {
			try {
				notify(typeof u === 'function' ? u.call(receiver, this.value) : this.value);
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

		// The empty (forever pending) promise
		emptyPromise = new InternalPromise(new EmptyHandler());

		EmptyHandler.prototype.inspect
			= DeferredHandler.prototype.inspect
			= toPendingState;

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

		// Task runners

		/**
		 * Run a queue of tasks as quickly as possible, passing
		 * value to each.
		 */
		function runTasks(queue, value) {
			for (var i = 0; i < queue.length; i++) {
				queue[i].run(value);
			}
		}

		/**
		 * Task that applies an onFulfilled handler and resolves the
		 * next promise in the chain with the outcome
		 * @private
		 * @constructor
		 */
		function FulfillTask(resolve, receiver, map, value) {
			this.resolve = resolve;
			this.receiver = receiver;
			this.map = map;
			this.value = value;
		}

		FulfillTask.prototype.run = function() {
			var map = this.map;
			try {
				this.resolve(typeof map === 'function' ? map.call(this.receiver, this.value) : this.value);
			} catch(e) {
				doReject(this.resolve, e);
			}
		};

		/**
		 * Task that applies an onRejected handler and resolves the
		 * next promise in the chain with the outcome
		 * @private
		 * @constructor
		 */
		function RejectTask(resolve, receiver, map, value) {
			this.resolve = resolve;
			this.receiver = receiver;
			this.map = map;
			this.value = value;
		}

		RejectTask.prototype.run = function() {
			var map = typeof this.map === 'function' ? this.map : reject;
			try {
				this.resolve(map.call(this.receiver, this.value));
			} catch(e) {
				doReject(this.resolve, e);
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
				this.untrustedThen.call(this.thenable, this.resolve, this.reject, this.notify);
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
			runTasks(this.q, this.value);
		};

		/**
		 * Task that forwards arguments to another handler
		 * @private
		 * @constructor
		 */
		function ForwardingTask(a,b,c,d,e,f) {
			this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f;
		}

		ForwardingTask.prototype.run = function(handler) {
			handler.when(this.a, this.b, this.c, this.d, this.e, this.f);
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

		function noop() {}

		return Promise;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
