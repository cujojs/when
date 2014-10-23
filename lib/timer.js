/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {
	/*global setTimeout,clearTimeout*/

	// Sane environments with setTimeout
	if(typeof setTimeout !== 'undefined') {
		// NOTE: Truncate decimals to workaround node 0.10.30 bug:
		// https://github.com/joyent/node/issues/8167
		return {
			set: function (f, ms) {
				return setTimeout(f, ms|0);
			},
			clear: function (t) {
				return clearTimeout(t);
			}
		};
	}

	// Check for vertx environment by attempting to load vertx module.
	// Doing the check in two steps ensures compatibility with RaveJS,
	// which will return an empty module when browser: { vertx: false }
	// is set in package.json
	var cjsRequire = require;
	var vertx = cjsRequire('vertx');

	// If vertx loaded and has the timer features we expect, try to support it
	if (vertx && typeof vertx.setTimer === 'function') {
		return {
			set: function (f, ms) {
				return vertx.setTimer(ms, f);
			},
			clear: vertx.cancelTimer
		};
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
