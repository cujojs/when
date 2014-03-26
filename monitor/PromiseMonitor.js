/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var setTimer = require('../lib/timer').set;
	var error = require('./error');

	var stackJumpSeparator = 'from execution context:';

	var defaultStackFilter = /(node|module|timers)\.js:|when(\/(lib|monitor|es6-shim)\/|\.js)|(new\sPromise)\b|(\b(PromiseMonitor|ConsoleReporter|Scheduler|RunHandlerTask|ProgressTask|Promise|.*Handler)\.[\w_]\w\w+\b)|\b(tryCatch\w+|getHandler\w*)\b/i;

	function PromiseMonitor(reporter) {
		this.traces = {};
		this.traceTask = 0;
		this.logDelay = 0;
		this.stackFilter = defaultStackFilter;

		this._reporter = reporter;

		var self = this;
		this._doLogTraces = function() {
			self._logTraces();
		};
	}

	PromiseMonitor.prototype.captureStack = function() {
		return error.captureStack(new Error());
	};

	PromiseMonitor.prototype.addTrace = function(key, trace) {
		this.traces[key] = trace;
		this.logTraces();
	};

	PromiseMonitor.prototype.removeTrace = function(key) {
		if(key in this.traces) {
			delete this.traces[key];
			this.logTraces();
		}
	};

	PromiseMonitor.prototype.logTraces = function() {
		if(!this.traceTask) {
			this.traceTask = setTimer(this._doLogTraces, this.logDelay);
		}
	};

	PromiseMonitor.prototype._logTraces = function() {
		this.traceTask = void 0;
		this._reporter.log(this.formatTraces(this.traces));
	};


	PromiseMonitor.prototype.formatTraces = function(traces) {
		var keys = Object.keys(traces);
		var formatted = [];

		for(var i=0; i<keys.length; ++i) {
			var longTrace = this.createLongTrace(traces[keys[i]]);
			formatted.push(longTrace);
		}

		return formatted;
	};

	PromiseMonitor.prototype.createLongTrace = function(trace) {
		var seen = {};
		var longTrace = [];
		var info, stack, i = 0;
		// Basically foldr
		while(trace) {
			info = error.parse(trace.e);

			if (info.stack) {
				stack = this.getFilteredFrames(seen, info.stack);
				if (stack.length > 0) {
					longTrace.push(i === 0 ? info.message : stackJumpSeparator);
					longTrace.push.apply(longTrace, stack);
				}
			} else {
				longTrace.push(String(trace.e));
			}

			i++;
			trace = trace.next;
		}

		return longTrace;
	};

	PromiseMonitor.prototype.getFilteredFrames = function(seen, stack) {
		var filter = this.stackFilter;
		return stack.reduce(function (filtered, frame) {
			if (!(seen[frame] || filter.test(frame))) {
				seen[frame] = true;
				filtered.push(frame);
			}
			return filtered;
		}, []);
	};


	return PromiseMonitor;
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
