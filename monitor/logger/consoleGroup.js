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

	var console = window.console;
	var warn, warnAll;

	if(console) {
		warn = console.warn ? function(x) { console.warn(x); }
			: console.log ? function(x) { console.log(x); }
				: noop;
	} else {
		warn = noop;
	}

	if(console && console.groupCollapsed) {
		warnAll = function(msg, list) {
			console.groupCollapsed(msg);
			try {
				list.forEach(warn);
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

	return function log(rejections) {
		if(rejections.length) {
			warnAll('[promises] Unhandled rejections: ' + rejections.length,
				rejections);
		} else {
			warn('[promises] All unhandled rejections have been handled');
		}
	};

	function noop() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
