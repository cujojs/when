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

		function MonitoredPromise() {
			PromiseType.apply(this, arguments);

			this._status = new PromiseStatus();

			var coerce = this._coerce;

			this._coerce = function(x) {
				var coerced = coerce.call(this, x);
				var status = this._status;
				var self = this;

				if(status) {
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
		}

		MonitoredPromise.prototype = Object.create(PromiseType.prototype);
		MonitoredPromise.prototype.constructor = MonitoredPromise;

		MonitoredPromise.prototype.then = function(f, r, p) {
			var p = PromiseType.prototype.then.apply(this, arguments);
			if(this._status) {
				p._status = this._status.observed()
			}

			return p;
		}

		MonitoredPromise.prototype.done = function(handleResult, handleError) {
			this.then(handleResult, handleError)['catch'](crash);
		};

		Object.keys(PromiseType).reduce(function(mp, key) {
			if(typeof PromiseType[key] === 'function') {
				mp[key] = function() {
					var p = PromiseType[key].apply(PromiseType, arguments);
					return MonitoredPromise.resolve(p);
				};
			}
			return mp;
		}, MonitoredPromise);

		MonitoredPromise.resolve = function(value) {
			return new MonitoredPromise(function(resolve) {
				resolve(value);
			});
		};

		MonitoredPromise.reject = function(reason) {
			return new MonitoredPromise(function(_, reject) {
				reject(reason);
			});
		};

		function crash(fatalError) {
			PromiseStatus.reportUnhandled();
			throw fatalError;
		}

		return MonitoredPromise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
