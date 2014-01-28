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

		var then = PromiseType.prototype.then;

		function MonitoredPromise() {
			PromiseType.apply(this, arguments);
			var status = this._status = new PromiseStatus();

			var self = this;
			then.call(this, function()  {
				status.fulfilled();
				self._status = void 0;
			}, function(r) {
				status.rejected(r);
			});
		}

		MonitoredPromise.cast = cast;
		MonitoredPromise.resolve = resolve;
		MonitoredPromise.reject = reject;

		MonitoredPromise.prototype = PromiseType.prototype;
		MonitoredPromise.prototype.constructor = MonitoredPromise;

		// Override with instrumented then
		MonitoredPromise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			/*jshint unused:false*/
			var p = then.apply(this, arguments);
			if(this._status) {
				p._status = this._status.observed();
			}

			return p;
		};

		// Override with instrumented done
		MonitoredPromise.prototype.done = function(handleResult, handleError) {
			this.then(handleResult, handleError)['catch'](crash);
		};

		// Add remaining statics to constructor
		Object.keys(PromiseType).reduce(function(mp, key) {
			if(typeof PromiseType[key] === 'function' && typeof mp[key] === 'undefined') {
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

		function reject(reason) {
			return new MonitoredPromise(function(_, reject) {
				reject(reason);
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
