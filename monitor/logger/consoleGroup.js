/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */
(function(define) { 'use strict';
define(function(require) {

	var array, warn, warnAll, log;

	array = require('../array');

	if(typeof console === 'undefined') {
		// No console, give up, but at least don't break;
		log = consoleNotAvailable;
	} else {
		warn = console.warn ? function(x) { console.warn(x); }
			: console.log ? function(x) { console.log(x); }
				: consoleNotAvailable;

		if(console.groupCollapsed) {
			warnAll = function(msg, list) {
				console.groupCollapsed(msg);
				try {
					array.forEach(list, warn);
				} finally {
					console.groupEnd();
				}
			};
		} else {
			warnAll = function(msg, list) {
				warn(msg);
				warn(list);
			};
		}

		log = function(rejections) {
			if(rejections.length) {
				warnAll('[promises] Unhandled rejections: '
					+ rejections.length, rejections);
			} else {
				warn('[promises] All unhandled rejections have been handled');
			}
		};
	}

	return log;

	function consoleNotAvailable() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
