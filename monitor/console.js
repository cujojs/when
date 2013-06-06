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

	var createAggregator, throttleReporter, simpleReporter, aggregator,
		formatter, stackFilter, excludeRx, filter, reporter, logger,
		rejectionMsg, reasonMsg;

	createAggregator = require('./aggregator');
	throttleReporter = require('./throttledReporter');
	simpleReporter = require('./simpleReporter');
	formatter = require('./simpleFormatter');
	stackFilter = require('./stackFilter');
	logger = require('./consoleGroupLogger');

	rejectionMsg = '--- Unhandled rejection escaped at ---';
	reasonMsg = '--- Caused by reason ---';

	excludeRx = /when\.js|when\/monitor\//i;
	filter = stackFilter(exclude, mergePromiseFrames);
	reporter = simpleReporter(formatter(filter, rejectionMsg, reasonMsg), logger);

	aggregator = createAggregator(throttleReporter(250, reporter));

	publish(aggregator, console);

	return aggregator;

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
