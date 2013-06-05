/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */
(function(define) { 'use strict';
define(function(require) {

	var createAggregator, createReporter, aggregator, formatter, stackFilter,
		excludeRx, filter, reporter, rejectionMsg, reasonMsg;

	createAggregator = require('./aggregator');
	createReporter = require('./simpleReporter');
	formatter = require('./simpleFormatter');
	stackFilter = require('./stackFilter');

	rejectionMsg = '--- Unhandled rejection escaped at ---';
	reasonMsg = '--- Caused by reason ---';

	excludeRx = /when\.js|when\/monitor\//i;
	filter = stackFilter(exclude, mergePromiseFrames);
	reporter = createReporter(formatter(filter, rejectionMsg, reasonMsg), log);

	aggregator = createAggregator(reporter);

	publish(aggregator, console);

	return aggregator;

	function log(promises) {
		if(promises.length) {
			console.warn('[promises] Unhandled rejections\n', promises);
		} else {
			console.warn('[promises] All unhandled rejections have been handled');
		}
	}

	function mergePromiseFrames(/* frames */) {
		return '  ...[filtered frames]...';
	}

	function exclude(line) {
		var rx = console.promiseStackFilter || excludeRx;
		return rx.test(line);
	}

	function publish(aggregator, target) {
		target.reportUnhandled = aggregator.report;
		target.promiseObserved = aggregator.promiseObserved;
		target.promisePending = aggregator.promisePending;
		target.promiseFulfilled = aggregator.promiseFulfilled;
		target.unhandledRejection = aggregator.unhandledRejection;
		return target;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
