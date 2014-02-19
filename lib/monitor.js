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
			instrument(new PromiseStatus(), this);
		}

		function instrument(status, p) {
			p._status = status;
			then.call(p, function() {
				status.fulfilled();
			}, function(e) {
				status.rejected(e);
			});
		}

		MonitoredPromise.resolve = resolve;
		MonitoredPromise.reject = reject;

		MonitoredPromise.prototype = Object.create(PromiseType.prototype);
		MonitoredPromise.prototype.constructor = MonitoredPromise;

		// Override with instrumented then
		MonitoredPromise.prototype.then = function(onFulfilled, onRejected, onProgress) {
			/*jshint unused:false*/
			var p = then.apply(this, arguments);
			if(this._status) {
				instrument(this._status.observed(), p);
			}

			return p;
		};

		// Override _fatal to trigger monitor reporting
		MonitoredPromise.prototype._fatal = function(fatalError) {
			/*jshint unused:false*/
			PromiseStatus.reportUnhandled();
			PromiseType.prototype._fatal.apply(this, arguments);
		};

		// Add remaining statics to constructor
		Object.keys(PromiseType).reduce(function(mp, key) {
			var f = PromiseType[key];
			if(typeof f === 'function' && typeof mp[key] === 'undefined') {
				mp[key] = function() {
					var x = f.apply(PromiseType, arguments);

					if(x instanceof PromiseType) {
						instrument(new PromiseStatus(), x);
					}

					return x;
				};
			}
			return mp;
		}, MonitoredPromise);

		function resolve(x) {
			return x instanceof MonitoredPromise ? x
				: new MonitoredPromise(function(resolve) {
					resolve(x);
				});
		}

		function reject(reason) {
			return new MonitoredPromise(function(_, reject) {
				reject(reason);
			});
		}

		return MonitoredPromise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
