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
		rejectionMsg, reasonMsg, filteredFramesMsg, attachPoint;

	createAggregator = require('./aggregator');
	throttleReporter = require('./throttledReporter');
	simpleReporter = require('./simpleReporter');
	formatter = require('./simpleFormatter');
	stackFilter = require('./stackFilter');
	logger = require('./logger/consoleGroup');

	rejectionMsg = '--- Unhandled rejection escaped at ---';
	reasonMsg = '--- Caused by reason ---';
	filteredFramesMsg = '  ...[filtered frames]...';

	excludeRx = /when\.js|when\/monitor\//i;
	filter = stackFilter(exclude, mergePromiseFrames);
	reporter = simpleReporter(formatter(filter, rejectionMsg, reasonMsg), logger);

	aggregator = createAggregator(throttleReporter(250, reporter));

	attachPoint = typeof console !== 'undefined'
		? aggregator.publish(console)
		: aggregator;

	return aggregator;

	function mergePromiseFrames(/* frames */) {
		return filteredFramesMsg;
	}

	function exclude(line) {
		var rx = attachPoint.promiseStackFilter || excludeRx;
		return rx.test(line);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
