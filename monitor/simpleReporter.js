/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	var stackJumpSeparator = '  ... [from] ...';
	var allHandledMsg = '[promises] All previously unhandled rejections have now been handled';
	var unhandledRejectionsMsg = '[promises] Unhandled rejections: ';

	var warn, groupStart, groupEnd;
	groupStart = groupEnd = consoleGroupsNotAvailable;

	if(typeof console === 'undefined') {
		warn = consoleNotAvailable;
	} else {
		if(typeof console.warn === 'function'
			&& typeof console.dir === 'function') {
			warn = function(s) {
				console.warn(s);
			};

			if(typeof console.groupCollapsed === 'function') {
				groupStart = function(s) {
					console.groupCollapsed(s);
				};
				groupEnd = function() {
					console.groupEnd();
				};
			}
		} else {
			// IE8 has console.log and JSON, so we can make a
			// reasonably useful warn() from those.
			// Credit to webpro (https://github.com/webpro) for this idea
			if (typeof console.log ==='function'
				&& typeof JSON !== 'undefined') {
				warn = function (x) {
					console.log(typeof x === 'string' ? x : JSON.stringify(x));
				};
			}
		}
	}

	return function simpleReporter(stackFilter) {
		return function(traces) {
			var keys = Object.keys(traces);

			if(keys.length === 0) {
				warn(allHandledMsg);
				return;
			}

			groupStart(unhandledRejectionsMsg + keys.length);
			try {
				formatTraces(stackFilter, traces, keys);
			} finally {
				groupEnd();
			}
		};
	};

	function joinLongTrace(stackFilter, trace) {
		return trace.reduce(function (longTrace, e, i) {
			var stack = e && e.stack;
			if (stack) {
				stack = stack.split('\n').filter(function (frame) {
					return !(stackFilter.test(frame));
				});

				if(stack.length > 1) {
					if(i > 0) {
						stack[0] = stackJumpSeparator;
					}
					longTrace.push.apply(longTrace, stack);
				}
			} else {
				longTrace.push(String(e));
			}
			return longTrace;
		}, []);
	}

	function formatTraces(stackFilter, traces, keys) {
		keys.map(function (key) {
			var trace = traces[key];
			if (typeof trace === 'string') {
				warn(trace);
				return;
			}

			var longTrace = joinLongTrace(stackFilter, trace);
			longTrace = traces[key] = longTrace.join('\n');

			warn(longTrace);
		});
	}

	function consoleNotAvailable() {}
	function consoleGroupsNotAvailable() {}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
