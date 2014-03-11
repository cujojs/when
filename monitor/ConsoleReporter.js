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

	function ConsoleReporter(stackFilter) {
		this._stackFilter = stackFilter;
	}

	ConsoleReporter.prototype._warn = warn;
	ConsoleReporter.prototype._groupStart = groupStart;
	ConsoleReporter.prototype._groupEnd = groupEnd;

	ConsoleReporter.prototype.report = function(traces) {
		var keys = Object.keys(traces);

		if(keys.length === 0) {
			this._warn(allHandledMsg);
			return;
		}

		this._groupStart(unhandledRejectionsMsg + keys.length);
		try {
			this._formatTraces(traces, keys);
		} finally {
			this._groupEnd();
		}
	};

	ConsoleReporter.prototype._joinLongTrace = function(stackFilter, trace) {
		return trace.reduce(function (longTrace, e, i) {
			var stack = e && e.stack;
			if (stack) {
				stack = stack.split('\n').filter(function (frame) {
					return !(stackFilter.test(frame));
				});

				if(i === 0) {
					longTrace.push.apply(longTrace, stack);
				} else if (stack.length > 1) {
					stack[0] = stackJumpSeparator;
					longTrace.push.apply(longTrace, stack);
				}
			} else {
				longTrace.push(String(e));
			}
			return longTrace;
		}, []);
	};

	ConsoleReporter.prototype._formatTraces = function(traces, keys) {
		keys.forEach(function (key) {
			var trace = traces[key];
			if (typeof trace === 'string') {
				this._warn(trace);
				return;
			}

			var longTrace = this._joinLongTrace(this._stackFilter, trace);
			longTrace = traces[key] = longTrace.join('\n');

			this._warn(longTrace);
		}, this);
	};

	function consoleNotAvailable() {}
	function consoleGroupsNotAvailable() {}

	return ConsoleReporter;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
