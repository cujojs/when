/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function fold(Promise) {

		Promise.prototype.fold = function(fn, arg) {
			var from = this._handler;
			var promise = this._beget();
			var to = promise._handler;

			from.when({
				resolve: to.resolve,
				notify: to.notify,
				context: to,
				receiver: from.receiver,
				arg: arg,
				fulfilled: fn,
				rejected: void 0,
				progress: void 0
			});

			return promise;
		};

		return Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
