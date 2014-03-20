/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	var stackJumpSeparator = '... from ...';
	var allHandledMsg = '[promises] All previously unhandled rejections have now been handled';
	var unhandledRejectionsMsg = '[promises] Unhandled rejections: ';

	function ConsoleReporter(stackFilter) {
		this.stackFilter = stackFilter;
		this._previouslyReported = false;
	}

	ConsoleReporter.prototype = initDefaultLogging();

	ConsoleReporter.prototype.log = function(traces) {
		var keys = Object.keys(traces);

		if(keys.length === 0) {
			if(this._previouslyReported) {
				this._previouslyReported = false;
				this.warn(allHandledMsg);
			}
			return;
		}

		this._previouslyReported = true;
		this.groupStart(unhandledRejectionsMsg + keys.length);
		try {
			this.formatTraces(traces, keys);
		} finally {
			this.groupEnd();
		}
	};

	ConsoleReporter.prototype.formatTraces = function(traces, keys) {
		for(var i=0; i<keys.length; ++i) {
			var longTrace = this.createLongTrace(traces[keys[i]]);
			this.warn(join(longTrace) + '\n');
		}
	};

	ConsoleReporter.prototype.createLongTrace = function(trace) {
		var self = this;
		var first;
		var longTrace = [];
		var seen = {};
		for(var i=0; i<trace.length; ++i) {
			var stack = self.getStack(trace[i]);

			if (stack) {
				stack = stack.split('\n');
				first = stack[0];
				stack = self.getFilteredFrames(seen, stack.slice(1));
				if (stack.length > 0) {
					longTrace.push(i === 0 ? first : stackJumpSeparator);
					longTrace.push(join(stack));
				}
			} else {
				longTrace.push(String(trace[i]));
			}
		}

		return longTrace;
	};

	ConsoleReporter.prototype.getStack = function(e) {
		return e && e.stack;
	};

	ConsoleReporter.prototype.getFilteredFrames = function(seen, stack) {
		var stackFilter = this.stackFilter;
		return stack.reduce(function (filtered, frame) {
			if (!(seen[frame] || stackFilter.test(frame))) {
				seen[frame] = true;
				filtered.push(frame);
			}
			return filtered;
		}, []);
	};

	// About 5-10x faster than String.prototype.join o_O
	function join(a) {
		var sep = false;
		var s = '';
		for(var i=0; i< a.length; ++i) {
			if(sep) {
				s += '\n' + a[i];
			} else {
				s+= a[i];
				sep = true;
			}
		}
		return s;
	}

	function initDefaultLogging() {
		var warn, groupStart, groupEnd;

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

		return {
			warn: warn,
			groupStart: groupStart || warn,
			groupEnd: groupEnd || consoleNotAvailable
		};
	}

	function consoleNotAvailable() {}

	return ConsoleReporter;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
