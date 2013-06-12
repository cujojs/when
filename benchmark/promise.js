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

	var when, Benchmark, tests, log;

	when = require('../when');
	Benchmark = require('benchmark');
	log = console.log.bind(console);

	tests = [
		{ name: 'create pending',  fn: createPending },
		{ name: 'resolve promise', fn: resolvePromise, defer: true },
		{ name: 'reject promise',  fn: rejectPromise, defer: true },
		{ name: 'resolve chain',   fn: resolveChain(1000), defer: true }
	];

	run(tests);

	// Test functions
	function createPending() {
		when.promise(pendingForever);
	}

	function resolvePromise(deferred) {
		when.promise(resolve).then(function() {
			deferred.resolve();
		});
	}

	function resolveChain(n) {
		return function(deferred) {
			var p = when.resolve({}), i = 0;
			for(;i < n; i++) {
				p = p.then(identity);
			}

			p.then(function() {
				deferred.resolve();
			});
		}
	}

	function rejectPromise(deferred) {
		when.promise(resolve).then(function() {
			deferred.resolve();
		});
	}

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

	function pad(str, len) {
		var result = str;
		while (result.length < len) {
			result = ' ' + result;
		}
		return result;
	}


	function run(tests) {
		tests.reduce(function (suite, test) {
			test.onComplete = function (event, bench) {
				var result = pad(this.name, 20);
				result += pad(this.hz.toFixed(2) + ' op/s', 16);
				result += pad((1000 * this.stats.mean).toFixed(2), 8);
				result += ' ms/op \xb1 ' + this.stats.rme.toFixed(2) + '%';
				console.log(result);
			}

			return suite.add(test);

		}, new Benchmark.Suite())
			.on('complete', function () {
				log('------------------------------------------------');
			}).run();

	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
