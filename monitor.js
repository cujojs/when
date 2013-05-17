/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */
(function(define) { 'use strict';
define(function() {

	var unhandled, interval;

	if(console) {
		console.unhandledRejections = unhandled = [];
		console.logUnhandled = logUnhandled;
		console.clearUnhandled = clearUnhandled;

		console.unhandledRejection = function(promise, reason) {
			unhandled.push({ timestamp: +(new Date()), promise: promise, reason: reason});
		};

		console.handledRejection = function(promise) {
			unhandled.some(function(rec, i) {
				if(rec.promise === promise) {
					unhandled.splice(i, 1);
					return true;
				}
			});
		}

		clearUnhandled();
		start();

		if (typeof process !== "undefined" && process.on) {
			process.on("exit", logUnhandled);
		}
	}

	return {
		start: start,
		stop: stop,
		clearUnhandled: clearUnhandled,
		logUnhandled: logUnhandled
	}

	function logUnhandled() {
		console.log(unhandled);
	}

	function clearUnhandled() {
		unhandled.length = 0;
	}

	function start() {
		stop();
		interval = setInterval(logUnhandled, 1000);
	}

	function stop() {
		if(interval == null) {
			return;
		}

		clearInterval(interval);
		interval = null;
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
