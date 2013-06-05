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

		console.log('*** Creating deep promise rejection chain ***');
		var p = f1();

		p = p.then(ok);

		p = p.then(ok);

		// Cause an unhandled rejection deep in the promise chain
		// It's unhandled because after this statement, p is a
		// rejected promise but has no onRejected handler
		// This should be logged
		p = p.then(reject);

		// Some time later, handle the rejection
		// When this happens, p suddenly becomes handled (obviously!),
		// and this will be logged as well.
		setTimeout(function() {
			console.log('*** handling rejection ***');
			p.otherwise(ok);
		}, 1337);

		function ok(x) {
			return x;
		}

		function reject(x) {
			return when.reject(new Error('error originates here'));
		}
	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

