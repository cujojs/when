/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function makePromise(environment) {

		var foreverPendingPromise;
		var tasks = environment.scheduler;

		var objectCreate = Object.create ||
			function(proto) {
				function Child() {}
				Child.prototype = proto;
				return new Child();
			};

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
		Promise.never = never;

		Promise._defer = defer;

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
		function never() {
			return foreverPendingPromise; // Should be frozen
		}

		/**
		 * Creates an internal {promise, resolver} pair
		 * @private
		 * @returns {{resolver: DeferredHandler, promise: InternalPromise}}
		 */
		function defer() {
			return new InternalPromise(new DeferredHandler());
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
		 * Private function to bind a thisArg for this promise's handlers
		 * @private
		 * @param {object} thisArg `this` value for all handlers attached to
		 *  the returned promise.
		 * @returns {Promise}
		 */
		Promise.prototype._bindContext = function(thisArg) {
			return new InternalPromise(new BoundHandler(this._handler, thisArg));
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
			/*jshint maxcomplexity:6*/
			var resolver = new DeferredHandler();
			var len = promises.length >>> 0;
			var pending = len;
			var results = [];
			var i, x;

			for (i = 0; i < len; ++i) {
				if (i in promises) {
					x = promises[i];
					if (maybeThenable(x)) {
						resolveOne(resolver, results, getHandlerThenable(x), i);
					} else {
						results[i] = x;
						--pending;
					}
				} else {
					--pending;
				}
			}

			if(pending === 0) {
				resolver.resolve(results);
			}

			return new InternalPromise(resolver);

			function resolveOne(resolver, results, handler, i) {
				handler.when(noop, noop, void 0, resolver, function(x) {
					results[i] = x;
					if(--pending === 0) {
						this.resolve(results);
					}
				}, resolver.reject, resolver.notify);
			}
		}

		/**
		 * Fulfill-reject competitive race. Return a promise that will settle
		 * to the same state as the earliest input promise to settle.
		 *
		 * WARNING: The ES6 Promise spec requires that race()ing an empty array
		 * must return a promise that is pending forever.  This implementation
		 * returns a singleton forever-pending promise, the same singleton that is
		 * returned by Promise.never(), thus can be checked with ===
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
				return never();
			}

			var h = new DeferredHandler();
			for(var i=0; i<promises.length; ++i) {
				getHandler(promises[i]).when(noop, noop, void 0, h, h.resolve, h.reject);
			}

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

		InternalPromise.prototype = objectCreate(Promise.prototype);

		/**
		 * Get an appropriate handler for x, checking for untrusted thenables
		 * and promise graph cycles.
		 * @private
		 * @param {*} x
		 * @param {object?} h optional handler to check for cycles
		 * @returns {object} handler
		 */
		function getHandler(x, h) {
			if(x instanceof Promise) {
				return getHandlerChecked(x, h);
			}
			return maybeThenable(x) ? getHandlerUntrusted(x) : new FulfilledHandler(x);
		}

		/**
		 * Get an appropriate handler for x, which must be either a thenable
		 * @param {object} x
		 * @returns {object} handler
		 */
		function getHandlerThenable(x) {
			return x instanceof Promise ? x._handler.join() : getHandlerUntrusted(x);
		}

		/**
		 * Get x's handler, checking for cycles
		 * @param {Promise} x
		 * @param {object?} h handler to check for cycles
		 * @returns {object} handler
		 */
		function getHandlerChecked(x, h) {
			var xh = x._handler.join();
			return h === xh ? promiseCycleHandler() : xh;
		}

		/**
		 * Get a handler for potentially untrusted thenable x
		 * @param {*} x
		 * @returns {object} handler
		 */
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
		 * Handler for a promise that is pending forever
		 * @private
		 * @constructor
		 */
		function Handler() {}

		Handler.prototype.inspect = toPendingState;
		Handler.prototype.when = noop;
		Handler.prototype.resolve = noop;
		Handler.prototype.reject = noop;
		Handler.prototype.notify = noop;
		Handler.prototype.join = function() { return this; };

		Handler.prototype._env = environment.monitor || Promise;
		Handler.prototype._addTrace = noop;
		Handler.prototype._isMonitored = function() {
			return typeof this._env.promiseMonitor !== 'undefined';
		};

		/**
		 * Abstract base for handler that delegates to another handler
		 * @private
		 * @param {object} handler
		 * @constructor
		 */
		function DelegateHandler(handler) {
			this.handler = handler;
			if(this._isMonitored()) {
				var trace = this._env.promiseMonitor.captureStack();
				this.trace = handler._addTrace(trace);
			}
		}

		DelegateHandler.prototype = objectCreate(Handler.prototype);

		DelegateHandler.prototype.join = function() {
			return this.handler.join();
		};

		DelegateHandler.prototype.inspect = function() {
			return this.handler.inspect();
		};

		DelegateHandler.prototype._addTrace = function(trace) {
			return this.handler._addTrace(trace);
		};

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
			if(this._isMonitored()) {
				this.trace = this._env.promiseMonitor.captureStack();
			}
		}

		DeferredHandler.prototype = objectCreate(Handler.prototype);

		DeferredHandler.prototype.inspect = function() {
			return this.resolved ? this.handler.join().inspect() : toPendingState();
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
			var handler = this.handler = this.handler.join();
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
			this.handler = handler;
			tasks.enqueue(this);

			if(this._isMonitored()) {
				this.trace = handler._addTrace(this.trace);
			}
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

		DeferredHandler.prototype._addTrace = function(trace) {
			return this.resolved ? this.handler._addTrace(trace) : trace;
		};

		/**
		 * Wrap another handler and force it into a future stack
		 * @private
		 * @param {object} handler
		 * @constructor
		 */
		function AsyncHandler(handler) {
			DelegateHandler.call(this, handler);
		}

		AsyncHandler.prototype = objectCreate(DelegateHandler.prototype);

		AsyncHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
			tasks.enqueue(new RunHandlerTask(resolve, notify, t, receiver, f, r, u, this.join()));
		};

		/**
		 * Handler that follows another handler, injecting a receiver
		 * @private
		 * @param {object} handler another handler to follow
		 * @param {object=undefined} receiver
		 * @constructor
		 */
		function BoundHandler(handler, receiver) {
			DelegateHandler.call(this, handler);
			this.receiver = receiver;
		}

		BoundHandler.prototype = objectCreate(DelegateHandler.prototype);

		BoundHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
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
		 * Handler that wraps an untrusted thenable and assimilates it in a future stack
		 * @private
		 * @param {function} then
		 * @param {{then: function}} thenable
		 * @constructor
		 */
		function ThenableHandler(then, thenable) {
			DeferredHandler.call(this);
			this.assimilated = false;
			this.untrustedThen = then;
			this.thenable = thenable;
		}

		ThenableHandler.prototype = objectCreate(DeferredHandler.prototype);

		ThenableHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
			if(!this.assimilated) {
				this.assimilated = true;
				this._assimilate();
			}
			DeferredHandler.prototype.when.call(this, resolve, notify, t, receiver, f, r, u);
		};

		ThenableHandler.prototype._assimilate = function() {
			var h = this;
			this._try(this.untrustedThen, this.thenable, _resolve, _reject, _notify);

			function _resolve(x) { h.resolve(x); }
			function _reject(x)  { h.reject(x); }
			function _notify(x)  { h.notify(x); }
		};

		ThenableHandler.prototype._try = function(then, thenable, resolve, reject, notify) {
			try {
				then.call(thenable, resolve, reject, notify);
			} catch (e) {
				reject(e);
			}
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

		FulfilledHandler.prototype = objectCreate(Handler.prototype);

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
			this.observed = false;

			if(this._isMonitored()) {
				this.key = this._env.promiseMonitor.startTrace(x);
			}
		}

		RejectedHandler.prototype = objectCreate(Handler.prototype);

		RejectedHandler.prototype.inspect = function() {
			return toRejectedState(this.value);
		};

		RejectedHandler.prototype.when = function(resolve, notify, t, receiver, f, r) {
			if(this._isMonitored() && !this.observed) {
				this._env.promiseMonitor.removeTrace(this.key);
			}

			this.observed = true;
			var x = typeof r === 'function'
				? tryCatchReject(r, this.value, receiver)
				: reject(this.value);

			resolve.call(t, x);
		};

		RejectedHandler.prototype._addTrace = function(trace) {
			if(!this.observed) {
				this._env.promiseMonitor.updateTrace(this.key, trace);
			}
		};

		// Errors and singletons

		foreverPendingPromise = new InternalPromise(new Handler());

		function promiseCycleHandler() {
			return new RejectedHandler(new TypeError('Promise cycle'));
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

		// Task runners

		/**
		 * Run a single consumer
		 * @private
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
		 * @param {*} x
		 * @returns {boolean} false iff x is guaranteed not to be a thenable
		 */
		function maybeThenable(x) {
			return (typeof x === 'object' || typeof x === 'function') && x !== null;
		}

		/**
		 * Return f.call(thisArg, x), or if it throws return a rejected promise for
		 * the thrown exception
		 * @private
		 */
		function tryCatchReject(f, x, thisArg) {
			try {
				return f.call(thisArg, x);
			} catch(e) {
				return reject(e);
			}
		}

		/**
		 * Return f.call(thisArg, x), or if it throws, *return* the exception
		 * @private
		 */
		function tryCatchReturn(f, x, thisArg) {
			try {
				return f.call(thisArg, x);
			} catch(e) {
				return e;
			}
		}

		function noop() {}

		return Promise;
	};
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
