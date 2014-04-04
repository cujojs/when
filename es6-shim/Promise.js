!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.Promise=e():"undefined"!=typeof global?global.Promise=e():"undefined"!=typeof self&&(self.Promise=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * ES6 global Promise shim
 */
var PromiseConstructor = module.exports = require('../lib/Promise');

var g = typeof global !== 'undefined' && global
	|| typeof window !== 'undefined' && window
	|| typeof self !== 'undefined' && self;

if(typeof g !== 'undefined' && typeof g.Promise === 'undefined') {
	g.Promise = PromiseConstructor;
}

},{"../lib/Promise":2}],2:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function (require) {

	var makePromise = require('./makePromise');
	var Scheduler = require('./scheduler');
	var async = require('./async');

	return makePromise({
		scheduler: new Scheduler(async),
		monitor: typeof console !== 'undefined' ? console : void 0
	});

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });

},{"./async":4,"./makePromise":5,"./scheduler":6}],3:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {
	/**
	 * Circular queue
	 * @param {number} capacityPow2 power of 2 to which this queue's capacity
	 *  will be set initially. eg when capacityPow2 == 3, queue capacity
	 *  will be 8.
	 * @constructor
	 */
	function Queue(capacityPow2) {
		this.head = this.tail = this.length = 0;
		this.buffer = new Array(1 << capacityPow2);
	}

	Queue.prototype.push = function(x) {
		if(this.length === this.buffer.length) {
			this._ensureCapacity(this.length * 2);
		}

		this.buffer[this.tail] = x;
		this.tail = (this.tail + 1) & (this.buffer.length - 1);
		++this.length;
		return this.length;
	};

	Queue.prototype.shift = function() {
		var x = this.buffer[this.head];
		this.buffer[this.head] = void 0;
		this.head = (this.head + 1) & (this.buffer.length - 1);
		--this.length;
		return x;
	};

	Queue.prototype._ensureCapacity = function(capacity) {
		var head = this.head;
		var buffer = this.buffer;
		var newBuffer = new Array(capacity);
		var i = 0;
		var len;

		if(head === 0) {
			len = this.length;
			for(; i<len; ++i) {
				newBuffer[i] = buffer[i];
			}
		} else {
			capacity = buffer.length;
			len = this.tail;
			for(; head<capacity; ++i, ++head) {
				newBuffer[i] = buffer[head];
			}

			for(head=0; head<len; ++i, ++head) {
				newBuffer[i] = buffer[head];
			}
		}

		this.buffer = newBuffer;
		this.head = 0;
		this.tail = this.length;
	};

	return Queue;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));

},{}],4:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	// Sniff "best" async scheduling option
	// Prefer process.nextTick or MutationObserver, then check for
	// vertx and finally fall back to setTimeout

	/*jshint maxcomplexity:6*/
	/*global process,document,setTimeout,MutationObserver,WebKitMutationObserver*/
	var nextTick, MutationObs;

	if (typeof process !== 'undefined' && process !== null &&
		typeof process.nextTick === 'function') {
		nextTick = function(f) {
			process.nextTick(f);
		};

	} else if (MutationObs =
		(typeof MutationObserver === 'function' && MutationObserver) ||
		(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
		nextTick = (function (document, MutationObserver) {
			var scheduled;
			var el = document.createElement('div');
			var o = new MutationObserver(run);
			o.observe(el, { attributes: true });

			function run() {
				var f = scheduled;
				scheduled = void 0;
				f();
			}

			return function (f) {
				scheduled = f;
				el.setAttribute('class', 'x');
			};
		}(document, MutationObs));

	} else {
		nextTick = (function(cjsRequire) {
			try {
				// vert.x 1.x || 2.x
				return cjsRequire('vertx').runOnLoop || cjsRequire('vertx').runOnContext;
			} catch (ignore) {}

			// capture setTimeout to avoid being caught by fake timers
			// used in time based tests
			var capturedSetTimeout = setTimeout;
			return function (t) {
				capturedSetTimeout(t, 0);
			};
		}(require));
	}

	return nextTick;
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

},{}],5:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function makePromise(environment) {

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

			parent.when(child.resolve, child.notify, child,
				parent.receiver, onFulfilled, onRejected, onProgress);

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
			/*jshint maxcomplexity:6*/
			var resolver = new DeferredHandler();
			var len = promises.length >>> 0;
			var pending = len;
			var results = [];
			var i, h;

			for (i = 0; i < len; ++i) {
				if (i in promises) {
					h = getHandlerUnchecked(promises[i]);
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
				return getHandlerChecked(x, h);
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

		Handler.prototype.chain = function(to, f, r, u) {
			this.when(noop, noop, void 0, to, f, r, u);
		};

		Handler.prototype._env = environment.monitor || Promise;
		Handler.prototype._isMonitored = function() {
			return typeof this._env.promiseMonitor !== 'undefined';
		};

		Handler.prototype._createContext = function(fromContext) {
			var parent = fromContext || executionContext[executionContext.length - 1];
			this.context = { stack: void 0, parent: parent };
			this._env.promiseMonitor.captureStack(this.context, this.constructor);
		};

		Handler.prototype._enterContext = function() {
			executionContext.push(this.context);
		};

		Handler.prototype._exitContext = function() {
			executionContext.pop();
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
			if(this._isMonitored()) {
				this._createContext(inheritedContext);
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
				handler._reportTrace(this.context);
				this.context = void 0;
			}
		};

		DeferredHandler.prototype.when = function(resolve, notify, t, receiver, f, r, u) {
			if(this._isMonitored()) { this.context = void 0; }

			if(this.resolved) {
				tasks.enqueue(new RunHandlerTask(resolve, notify, t, receiver, f, r, u, this.handler));
			} else {
				this.consumers.push(resolve, notify, t, receiver, f, r, u);
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

		inherit(DelegateHandler, BoundHandler);

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

		inherit(DeferredHandler, ThenableHandler);

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
			this.state = 1;

			if(this._isMonitored()) {
				this._createContext();
			}
		}

		inherit(Handler, FulfilledHandler);

		FulfilledHandler.prototype.inspect = function() {
			return { state: 'fulfilled', value: this.value };
		};

		FulfilledHandler.prototype.when = function(resolve, notify, t, receiver, f) {
			if(this._isMonitored()) { this._enterContext(); }

			var x = typeof f === 'function'
				? tryCatchReject(f, this.value, receiver)
				: this.value;

			if(this._isMonitored()) { this._exitContext(); }

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
			this.state = -1;

			if(this._isMonitored()) {
				this.id = errorId++;
				this._createContext();
				this._reportTrace();
			}
		}

		inherit(Handler, RejectedHandler);

		RejectedHandler.prototype.inspect = function() {
			return { state: 'rejected', reason: this.value };
		};

		RejectedHandler.prototype.when = function(resolve, notify, t, receiver, f, r) {
			if(this._isMonitored()) {
				this._removeTrace();
				this._enterContext();
			}

			var x = typeof r === 'function'
				? tryCatchReject(r, this.value, receiver)
				: promiseFromHandler(this);

			if(this._isMonitored()) { this._exitContext(); }

			resolve.call(t, x);
		};

		RejectedHandler.prototype._reportTrace = function(context) {
			this._env.promiseMonitor.addTrace(this, context);
		};

		RejectedHandler.prototype._removeTrace = function() {
			this._env.promiseMonitor.removeTrace(this);
		};

		RejectedHandler.prototype._fatal = function() {
			this._env.promiseMonitor.fatal(this);
		};

		// Execution context tracking for long stack traces

		var executionContext = [];
		var errorId = 0;

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
		function RunHandlerTask(a, b, c, d, e, f, g, handler) {
			this.a=a;this.b=b;this.c=c;this.d=d;this.e=e;this.f=f;this.g=g;
			this.handler = handler;
		}

		RunHandlerTask.prototype.run = function() {
			this.handler.join().when(this.a,this.b,this.c,this.d,this.e,this.f,this.g);
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

},{}],6:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var Queue = require('./Queue');

	// Credit to Twisol (https://github.com/Twisol) for suggesting
	// this type of extensible queue + trampoline approach for next-tick conflation.

	function Scheduler(enqueue) {
		this._enqueue = enqueue;
		this._handlerQueue = new Queue(15);

		var self = this;
		this.drainQueue = function() {
			self._drainQueue();
		};
	}

	/**
	 * Enqueue a task. If the queue is not currently scheduled to be
	 * drained, schedule it.
	 * @param {function} task
	 */
	Scheduler.prototype.enqueue = function(task) {
		if(this._handlerQueue.push(task) === 1) {
			this._enqueue(this.drainQueue);
		}
	};

	/**
	 * Drain the handler queue entirely, being careful to allow the
	 * queue to be extended while it is being processed, and to continue
	 * processing until it is truly empty.
	 */
	Scheduler.prototype._drainQueue = function() {
		var q = this._handlerQueue;
		while(q.length > 0) {
			q.shift().run();
		}
	};

	return Scheduler;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

},{"./Queue":3}]},{},[1])
(1)
});
;