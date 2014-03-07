/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {
	/*global setImmediate,process*/

	var Promise, tests, run, ok;

	Promise = require('../when').Promise;
	run = require('./run');
	ok = 0;

	tests = [
		{ name: 'pending', fn: createPending },
		{ name: 'resolved', fn: createResolved },
		{ name: 'rejected', fn: createRejected },
		{ name: 'never', fn: createNever },
		{ name: 'resolve', fn: resolvePromise, defer: true },
		{ name: 'reject', fn: rejectPromise, defer: true },
		{ name: 'setImmediate', fn: viaSetImmediate, defer: true,
			condition: checkSetImmediate },
		{ name: 'process.nextTick', fn: viaProcessNextTick, defer: true,
			condition: checkProcessNextTick },
		{ name: 'setTimeout', fn: viaSetTimeout, defer: true },
		{ name: 'reject then resolve', fn: rejectThenResolve, defer: true },
		{ name: 'resolve chain 100',  fn: resolveChain(100), defer: true },
		{ name: 'resolve chain 1k', fn: resolveChain(1e3), defer: true },
		{ name: 'sparse resolve chain 1k', fn: resolveChainSparse(1e3), defer: true },
		{ name: 'reject chain 100',  fn: rejectChain(100), defer: true },
		{ name: 'reject chain 1k', fn: rejectChain(1e3), defer: true },
		{ name: 'sparse reject chain 1k', fn: rejectChainSparse(1e3), defer: true },
		// These 10k tests seem to cause significant garbage collection
		// hits that skew results of other tests.  So, they are disabled
		// for now, but we need to figure out how to reduce the memory
		// thrashing these cause.
		// Leaving one enabled for now.
		{ name: 'resolve chain 10k', fn: resolveChain(1e4), defer: true }
//		{ name: 'sparse resolve chain 10k', fn: resolveChainSparse(1e4), defer: true },
//		{ name: 'reject chain 10k', fn: rejectChain(1e4), defer: true },
//		{ name: 'sparse reject chain 10k', fn: rejectChainSparse(1e4), defer: true }
	];

	run(tests);

	//
	// Benchmark tests
	//

	function createPending() {
		/*jshint nonew:false*/
		new Promise(pendingForever);
	}

	function createResolved() {
		Promise.resolve();
	}

	function createRejected() {
		Promise.reject();
	}

	function createNever() {
		Promise.never();
	}

	function resolvePromise(deferred) {
		/*jshint nonew:false*/
		new Promise(resolve).done(function() {
			deferred.resolve();
		});
	}

	function rejectPromise(deferred) {
		/*jshint nonew:false*/
		new Promise(reject).done(null, function() {
			deferred.resolve();
		});
	}

	function rejectThenResolve(deferred) {
		/*jshint nonew:false*/
		new Promise(reject).then(null, identity).done(function() {
			deferred.resolve();
		});
	}

	function viaSetTimeout(deferred) {
		setTimeout(function() {
			deferred.resolve();
		}, 0);
	}

	function viaSetImmediate(deferred) {
		setImmediate(function() {
			deferred.resolve();
		});
	}

	function viaProcessNextTick(deferred) {
		process.nextTick(function() {
			deferred.resolve();
		});
	}

	function resolveChain(n) {
		return function(deferred) {
			var p = Promise.resolve({}), i = 0;
			for(;i < n; i++) {
				p = p.then(identity);
			}

			p.done(function() {
				deferred.resolve();
			});
		};
	}

	function resolveChainSparse(n) {
		return function(deferred) {
			var p = Promise.resolve({}), i = 1;
			for(;i < n; i++) {
				p = p.then(null);
			}

			p.then(identity).done(function() {
				deferred.resolve();
			});
		};
	}

	function rejectChain(n) {
		return function(deferred) {
			var p = Promise.reject({}), i = 0;
			for(;i < n; i++) {
				p = p.then(null, rethrow);
			}

			p.done(null, function() {
				deferred.resolve();
			});
		};
	}

	function rejectChainSparse(n) {
		return function(deferred) {
			var p = Promise.reject({}), i = 1;
			for(;i < n; i++) {
				p = p.then(null, rethrow);
			}

			p.then(null, identity).done(function() {
				deferred.resolve();
			});
		};
	}

	//
	// Promise helpers
	//

	function pendingForever() {}

	function resolve(r) {
		r();
	}

	function reject(_, r) {
		r();
	}

	function identity(x) {
		return x;
	}

	function rethrow(e) {
		throw e;
	}

	function checkSetImmediate() {
		return typeof setImmediate === 'function'
			? ok : 'setImmediate() not available';
	}

	function checkProcessNextTick() {
		return typeof process !== 'undefined'
			&& typeof process.nextTick === 'function'
			? ok : 'process.nextTick() not available';
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
