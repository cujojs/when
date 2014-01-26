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

	var cast = require('./Promise').cast;

    /**
	 * @deprecated Use Promise.cast(trigger).timeout(ms)
     */
    return function timeout(msec, trigger) {
		return cast(trigger).timeout(msec);
    };
});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });


