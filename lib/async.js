/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	// Sniff "best" async scheduling option
	// Prefer process.nextTick or MutationObserver, then check for
	// setTimeout, and finally vertx, since its the only env that doesn't
	// have setTimeout

	/*jshint maxcomplexity:6*/
	/*global process,document,setTimeout,MutationObserver,WebKitMutationObserver*/
	var MutationObs;

	if (typeof process !== 'undefined' && process !== null &&
		typeof process.nextTick === 'function') {
		return function (f) {
			process.nextTick(f);
		};
	}

	if (MutationObs =
		(typeof MutationObserver === 'function' && MutationObserver) ||
		(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
		return (function (document, MutationObserver) {
			var scheduled;
			var node = document.createTextNode('');
			var o = new MutationObserver(run);
			o.observe(node, { characterData: true });

			function run() {
				var f = scheduled;
				scheduled = void 0;
				f();
			}

			var i = 0;
			return function (f) {
				scheduled = f;
				node.data = (i ^= 1);
			};
		}(document, MutationObs));
	}

	if (typeof setTimeout !== 'undefined') {
		var capturedSetTimeout = setTimeout;
		return function (t) {
			capturedSetTimeout(t, 0);
		};
	}

	var cjsRequire = require;
	var vertx = cjsRequire('vertx');
	return vertx.runOnLoop || vertx.runOnContext;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
