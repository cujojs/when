/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function() {

	/**
	 * Logger that simply forwards to two other loggers
	 * @param {function} log1 first logger to forward to
	 * @param {function} log2 second logger to forward to
	 */
	return function(log1, log2) {
		return function(rejections) {
			log1(rejections);
			log2(rejections);
		};
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
