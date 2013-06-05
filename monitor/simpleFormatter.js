/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */
(function(define) { 'use strict';
define(function() {

	var hasStackTraces;

	try {
		throw new Error();
	} catch (e) {
		hasStackTraces = !!e.stack;
	}

	return function(filterStack, unhandledMsg, reasonMsg) {
		return function format(rec) {
			var cause, formatted;

			formatted = {
				promise: rec.promise,
				reason: (rec.reason).toString()
			};

			if(hasStackTraces) {
				cause = rec.reason && rec.reason.stack;
				if(!cause) {
					cause = rec.rejectedAt && rec.rejectedAt.stack;
				}
				formatted.stack = stitch(rec.createdAt.stack, cause);
			}

			return formatted;
		};

		function stitch(escaped, rejected) {
			escaped = filterStack(escaped.split('\n').slice(1));
			rejected = filterStack(rejected.split('\n'));
			return [unhandledMsg]
				.concat(escaped, reasonMsg, rejected);
		}
	};
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
