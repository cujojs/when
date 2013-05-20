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
		var cause, formatted;

		formatted = {
			promise: rec.promise,
			reason: rec.reason,
			createdAt: rec.createdAt,
			rejectedAt: rec.rejectedAt
		};

		if(hasStackTraces) {
			cause = rec.reason && rec.reason.stack;
			if(!cause) {
				cause = rec.rejectedAt.stack;
			}
			formatted.stack = stitch(rec.createdAt.stack, cause);
		}

		return formatted;
	}

	function stitch(s1, s2) {
		var filter = aggregator.filterStack || filterStack;
		s1 = filter(s1);
		s2 = filter(s2);
		return ['Unhandled rejection escaped at'].concat(s1.slice(1),'Caused by rejection at:', s2);
	}

	function filterStack(s) {
		var conflating, stack;

		conflating = false;
		stack = s.split('\n');

		return stack.slice(1).reduce(function(filtered, line) {
			var match = /when\.js|when\/monitor\//i.test(line);
			if(match) {
				if(!conflating) {
					conflating = true;
					if(filtered.length > 1) {
						filtered.push('\t...[promise internals]...');
					}
				}
			} else {
				if(conflating) {
					conflating = false;
				}
				filtered.push(line);
			}

			return filtered;
		}, stack.slice(0, 1));
	}


});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
