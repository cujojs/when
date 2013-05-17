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

	var pending, unhandled, interval;

	if(console) {
		pending = [];

		console.unhandledRejections = unhandled = [];
		console.logUnhandledRejections = logUnhandledRejections;
		console.clearUnhandledRejections = clearUnhandledRejections;

		console.promisePending = function(promise) {
			var err;
			try {
				throw new Error();
			} catch(e) {
				err = e;
			}

			pending.push({ promise: promise, origin: err });
		}

		console.promiseResolved = function(promise) {
			removePromise(pending, promise);
		}

		console.unhandledRejection = function(promise, reason) {
			var rec = { timestamp: +(new Date()), promise: promise, reason: reason};
			pending.some(function(prec, i) {
				if(promise === prec.promise) {
					rec.origin = prec.origin;
					pending.splice(i, 1);
					return true;
				}
			});

			unhandled.push(rec);
		};

		console.handledRejection = function(promise) {
			removePromise(unhandled, promise);
			removePromise(pending, promise);
		}

		clearUnhandledRejections();
		start();

		if (typeof process !== "undefined" && process.on) {
			process.on("exit", logUnhandledRejectionsIfNonEmpty);
		}
	}

	return {
		start: start,
		stop: stop,
		clearUnhandled: clearUnhandledRejections,
		logUnhandled: logUnhandledRejections
	}

	function logUnhandledRejectionsIfNonEmpty() {
		if(unhandled.length) {
			logUnhandledRejections();
		}
	}

	function logUnhandledRejections() {
		console.log(unhandled);
	}

	function clearUnhandledRejections() {
		unhandled.length = 0;
	}

	function start() {
		stop();
		interval = setInterval(logUnhandledRejectionsIfNonEmpty, 1000);
	}

	function stop() {
		if(interval == null) {
			return;
		}

		clearInterval(interval);
		interval = null;
	}

	function removePromise(list, promise) {
		list.some(function(rec, i) {
			if(rec.promise === promise) {
				list.splice(i, 1);
				return true;
			}
		});
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
