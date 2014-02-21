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

	var forEach = Array.prototype.forEach;

	return function makePromise(environment) {

		var emptyPromise;
		var tasks = environment.scheduler;

		/**
		 * Create a promise whose fate is determined by resolver
		 * @constructor
		 * @returns {Promise} promise
		 * @name Promise
		 */
		function Promise(resolver) {
			var self = this;
			this._handler = new DeferredHandler();

			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch (e) {
				promiseReject(e);
			}

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} x resolution value
			 */
			function promiseResolve (x) {
				resolvePromise(self, x);
			}
			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {*} reason reason for the rejection, typically an Error
			 */
			function promiseReject (reason) {
				self._handler.reject(reason);
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} x progress event payload to pass to all listeners
			 */
			function promiseNotify (x) {
				self._handler.notify(x);
			}
		}

		// Creation

		Promise.resolve = resolve;
		Promise.reject = reject;
		Promise.empty = empty;

		/**
		 * Returns a trusted promise. If x is already a trusted promise, it is
		 * returned, otherwise returns a new trusted Promise which follows x.
		 * @param  {*} x
		 * @return {Promise} promise
		 */
		function resolve(x) {
			return x instanceof Promise ? x : new InternalPromise(getHandler(x));
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
		 * Return a promise that remains pending forever
		 * @returns {Promise} forever-pending promise.
		 */
		function empty() {
			return emptyPromise; // Should be frozen
		}

		// Transformation and flow control

		/**
		 * Transform this promise's fulfillment value, returning a new Promise
		 * for the transformed result.  If the promise cannot be fulfilled, onRejected
		 * is called with the reason.  onProgress *may* be called with updates toward
		 * this promise's fulfillment.
		 * @param [onFulfilled] {Function} fulfillment handler
		 * @param [onRejected] {Function} rejection handler
		 * @param [onProgress] {Function} progress handler
		 * @return {Promise} new promise
		 */
		Promise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			var from = this._handler;
			var p = new InternalPromise(new DeferredHandler(from.receiver));

			from.when(function (x) {
				resolvePromise(p, x);
			}, function (x) {
				p._handler.notify(x);
			}, from.receiver, onFulfilled, onRejected, onProgress);

			return p;
		};

		/**
		 * If this promise cannot be fulfilled due to an error, call onRejected to
		 * handle the error. Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
			return this.then(void 0, onRejected);
		};

		/**
		 * Returns a promise whose handlers will be called with `this` set to
		 * the supplied `thisArg`.  Subsequent promises derived from the
		 * returned promise will also have their handlers called with `thisArg`.
		 * Calling `with` with undefined or no arguments will return a promise
		 * whose handlers will again be called in the usual Promises/A+ way (no `this`)
		 * thus safely undoing any previous `with` in the promise chain.
		 *
		 * WARNING: Promises returned from `with`/`withThis` are NOT Promises/A+
		 * compliant, specifically violating 2.2.5 (http://promisesaplus.com/#point-41)
		 *
		 * @param {object} thisArg `this` value for all handlers attached to
		 *  the returned promise.
		 * @returns {Promise}
		 */
		Promise.prototype['with'] = Promise.prototype.withThis = function(thisArg) {
			return new InternalPromise(new FollowingHandler(this._handler, thisArg));
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
			return new Promise(function(resolveAll, reject, notify) {
				var pending = 0;
				var results = [];

				forEach.call(promises, function(x, i) {
					++pending;
					resolve(x).then(function(x) {
						results[i] = x;

						if(--pending === 0) {
							resolveAll(results);
						}
					}, reject, notify);
				});

				if(pending === 0) {
					resolveAll(results);
				}
			});
		}

		/**
		 * Fulfill-reject competitive race. Return a promise that will settle
		 * to the same state as the earliest input promise to settle.
		 *
		 * WARNING: The ES6 Promise spec requires that race()ing an empty array
		 * must return a promise that is pending forever.  This implementation
		 * returns a singleton never-settling promise, the same singleton that is
		 * returned by Promise.empty(), thus can be checked with ===
		 *
		 * @param {array} promises array of promises to race
		 * @returns {Promise} if input is non-empty, a promise that will settle
		 * to the same outcome as the earliest input promise to settle. if empty
		 * is empty, returns a promise that will never settle.
		 */
		function race(promises) {
			// Sigh, race([]) is untestable unless we return *something*
			// that is recognizable without calling .then() on it.
			if(Object(promises) === promises && promises.length === 0) {
				return emptyPromise;
			}

			return new Promise(function(resolveRace, reject) {
				forEach.call(promises, function(p) {
					resolve(p).then(resolveRace, reject);
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
		 * Seal p's fate with x
		 * @param {Promise} p
		 * @param {*} x value with which to resolve p
		 */
		function resolvePromise(p, x) {
			if(p === x) {
				p._handler.reject(new TypeError());
			}
			p._handler.resolve(x);
		}

		/**
		 * Create an appropriate handler for x
		 * @param {*} x
		 * @returns {object} handler
		 */
		function getHandler(x) {
			if(Object(x) !== x) {
				return new FulfilledHandler(x);
			}

			if(x instanceof Promise) {
				return x._handler;
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
			this.handler = void 0;
			this.resolved = false;
		}

		DeferredHandler.prototype.inspect = function() {
			return this.resolved ? this.traverse().inspect() : toPendingState();
		};

		DeferredHandler.prototype.resolve = function(x) {
			this._join(getHandler(x));
		};

		DeferredHandler.prototype.reject = function(x) {
			this._join(new RejectedHandler(x));
		};

		DeferredHandler.prototype.traverse = function() {
			return this.resolved ? this.handler.traverse() : this;
		};

		DeferredHandler.prototype._join = function(handler) {
			if(this.resolved) {
				return;
			}

			this.resolved = true;
			this.handler = handler = handler.traverse();

			runTasks(this.consumers, handler);
			this.consumers = void 0;
		};

		DeferredHandler.prototype.when = function(resolve, notify, receiver, f, r, u) {
			if (this.resolved) {
				this.traverse().when(resolve, notify, receiver, f, r, u);
			} else {
				this.consumers.push(new ForwardingTask(resolve, notify, receiver, f, r, u));
			}
		};

		DeferredHandler.prototype.notify = function(x) {
			if(!this.resolved) {
				tasks.enqueue(new ProgressTask(this.consumers, x));
			}
		};

		/**
		 * Handler that follows another promise's state
		 * @private
		 * @param {object} handler another handler to follow
		 * @param {object=undefined} receiver
		 * @constructor
		 */
		function FollowingHandler(handler, receiver) {
			this.handler = handler.traverse();
			this.receiver = receiver;
		}

		FollowingHandler.prototype.inspect = function() {
			return this.traverse().inspect();
		};

		FollowingHandler.prototype.traverse = function() {
			return this.handler.traverse();
		};

		FollowingHandler.prototype.when = function(resolve, notify, receiver, f, r, u) {
			// Because handlers are allowed to be shared among promises,
			// each of which possibly having a different receiver, we have
			// to insert our own receiver into the chain if it has been set
			// so that callbacks (f, r, u) will be called using our receiver
			this.traverse().when(resolve, notify, this.receiver === void 0 ? receiver : this.receiver, f, r, u);
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
			DeferredHandler.call(this);
			tasks.enqueue(new AssimilateTask(then, x, this));
		}

		ThenableHandler.prototype = DeferredHandler.prototype;

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
		 * Handler for a promise that is pending forever
		 * @private
		 * @constructor
		 */
		function EmptyHandler() {}

		EmptyHandler.prototype.when = function() {};
		EmptyHandler.prototype.inspect = toPendingState;

		// The empty (forever pending) promise
		emptyPromise = new InternalPromise(new EmptyHandler());

		FulfilledHandler.prototype.traverse
			= RejectedHandler.prototype.traverse
			= function() { return this; };

		FollowingHandler.prototype.resolve
			= FollowingHandler.prototype.reject
			= FollowingHandler.prototype.notify
			= FulfilledHandler.prototype.resolve
			= FulfilledHandler.prototype.reject
			= FulfilledHandler.prototype.notify
			= RejectedHandler.prototype.resolve
			= RejectedHandler.prototype.reject
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
			if(typeof this.map === 'function') {
				this.resolve(tryCatchReject(this.map, this.value, this.receiver));
			} else {
				this.resolve(this.value);
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
			if(typeof this.map === 'function') {
				this.resolve(tryCatchReject(this.map, this.value, this.receiver));
			} else {
				this.resolve(reject(this.value));
			}
		};

		/**
		 * Task that extracts the value of an untrusted thenable by calling
		 * its then() method in a future stack
		 * @private
		 * @constructor
		 */
		function AssimilateTask(then, thenable, handler) {
			this.untrustedThen = then;
			this.thenable = thenable;
			this.handler = handler;
		}

		AssimilateTask.prototype.run = function() {
			var h = this.handler;
			try {
				this.untrustedThen.call(this.thenable,
					function(x) { h.resolve(x); },
					function(x) { h.reject(x); },
					function(x) { h.notify(x); }
				);
			} catch (e) {
				h.reject(e);
			}
		};

		/**
		 * Task that runs a queue of progress handlers
		 * @private
		 * @constructor
		 */
		function ProgressTask(q, value) {
			this.q = q;
			this.value = value;
		}

		ProgressTask.prototype.run = function() {
			runTasks(this.q, this);
		};

		ProgressTask.prototype.when = function(_, notify, receiver, __, ___, u) {
			try {
				notify(typeof u === 'function'
					? u.call(receiver, this.value) : this.value);
			} catch(e) {
				notify(e);
			}
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

		function tryCatchReject(f, x, thisArg) {
			try {
				return f.call(thisArg, x);
			} catch(e) {
				return reject(e);
			}
		}

		function noop() {}

		return typeof environment.decorate === 'function'
			? environment.decorate(Promise)
			: Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
