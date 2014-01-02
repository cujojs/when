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
	var bind, uncurryThis, call, forEach, slice, undef;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	call = uncurryThis(bind.call);
	slice = uncurryThis(Array.prototype.slice);
	forEach = uncurryThis(Array.prototype.forEach);

	return makePromise;

	function makePromise(environment) {

		var enqueue, monitorApi, setTimer, cancelTimer;

		enqueue = environment.enqueue;
		setTimer = environment.setTimeout;
		cancelTimer = environment.clearTimeout;
		monitorApi = environment.monitor;

		/**
		 * Trusted Promise constructor.  A Promise created from this constructor is
		 * a trusted when.js promise.  Any other duck-typed promise is considered
		 * untrusted.
		 * @constructor
		 * @returns {Promise} promise whose fate is determine by resolver
		 * @name Promise
		 */
		function Promise(resolver) {
			var self, value, consumers = [];

			self = this;
			this.inspect = inspect;
			this._when = _when;

			if(monitorApi && monitorApi.PromiseStatus) {
				this._status = new monitorApi.PromiseStatus();
			}

			// Call the provider resolver to seal the promise's fate
			try {
				resolver(promiseResolve, promiseReject, promiseNotify);
			} catch(e) {
				promiseReject(e);
			}

			/**
			 * Returns a snapshot of this promise's current status at the instant of call
			 * @returns {{state:String}}
			 */
			function inspect() {
				return value ? value.inspect() : toPendingState();
			}

			/**
			 * Private message delivery. Queues and delivers messages to
			 * the promise's ultimate fulfillment value or rejection reason.
			 * @private
			 */
			function _when(resolve, notify, onFulfilled, onRejected, onProgress) {
				consumers ? consumers.push(deliver) : enqueue(function() { deliver(value); });

				function deliver(p) {
					p._when(resolve, notify, onFulfilled, onRejected, onProgress);
				}
			}

			/**
			 * Transition from pre-resolution state to post-resolution state, notifying
			 * all listeners of the ultimate fulfillment or rejection
			 * @param {*} val resolution value
			 */
			function promiseResolve(val) {
				if(!consumers) {
					return;
				}

				var queue = consumers;
				consumers = undef;

				enqueue(function () {
					value = coerce(self, val);
					if(self._status) {
						updateStatus(value, self._status);
					}
					runHandlers(queue, value);
				});
			}

			/**
			 * Reject this promise with the supplied reason, which will be used verbatim.
			 * @param {*} reason reason for the rejection
			 */
			function promiseReject(reason) {
				promiseResolve(new RejectedPromise(reason));
			}

			/**
			 * Issue a progress event, notifying all progress listeners
			 * @param {*} update progress event payload to pass to all listeners
			 */
			function promiseNotify(update) {
				if(consumers) {
					var queue = consumers;
					enqueue(function () {
						runHandlers(queue, new ProgressingPromise(update));
					});
				}
			}
		}

		Promise.of = of;
		Promise.empty = empty;
		Promise.cast = cast;
		Promise.resolve = resolve;
		Promise.reject = reject;
		Promise.all = all;
		Promise.any = any;
		Promise.some = some;
		Promise.race = race;
		Promise.settle = settle;
		Promise.unfold = unfold;
		Promise.iterate = iterate;

		function of(x) {
			return resolve(new FulfilledPromise(x));
		}

		function empty() {
			return new Promise(identity);
		}

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
				self._when(resolve, notify, onFulfilled, onRejected, onProgress);
			}, this._status && this._status.observed());
		};

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @return {Promise}
		 */
		Promise.prototype['catch'] = Promise.prototype.otherwise = function(onRejected) {
			return this.then(undef, onRejected);
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
		 * Terminate a promise chain by handling the ultimate fulfillment value or
		 * rejection reason, and assuming responsibility for all errors.  if an
		 * error propagates out of handleResult or handleFatalError, it will be
		 * rethrown to the host, resulting in a loud stack track on most platforms
		 * and a crash on some.
		 * @param {function?} handleResult
		 * @param {function?} handleError
		 * @returns {undefined}
		 */
		Promise.prototype.done = function(handleResult, handleError) {
			this.then(handleResult, handleError)['catch'](crash);
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

		Promise.prototype.timeout = function(ms) {
			var self = this;
			return this.constructor(function(resolve, reject, notify) {

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

		Promise.prototype.as = function(PromiseType) {
			var self = this;
			return new PromiseType(function(resolve) {
				resolve(self);
			});
		};

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
			var self = this;
			return new Promise(function(resolve, reject) {
				var pending = 2;
				self.then(resolve, handleReject);
				cast(promise).then(resolve, handleReject);

				function handleReject(e) {
					if(--pending === 0) {
						reject(e);
					}
				}
			});
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
		 * @param  {*} value
		 * @return {Promise}
		 */
		function resolve(value) {
			return new Promise(function(resolve) {
				resolve(value);
			});
		}

		function reject(reason) {
			return new Promise(function(_, reject) {
				reject(reason);
			});
		}

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

		function unfold(unspool, condition, handler, seed) {
			return cast(seed).then(function(seed) {

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

		function iterate(f, condition, handler, seed) {
			return cast(seed).then(function(seed) {

				return cast(condition(seed)).then(function(done) {
					return done ? seed : cast(f(seed)).then(next);
				});

				function next(nextValue) {
					return cast(handler(nextValue)).then(function() {
						return iterate(f, condition, handler, nextValue);
					});
				}
			});
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

		/**
		 * Coerces x to a trusted Promise
		 * @param {Promise} self promise on whose behalf to coerce x
		 * @param {*} x thing to coerce
		 * @returns {*} Guaranteed to return a trusted Promise.  If x
		 *   is trusted, returns x, otherwise, returns a new, trusted, already-resolved
		 *   Promise whose resolution value is:
		 *   * the resolution value of x if it's a foreign promise, or
		 *   * x if it's a value
		 */
		function coerce(self, x) {
			if (x === self) {
				return new RejectedPromise(new TypeError());
			}

			if (x instanceof Promise) {
				return x;
			}

			try {
				var untrustedThen = x === Object(x) && x.then;

				return typeof untrustedThen === 'function'
					? assimilate(untrustedThen, x)
					: new FulfilledPromise(x);
			} catch(e) {
				return new RejectedPromise(e);
			}
		}

		/**
		 * Safely assimilates a foreign thenable by wrapping it in a trusted promise
		 * @param {function} untrustedThen x's then() method
		 * @param {object|function} x thenable
		 * @returns {Promise}
		 */
		function assimilate(untrustedThen, x) {
			return new Promise(function (resolve, reject) {
				call(untrustedThen, x, resolve, reject);
			});
		}

		/**
		 * Creates a fulfilled, local promise as a proxy for a value
		 * NOTE: must never be exposed
		 * @private
		 * @constructor
		 * @param {*} value fulfillment value
		 */
		function FulfilledPromise(value) {
			this.value = value;
		}

		FulfilledPromise.prototype = Object.create(Promise.prototype);

		FulfilledPromise.prototype.inspect = function() {
			return toFulfilledState(this.value);
		};

		FulfilledPromise.prototype._when = function(resolve, _, onFulfilled) {
			try {
				resolve(typeof onFulfilled === 'function' ? onFulfilled(this.value) : this.value);
			} catch(e) {
				resolve(new RejectedPromise(e));
			}
		};

		/**
		 * Creates a rejected, local promise as a proxy for a value
		 * NOTE: must never be exposed
		 * @private
		 * @constructor
		 * @param {*} reason rejection reason
		 */
		function RejectedPromise(reason) {
			this.value = reason;
		}

		RejectedPromise.prototype = Object.create(Promise.prototype);

		RejectedPromise.prototype.inspect = function() {
			return toRejectedState(this.value);
		};

		RejectedPromise.prototype._when = function(resolve, _, __, onRejected) {
			try {
				resolve(typeof onRejected === 'function' ? onRejected(this.value) : this);
			} catch(e) {
				resolve(new RejectedPromise(e));
			}
		};

		/**
		 * Create a progress promise with the supplied update.
		 * @private
		 * @constructor
		 * @param {*} value progress update value
		 */
		function ProgressingPromise(value) {
			this.value = value;
		}

		ProgressingPromise.prototype = Object.create(Promise.prototype);

		ProgressingPromise.prototype._when = function(_, notify, f, r, u) {
			try {
				notify(typeof u === 'function' ? u(this.value) : this.value);
			} catch(e) {
				notify(e);
			}
		};

		/**
		 * Update a PromiseStatus monitor object with the outcome
		 * of the supplied value promise.
		 * @param {Promise} value
		 * @param {PromiseStatus} status
		 */
		function updateStatus(value, status) {
			value.then(statusFulfilled, statusRejected);

			function statusFulfilled() { status.fulfilled(); }
			function statusRejected(r) { status.rejected(r); }
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
			if(typeof monitorApi.reportUnhandled === 'function') {
				monitorApi.reportUnhandled();
			} else {
				enqueue(function() {
					throw fatalError;
				});
			}

			throw fatalError;
		}

		function identity(x) {
			return x;
		}

		return Promise;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
