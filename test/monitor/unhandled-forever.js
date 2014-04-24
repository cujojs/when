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

		require('../../monitor/console');

		var Promise = require('../../when').Promise;

		function f1() {
			return new Promise(function(_, reject) {
				reject(new Error('unhandled-forever'));
			});
		}

		function f2(p) {
			return p.then(function() {});
		}

		function f3(p) {
			return p.then(function() {});
		}

//		f1();
//		f2(f1());
		f3(f2(f1()));
	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

