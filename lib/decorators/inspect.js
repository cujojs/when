/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function inspection(Promise) {

		Promise.prototype.inspect = function() {
			var handler = Promise._handler(this);
			var state = handler.state();

			return state === 0 ? { state: 'pending' }
				 : state > 0   ? { state: 'fulfilled', value: handler.value }
						       : { state: 'rejected', reason: handler.value };
		};

		return Promise;
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
