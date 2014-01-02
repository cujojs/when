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

	return new Error().stack
		? function (msg) {
			return new Error(msg).stack;
		}
		: function (msg) {
			try {
				throw new Error(msg);
			} catch (e) {
				return e.stack;
			}
		};


});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
