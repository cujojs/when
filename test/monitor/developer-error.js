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

	var p = when.resolve(123);

	p.then(function() {
		oops();
	});

	function infiniteRecursion() {
		infiniteRecursion();
	}

	p.then(infiniteRecursion);

	var notAFunction = {};
	function tryToCallNotAFunction() {
		notAFunction();
	}

	p.then(tryToCallNotAFunction);
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

