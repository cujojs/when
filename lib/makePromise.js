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
	var reduce = Array.prototype.reduce;

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
			runResolver(resolver, promiseResolve, promiseReject, promiseNotify);

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} x resolution value
			 */
			function promiseResolve (x) {
				self._handler.resolve(x);
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

		function runResolver(resolver, promiseResolve, promiseReject, promiseNotify) {
			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch (e) {
				promiseReject(e);
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
			return x instanceof Promise ? x
				: new InternalPromise(new AsyncHandler(getHandler(x)));
		}

		/**
		 * Return a reject promise with x as its reason (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} rejected promise
		 */
		function reject(x) {
			return new InternalPromise(new AsyncHandler(new RejectedHandler(x)));
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
			var to = new DeferredHandler(from.receiver);
			from.when(to.resolve, to.notify, to, from.receiver, onFulfilled, onRejected, onProgress);

			return new InternalPromise(to);
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
			var h = new DeferredHandler();
			var pending = 0;

			var results = reduce.call(promises, function(results, x, i) {
				++pending;
				getHandler(x).when(noop, noop, void 0, h, function(x) {
					results[i] = x;

					if(--pending === 0) {
						this.resolve(results);
					}
				}, h.reject, h.notify);

				return results;
			}, []);

			if(pending === 0) {
				h.resolve(results);
			}

			return new InternalPromise(h);
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

			var h = new DeferredHandler();
			forEach.call(promises, function(p) {
				getHandler(p).when(noop, noop, void 0, h, h.resolve, h.reject);
			});

			return new InternalPromise(h);
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
		function getHandler(x, h) {
			if(Object(x) !== x) {
				return new FulfilledHandler(x);
			}

			if(x instanceof Promise) {
				return getHandlerChecked(x, h);
			}

			return getHandlerUntrusted(x);
		}

		function getHandlerChecked(x, h) {
			return h === x._handler
				? new RejectedHandler(new TypeError())
				: x._handler;
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
			return this.resolved ? this.join().inspect() : toPendingState();
		};

		DeferredHandler.prototype.resolve = function(x) {
			this._join(getHandler(x, this));
		};

		DeferredHandler.prototype.reject = function(x) {
			this._join(new RejectedHandler(x));
		};

		DeferredHandler.prototype.join = function() {
			return this.resolved ? this.handler.join() : this;
		};

		DeferredHandler.prototype.run = function() {
			var q = this.consumers;
			var handler = this.handler.join();
			this.consumers = void 0;

			for (var i = 0; i < q.length; i+=7) {
				handler.when(q[i], q[i+1], q[i+2], q[i+3], q[i+4], q[i+5], q[i+6]);
			}
		};

		DeferredHandler.prototype._join = function(handler) {
			if(this.resolved) {
				return;
			}

			this.resolved = true;
			this.handler = handler = handler.join();
			tasks.enqueue(this);
		};

		DeferredHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
			if(this.resolved) {
				tasks.enqueue(new RunHandlerTask(resolve, notify, t, receiver, f, r, u, this.handler.join()));
			} else {
				this.consumers.push(resolve, notify, t, receiver, f, r, u);
			}

		};

		DeferredHandler.prototype.notify = function(x) {
			if(!this.resolved) {
				tasks.enqueue(new ProgressTask(this.consumers, x));
			}
		};

		/**
		 * Wrap another handler and force it into a future stack
		 * @param {object} handler
		 * @constructor
		 */
		function AsyncHandler(handler) {
			this.handler = handler;
		}

		AsyncHandler.prototype.inspect = function() {
			return this.handler.inspect();
		};

		AsyncHandler.prototype.join = function() {
			return this;
		};

		AsyncHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
			tasks.enqueue(new RunHandlerTask(resolve, notify, t, receiver, f, r, u, this.handler.join()));
		};

		/**
		 * Handler that follows another promise's state, optionally injecting a receiver
		 * @private
		 * @param {object} handler another handler to follow
		 * @param {object=undefined} receiver
		 * @constructor
		 */
		function FollowingHandler(handler, receiver) {
			this.handler = handler;
			this.receiver = receiver;
		}

		FollowingHandler.prototype.inspect = function() {
			return this.join().inspect();
		};

		FollowingHandler.prototype.join = function() {
			return this.handler.join();
		};

		FollowingHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
			// Because handlers are allowed to be shared among promises,
			// each of which possibly having a different receiver, we have
			// to insert our own receiver into the chain if it has been set
			// so that callbacks (f, r, u) will be called using our receiver
			if(this.receiver !== void 0) {
				receiver = this.receiver;
			}
			this.join().when(resolve, notify, t, receiver, f, r, u);
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

		FulfilledHandler.prototype.when = function(resolve, notify, t, receiver, f) {
			var x = typeof f === 'function'
				? tryCatchReject(f, this.value, receiver)
				: this.value;

			resolve.call(t, x);
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

		RejectedHandler.prototype.when = function(resolve, notify, t, receiver, f, r) {
			var x = typeof r === 'function'
				? tryCatchReject(r, this.value, receiver)
				: reject(this.value);

			resolve.call(t, x);
		};

		/**
		 * Handler for a promise that is pending forever
		 * @private
		 * @constructor
		 */
		function EmptyHandler() {}

		EmptyHandler.prototype.when = noop;
		EmptyHandler.prototype.inspect = toPendingState;

		// The empty (forever pending) promise
		emptyPromise = new InternalPromise(new EmptyHandler());

		FulfilledHandler.prototype.join
			= RejectedHandler.prototype.join
			= AsyncHandler.prototype.join
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
			= AsyncHandler.prototype.resolve
			= AsyncHandler.prototype.reject
			= AsyncHandler.prototype.notify
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
		 * Run a single consumer
		 * @constructor
		 */
		function RunHandlerTask(a, b, c, d, e, f, g, handler) {
			this.a=a;this.b=b;this.c=c;this.d=d;this.e=e;this.f=f;this.g=g;
			this.handler = handler;
		}

		RunHandlerTask.prototype.run = function() {
			this.handler.when(this.a, this.b, this.c, this.d, this.e, this.f, this.g);
		};

		/**
		 * Extract the value of an untrusted thenable by calling
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
		 * Run a queue of progress handlers
		 * @private
		 * @constructor
		 */
		function ProgressTask(q, value) {
			this.q = q;
			this.value = value;
		}

		ProgressTask.prototype.run = function() {
			var q = this.q;
			// First progress handler is at index 1
			for (var i = 1; i < q.length; i+=7) {
				this._notify(q[i], q[i+1], q[i+2], q[i+5]);
			}
		};

		ProgressTask.prototype._notify = function(notify, t, receiver, u) {
			var x = typeof u === 'function'
				? tryCatchReturn(u, this.value, receiver)
				: this.value;

			notify.call(t, x);
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

		function tryCatchReturn(f, x, thisArg) {
			try {
				return f.call(thisArg, x);
			} catch(e) {
				return e;
			}
		}

		function noop() {}

		return typeof environment.decorate === 'function'
			? environment.decorate(Promise)
			: Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
