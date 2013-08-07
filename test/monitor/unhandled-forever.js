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
			return when.promise(function(_, reject) {
				reject(new Error('unhandled-forever'));
			});
		}

		function f2(p) {
			return p.then(function() {});
		}

		function f3(p) {
			return p.then(function() {});
		}

		f3(f2(f1()));
	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

