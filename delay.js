/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * delay.js
 *
 * Helper that returns a promise that resolves after a delay.
 *
 * @author Brian Cavalier
 */

(function(define) {
define(function(require) {
	/*global vertx,setTimeout*/
	var when, setTimer, undef;

	when = require('./when');

	setTimer = typeof vertx === 'object'
		? function (f, ms) { return vertx.setTimer(ms, f); }
		: setTimeout;

    /**
     * Creates a new promise that will resolve after a msec delay.  If promise
     * is supplied, the delay will start *after* the supplied promise is resolved.
     *
     * Usage:
     * // Do something after 1 second, similar to using setTimeout
     * delay(1000).then(doSomething);
     * // or
     * when(delay(1000), doSomething);
     *
     * // Do something 1 second after triggeringPromise resolves
     * delay(triggeringPromise, 1000).then(doSomething, handleRejection);
     * // or
     * when(delay(triggeringPromise, 1000), doSomething, handleRejection);
     *
     * @param {*} [value] any promise or value after which the delay will start
     * @param msec {Number} delay in milliseconds
     */
    return function delay(result, msec) {
        if(arguments.length < 2) {
            msec = result >>> 0;
            result = undef;
        }

		return when.promise(function(resolve, reject, notify) {
			when(result, function(val) {
				setTimeout(function() {
					resolve(val);
				}, msec);
			},
			reject, notify);
		});
    };

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
);


