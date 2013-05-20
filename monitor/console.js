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

	var aggregator, reporter, hasStackTraces;

	aggregator = require('./aggregator');
	reporter = require('./simpleConsoleReporter');

	try {
		throw new Error();
	} catch (e) {
		hasStackTraces = !!e.stack;
	}

	aggregator.reporter = reporter(format);

	return aggregator;

	function format(rec) {
		var cause;

		if(hasStackTraces) {
			cause = (rec.reason && rec.reason.stack) || rec.rejectedAt.stack;
			rec.stack = stitch(rec.createdAt.stack, cause);
		}
		return rec;
	}

	function stitch(s1, s2) {
		s1 = filterStack(s1);
		s2 = filterStack(s2);
		return ['Unhandled rejection escaped at'].concat(s1.slice(1),'Caused by rejection at:', s2);
	}

	function filterStack(s) {
		return s.split('\n').filter(function(line) {
			return !/when\.js|when\/monitor\//i.test(line);
		});
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
