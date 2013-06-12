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

	var console, createAggregator, throttleReporter, simpleReporter, aggregator,
		formatter, stackFilter, excludeRx, filter, reporter, logger,
		rejectionMsg, reasonMsg, filteredFramesMsg;

	console = window.console;
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

	if(console) {
		aggregator.publish(console);
	}

	return aggregator;

	function mergePromiseFrames(/* frames */) {
		return filteredFramesMsg;
	}

	function exclude(line) {
		var rx = (console && console.promiseStackFilter) || excludeRx;
		return rx.test(line);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
