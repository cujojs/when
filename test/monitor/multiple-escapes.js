/** @license MIT License (c) copyright 2010-2014 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
	define(function(require) {

//		require('../../monitor/console');

		var Promise = require('../../when').Promise;

		var i = 1;
		var p = new Promise(function(_, reject) {
			setTimeout(reject.bind(null, new Error(i++)), 1);
		});

		var p = new Promise(function(_, reject) {
			setTimeout(reject.bind(null, new Error(i++)), 1);
		});

		var p = new Promise(function(_, reject) {
			setTimeout(reject.bind(null, new Error(i++)), 1);
		});

	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

