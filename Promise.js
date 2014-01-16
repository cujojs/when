/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function(define) { 'use strict';
define(function (require) {

	var makePromise = require('./lib/makePromise');
	var scheduler = require('./lib/scheduler');
	var timer = require('./lib/timer');

	return makePromise({
		scheduler: scheduler,
		setTimeout: timer.set,
		clearTimeout: timer.clear,
		monitor: typeof console !== 'undefined' && console
	});

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
