/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * delay.js
 *
 * Helper that returns a promise that resolves after a delay.
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) {
define(function(require) {

	var cast = require('./Promise').cast;

    /**
	 * @deprecated Use Promise.cast(value).delay(ms)
     */
    return function delay(msec, value) {
		return cast(value).delay(msec);
    };

});
})(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });


