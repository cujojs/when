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

	rejectionMsg = 'Unhandled rejection escaped at:';
	reasonMsg = 'Caused by reason:';

	excludeRx = /when\.js|when\/monitor\//i;
	filter = stackFilter(exclude, mergePromiseFrames);
	reporter = createReporter(formatter(filter, rejectionMsg, reasonMsg), log);

	aggregator = createAggregator(reporter);

	publish(aggregator, console);

	return aggregator;

	function log(promises) {
		console.warn('[promises] Unhandled, rejected promises\n', promises);
	}

	function mergePromiseFrames(/* frames */) {
		return '\t...[promise implementation]...';
	}

	function exclude(line) {
		return excludeRx.test(line);
	}

	function publish(aggregator, target) {
		target.promisePending = aggregator.promisePending;
		target.promiseResolved = aggregator.promiseResolved;
		target.unhandledRejection = aggregator.unhandledRejection;
		target.promiseObserved = aggregator.promiseObserved;
		return target;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
