/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	var stackJumpSeparator = '  ... [from] ...';
	var allHandledMsg = '[promises] All previously unhandled rejections have now been handled';
	var unhandledRejectionsMsg = '[promises] Unhandled rejections: ';

	function ConsoleReporter(stackFilter) {
		this.stackFilter = stackFilter;
		this._previouslyReported = false;
	}

	ConsoleReporter.prototype = initDefaultLogging();

	ConsoleReporter.prototype.report = function(traces) {
		var keys = Object.keys(traces);

		if(keys.length === 0) {
			if(this._previouslyReported) {
				this._previouslyReported = false;
				this.log(allHandledMsg);
			}
			return;
		}

		this._previouslyReported = true;
		this.groupStart(unhandledRejectionsMsg + traces.length);
		try {
			this.formatTraces(traces, keys);
		} finally {
			this.groupEnd();
		}
	};

	ConsoleReporter.prototype.formatTraces = function(traces, keys) {
		for(var i=0; i<keys.length; ++i) {
			var longTrace = this.createLongTrace(traces[keys[i]]);
			this.log(longTrace);
		}
	};

	ConsoleReporter.prototype.createLongTrace = function(trace) {
		var self = this;
		var longTrace = '';
		for(var i=0; i<trace.length; ++i) {
			var stack = self.getStack(trace[i]);
			if (stack) {
				stack = self.getFilteredFrames(stack);

				if(i === 0) {
					longTrace += '\n' + join(stack, 0);
				} else if (stack.length > 1) {
					longTrace += '\n' + stackJumpSeparator
						+ '\n' + join(stack, 1);
				}
			} else {
				longTrace += '\n' + trace[i];
			}
		}
		return longTrace;
	};

	ConsoleReporter.prototype.getStack = function(e) {
		return e && e.stack;
	};

	ConsoleReporter.prototype.getFilteredFrames = function(stack) {
		return stack.split('\n').filter(function (frame) {
			return !this.stackFilter.test(frame);
		}, this);
	};

	// About 5-10x faster than String.prototype.join o_O
	function join(a, start) {
		var sep = false;
		var s = '';
		for(var i=start; i< a.length; ++i) {
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
			log: warn,
			groupStart: groupStart || consoleGroupsNotAvailable,
			groupEnd: groupEnd || consoleGroupsNotAvailable
		};
	}

	function consoleNotAvailable() {}
	function consoleGroupsNotAvailable() {}

	return ConsoleReporter;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
