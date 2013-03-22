/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * timeout.js
 *
 * Helper that returns a promise that rejects after a specified timeout,
 * if not explicitly resolved or rejected before that.
 *
 * @author Brian Cavalier
 */

(function(define) {
define(function(require) {
	/*global vertx,setTimeout,clearTimeout*/
    var when, makePromise, setTimer, cancelTimer;

	when = require('./when');
	makePromise =  when.promise;

	if(typeof vertx === 'object') {
		setTimer = function (f, ms) { return vertx.setTimer(ms, f); };
		cancelTimer = vertx.cancelTimer;
	} else {
		setTimer = setTimeout;
		cancelTimer = clearTimeout;
	}

    /**
     * Returns a new promise that will automatically reject after msec if
     * the supplied promise doesn't resolve or reject before that.
     *
     * Usage:
     *
     * var d = when.defer();
     * // Setup d however you need
     *
     * // return a new promise that will timeout if d doesn't resolve/reject first
     * return timeout(d.promise, 1000);
     *
     * @param promise anything - any promise or value that should trigger
     *  the returned promise to resolve or reject before the msec timeout
     * @param msec {Number} timeout in milliseconds
     *
     * @returns {Promise}
     */
    return function timeout(promise, msec) {
        var timeoutRef, rejectTimeout;

		timeoutRef = setTimer(function onTimeout() {
            rejectTimeout(new Error('timed out after ' + msec + 'ms'));
        }, msec);

		return makePromise(function(resolve, reject, notify) {
			rejectTimeout = reject; // capture, tricky

			when(promise,
				function onFulfill(value) {
					cancelTimer(timeoutRef);
					resolve(value);
				},
				function onReject(reason) {
					cancelTimer(timeoutRef);
					reject(reason);
				},
				notify
			);
		});
    };
});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
);


