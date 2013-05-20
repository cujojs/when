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

		var when = require('../../when');

		function f1() {
			return when.resolve(123);
		}

		var p = f1();

		p = p.then(ok);

		p = p.then(ok);

		p = p.then(reject);

//		p.otherwise(ok);
		setTimeout(function() {
			p.otherwise(ok);
		}, 1100);
		function ok(x) {
			return x;
		}

		function reject(x) {
			return when.reject(new Error('error here'));
		}
	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

