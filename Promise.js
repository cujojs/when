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
	var Scheduler = require('./lib/scheduler');
	var timer = require('./lib/timer');

	var array = require('./lib/array');
	var flow = require('./lib/flow');
	var inspect = require('./lib/inspect');
	var generate = require('./lib/generate');
	var progress = require('./lib/progress');
	var timed = require('./lib/timed');

	var Promise = makePromise({
		scheduler: Scheduler.createDefault()
	});

	return [array, flow, generate, progress, inspect]
		.reduceRight(function(Promise, feature) {
			return feature(Promise);
		}, timed(timer.set, timer.clear, Promise));

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
