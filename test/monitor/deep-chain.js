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

		Promise.resolve().then(function outer() {
			return Promise.resolve().then(function inner() {
				return Promise.resolve().then(function evenMoreInner() {
					foo()
				});
			});
		});

		function f1() {
			return Promise.resolve(123);
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
			return Promise.reject(new Error('error originates here'));
		}
	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

