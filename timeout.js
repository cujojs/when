/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * timeout.js
 *
 * Helper that returns a promise that rejects after a specified timeout,
 * if not explicitly resolved or rejected before that.
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) {
define(function(require) {

	var when = require('./when');

    /**
     * Returns a new promise that will automatically reject after msec if
     * the supplied trigger doesn't resolve or reject before that.
     *
	 * @param {number} msec timeout in milliseconds
     * @param {*|Promise} trigger any promise or value that should trigger the
	 *  returned promise to resolve or reject before the msec timeout
     * @returns {Promise} promise that will timeout after msec, or be
	 *  equivalent to trigger if resolved/rejected before msec
     */
    return function timeout(msec, trigger) {
		// Support reversed, deprecated argument ordering
		if(typeof trigger === 'number') {
			var tmp = trigger;
			trigger = msec;
			msec = tmp;
		}

		return when(trigger).timeout(msec);
    };
});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });


