/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function inspection(Promise) {

		Promise.prototype.inspect = function() {
			return inspect(Promise._handler(this));
		};

		function inspect(handler) {
			var state = handler.state();

			if(state === 0) {
				return { state: 'pending' };
			}

			if(state > 0) {
				return { state: 'fulfilled', value: handler.value };
			}

			return { state: 'rejected', reason: handler.value };
		}

		return Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
