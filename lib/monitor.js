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

	return function(PromiseStatus, PromiseType) {

		var coerce = PromiseType.prototype._coerce;

		function MonitoredPromise() {
			PromiseType.apply(this, arguments);
			this._status = new PromiseStatus();
		}

		MonitoredPromise.resolve = resolve;
		MonitoredPromise.cast = cast;
		MonitoredPromise.reject = function(reason) {
			return new MonitoredPromise(function(_, reject) {
				reject(reason);
			});
		};

		MonitoredPromise.prototype = Object.create(PromiseType.prototype);
		MonitoredPromise.prototype.constructor = MonitoredPromise;

		MonitoredPromise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			/*jshint unused:false*/
			var p = PromiseType.prototype.then.apply(this, arguments);
			if(this._status) {
				p._status = this._status.observed();
			}

			return p;
		};

		MonitoredPromise.prototype.done = function(handleResult, handleError) {
			this.then(handleResult, handleError)['catch'](crash);
		};

		MonitoredPromise.prototype._coerce = function(x) {
			var coerced = coerce.call(this, x);
			var status = this._status;
			var self;

			if(status) {
				self = this;
				coerced.then(
					function()  {
						status.fulfilled();
						delete self._status;
					},
					function(r) {
						status.rejected(r);
					}
				);
			}

			return coerced;
		};

		Object.keys(PromiseType).reduce(function(mp, key) {
			if(typeof PromiseType[key] === 'function') {
				mp[key] = function() {
					return cast(PromiseType[key].apply(PromiseType, arguments));
				};
			}
			return mp;
		}, MonitoredPromise);

		function cast(x) {
			return x instanceof MonitoredPromise ? x : resolve(x);
		}

		function resolve(x) {
			return new MonitoredPromise(function(resolve) {
				resolve(x);
			});
		}

		function crash(fatalError) {
			PromiseStatus.reportUnhandled();
			throw fatalError;
		}

		return MonitoredPromise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
