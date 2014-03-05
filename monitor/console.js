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

	var PromiseStatus = require('./PromiseStatus');
	var throttleReporter = require('./throttledReporter');
	var simpleReporter = require('./simpleReporter');
	var formatter = require('./simpleFormatter');
	var stackFilter = require('./stackFilter');
	var logger = require('./logger/consoleGroup');

	var rejectionMsg = '=== Unhandled rejection escaped at ===';
	var reasonMsg = '=== Caused by reason ===';
	var stackJumpMsg = '  --- new call stack ---';
	var filteredFramesMsg = '  ...[filtered frames]...';

	var excludeRx = /when\.js|(module|node)\.js:\d|when\/(monitor|lib)\//i;
	var filter = stackFilter(exclude, mergePromiseFrames);
	var reporter = simpleReporter(formatter(filter, rejectionMsg, reasonMsg, stackJumpMsg), logger);

	PromiseStatus.reporter = throttleReporter(200, reporter);

	if(typeof console !== 'undefined') {
		console.PromiseStatus = PromiseStatus;
	}

	return PromiseStatus;

	function mergePromiseFrames(/* frames */) {
		return filteredFramesMsg;
	}

	function exclude(line) {
		var rx = PromiseStatus.promiseStackFilter || excludeRx;
		return rx.test(line);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
