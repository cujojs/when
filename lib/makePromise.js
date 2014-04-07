/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function makePromise(environment) {

		var tasks = environment.scheduler;
		var monitor = environment.monitor || Promise;

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
			this._handler = arguments.length === 0
				? foreverPendingHandler : init(resolver);
		}

		/**
		 * Run the supplied resolver
		 * @param resolver
		 * @returns {makePromise.DeferredHandler}
		 */
		function init(resolver) {
			var handler = new DeferredHandler();

			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch (e) {
				promiseReject(e);
			}

			return handler;

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} x resolution value
			 */
			function promiseResolve (x) {
				handler.resolve(x);
			}
			/**
			 * Reject this promise with reason, which will be used verbatim
			 * @param {Error|*} reason rejection reason, strongly suggested
			 *   to be an Error type
			 */
			function promiseReject (reason) {
				handler.reject(reason);
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} x progress event payload to pass to all listeners
			 */
			function promiseNotify (x) {
				handler.notify(x);
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
				: promiseFromHandler(new AsyncHandler(getHandlerUnchecked(x)));
		}

		/**
		 * Return a reject promise with x as its reason (x is used verbatim)
		 * @param {*} x
		 * @returns {Promise} rejected promise
		 */
		function reject(x) {
			return promiseFromHandler(new AsyncHandler(new RejectedHandler(x)));
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
		 * @returns {{_handler: DeferredHandler, promise: Promise}}
		 */
		function defer() {
			return promiseFromHandler(new DeferredHandler());
		}

		/**
		 * Create a new promise with the supplied handler
		 * @private
		 * @param {object} handler
		 * @returns {Promise}
		 */
		function promiseFromHandler(handler) {
			return configurePromise(handler, new Promise());
		}

		function configurePromise(handler, p) {
			p._handler = handler;
			return p;
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
			var p = this._beget();
			var parent = this._handler;
			var child = p._handler;

			parent.when({
				resolve: child.resolve,
				notify: child.notify,
				context: child,
				receiver: parent.receiver,
				fulfilled: onFulfilled,
				rejected: onRejected,
				progress: onProgress
			});

			return p;
		};

		/**
		 * If this promise cannot be fulfilled due to an error, call onRejected to
		 * handle the error. Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		Promise.prototype['catch'] = function(onRejected) {
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
			return promiseFromHandler(new BoundHandler(this._handler, thisArg));
		};

		/**
		 * Creates a new, pending promise of the same type as this promise
		 * @private
		 * @returns {Promise}
		 */
		Promise.prototype._beget = function() {
			var p = new this.constructor();
			var parent = this._handler;
			var child = new DeferredHandler(parent.receiver, parent.join().context);
			return configurePromise(child, p);
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
			/*jshint maxcomplexity:8, maxdepth:4*/
			var resolver = new DeferredHandler();
			var len = promises.length >>> 0;
			var pending = len;
			var results = [];
			var i, h, x;

			for (i = 0; i < len; ++i) {
				if (i in promises) {

					x = promises[i];

					if(maybeThenable(x)) {
						h = x instanceof Promise ? x._handler.join()
							: getHandlerUntrusted(x);

						if(h.state === 0) {
							resolveOne(resolver, results, h, i);
						} else if (h.state === 1) {
							results[i] = h.value;
							--pending;
						} else {
							h.chain(resolver, void 0, resolver.reject);
							break;
						}

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

			return promiseFromHandler(resolver);

			function resolveOne(resolver, results, handler, i) {
				handler.chain(resolver, function(x) {
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
				getHandler(promises[i]).chain(h, h.resolve, h.reject);
			}

			return promiseFromHandler(h);
		}

		// Promise internals

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
				var xh = x._handler.join();
				return h === xh ? promiseCycleHandler() : xh;
			}
			return maybeThenable(x) ? getHandlerUntrusted(x) : new FulfilledHandler(x);
		}

		/**
		 * Get an appropriate handler for x, without checking for cycles
		 * @private
		 * @param {*} x
		 * @returns {object} handler
		 */
		function getHandlerUnchecked(x) {
			if(x instanceof Promise) {
				return x._handler.join();
			}
			return maybeThenable(x) ? getHandlerUntrusted(x) : new FulfilledHandler(x);
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
		function Handler() {
			this.state = 0;
		}

		Handler.prototype.when
			= Handler.prototype.resolve
			= Handler.prototype.reject
			= Handler.prototype.notify
			= Handler.prototype._fatal
			= Handler.prototype._removeTrace
			= Handler.prototype._reportTrace
			= noop;

		Handler.prototype.inspect = toPendingState;

		Handler.prototype.join = function() { return this; };

		Handler.prototype.chain = function(to, fulfilled, rejected, progress) {
			this.when({ resolve: noop, notify: noop, context: void 0,
				receiver: to, fulfilled: fulfilled, rejected: rejected, progress: progress });
		};

		/**
		 * Handler that manages a queue of consumers waiting on a pending promise
		 * @private
		 * @constructor
		 */
		function DeferredHandler(receiver, inheritedContext) {
			this.consumers = [];
			this.receiver = receiver;
			this.handler = void 0;
			this.resolved = false;
			this.state = 0;
			if(isMonitored()) {
				this.context = createContext(this, inheritedContext);
			}
		}

		inherit(Handler, DeferredHandler);

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
			if (this.resolved) {
				this.handler = this.handler.join();
				return this.handler;
			} else {
				return this;
			}
		};

		DeferredHandler.prototype.run = function() {
			var q = this.consumers;
			var handler = this.handler = this.handler.join();
			this.consumers = void 0;

			for (var i = 0; i < q.length; ++i) {
				handler.when(q[i]);
			}
		};

		DeferredHandler.prototype._join = function(handler) {
			if(this.resolved) {
				return;
			}

			this.resolved = true;
			this.handler = handler;
			tasks.enqueue(this);

			if(isMonitored()) {
				handler._reportTrace(this.context);
				this.context = void 0;
			}
		};

		DeferredHandler.prototype.when = function(continuation) {
			if(isMonitored()) { this.context = void 0; }

			if(this.resolved) {
				tasks.enqueue(new ContinuationTask(continuation, this.handler));
			} else {
				this.consumers.push(continuation);
			}
		};

		DeferredHandler.prototype.notify = function(x) {
			if(!this.resolved) {
				tasks.enqueue(new ProgressTask(this.consumers, x));
			}
		};

		DeferredHandler.prototype._reportTrace = function(context) {
			this.resolved && this.handler.join()._reportTrace(context);
		};

		DeferredHandler.prototype._removeTrace = function() {
			this.resolved && this.handler.join()._removeTrace();
		};

		/**
		 * Abstract base for handler that delegates to another handler
		 * @private
		 * @param {object} handler
		 * @constructor
		 */
		function DelegateHandler(handler) {
			this.handler = handler;
			this.state = 0;
		}

		inherit(Handler, DelegateHandler);

		DelegateHandler.prototype.join = function() {
			return this.handler.join();
		};

		DelegateHandler.prototype.inspect = function() {
			return this.join().inspect();
		};

		DelegateHandler.prototype._reportTrace = function(context) {
			this.join()._reportTrace(context);
		};

		DelegateHandler.prototype._removeTrace = function() {
			this.join()._removeTrace();
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

		inherit(DelegateHandler, AsyncHandler);

		AsyncHandler.prototype.when = function(continuation) {
			tasks.enqueue(new ContinuationTask(continuation, this.join()));
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

		inherit(DelegateHandler, BoundHandler);

		BoundHandler.prototype.when = function(continuation) {
			// Because handlers are allowed to be shared among promises,
			// each of which possibly having a different receiver, we have
			// to insert our own receiver into the chain if it has been set
			// so that callbacks (f, r, u) will be called using our receiver
			if(this.receiver !== void 0) {
				continuation.receiver = this.receiver;
			}
			this.join().when(continuation);
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

		inherit(DeferredHandler, ThenableHandler);

		ThenableHandler.prototype.when = function(continuation) {
			if(!this.assimilated) {
				this.assimilated = true;
				this._assimilate();
			}
			DeferredHandler.prototype.when.call(this, continuation);
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
			this.state = 1;

			if(isMonitored()) {
				this.context = createContext(this);
			}
		}

		inherit(Handler, FulfilledHandler);

		FulfilledHandler.prototype.inspect = function() {
			return { state: 'fulfilled', value: this.value };
		};

		FulfilledHandler.prototype.when = function(continuation) {
			if(isMonitored()) { enterContext(this.context); }

			var x = typeof continuation.fulfilled === 'function'
				? tryCatchReject(continuation.fulfilled, this.value, continuation.receiver)
				: this.value;

			if(isMonitored()) { exitContext(); }

			continuation.resolve.call(continuation.context, x);
		};

		/**
		 * Handler for a rejected promise
		 * @private
		 * @param {*} x rejection reason
		 * @constructor
		 */
		function RejectedHandler(x) {
			this.value = x;
			this.state = -1;

			if(isMonitored()) {
				this.handled = false;
				this.context = createContext(this);
				this._reportTrace();
			}
		}

		inherit(Handler, RejectedHandler);

		RejectedHandler.prototype.inspect = function() {
			return { state: 'rejected', reason: this.value };
		};

		RejectedHandler.prototype.when = function(continuation) {
			if(isMonitored()) {
				this.handled = true;
				this._removeTrace();
				enterContext(this.context);
			}

			var x = typeof continuation.rejected === 'function'
				? tryCatchReject(continuation.rejected, this.value, continuation.receiver)
				: promiseFromHandler(this);

			if(isMonitored()) { exitContext(); }

			continuation.resolve.call(continuation.context, x);
		};

		RejectedHandler.prototype._reportTrace = function(context) {
			monitor.promiseMonitor.addTrace(this, context);
		};

		RejectedHandler.prototype._removeTrace = function() {
			monitor.promiseMonitor.removeTrace(this);
		};

		RejectedHandler.prototype._fatal = function() {
			monitor.promiseMonitor.fatal(this);
		};

		// Execution context tracking for long stack traces

		var executionContext = [];

		function createContext(at, fromContext) {
			var parent = fromContext || executionContext[executionContext.length - 1];
			return monitor.promiseMonitor.captureStack(at.constructor, parent);
		}

		function enterContext(c) {
			executionContext.push(c);
		}

		function exitContext() {
			executionContext.pop();
		}

		function isMonitored() {
			return typeof monitor.promiseMonitor !== 'undefined';
		}

		// Errors and singletons

		var foreverPendingHandler = new Handler();
		var foreverPendingPromise = promiseFromHandler(foreverPendingHandler);

		function promiseCycleHandler() {
			return new RejectedHandler(new TypeError('Promise cycle'));
		}

		// Snapshot states

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
		function ContinuationTask(continuation, handler) {
			this.continuation = continuation;
			this.handler = handler;
		}

		ContinuationTask.prototype.run = function() {
			this.handler.join().when(this.continuation);
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
			for (var i = 0; i < q.length; ++i) {
				this._notify(q[i]);
			}
		};

		ProgressTask.prototype._notify = function(continuation) {
			var x = typeof continuation.progress === 'function'
				? tryCatchReturn(continuation.progress, this.value, continuation.receiver)
				: this.value;

			continuation.notify.call(continuation.context, x);
		};

		// Other helpers

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

		function inherit(Parent, Child) {
			Child.prototype = objectCreate(Parent.prototype);
			Child.prototype.constructor = Child;
		}

		function noop() {}

		return Promise;
	};
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
