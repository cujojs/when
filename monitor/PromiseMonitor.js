/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var defaultStackJumpSeparator = 'from execution context:';
	var defaultStackFilter = /(node|module|timers)\.js:|when(\/(lib|monitor|es6-shim)\/|\.js)|(new\sPromise)\b|(\b(PromiseMonitor|ConsoleReporter|Scheduler|RunHandlerTask|ProgressTask|Promise|.*Handler)\.[\w_]\w\w+\b)|\b(tryCatch\w+|getHandler\w*)\b/i;

	var setTimer = require('../lib/timer').set;
	var error = require('./error');

	function PromiseMonitor(reporter) {
		this.traces = {};
		this.traceTask = 0;
		this.logDelay = 0;
		this.stackFilter = defaultStackFilter;
		this.stackJumpSeparator = defaultStackJumpSeparator;

		this._reporter = reporter;

		var self = this;
		this._doLogTraces = function() {
			self._logTraces();
		};
	}

	PromiseMonitor.prototype.captureStack = function(host, at) {
		return error.captureStack(host, at);
	};

	PromiseMonitor.prototype.addTrace = function(key, e, context1, context2) {
		this.traces[key] = [e, context1, context2];
		this.logTraces();
	};

	PromiseMonitor.prototype.removeTrace = function(key) {
		if(key in this.traces) {
			delete this.traces[key];
			this.logTraces();
		}
	};

	PromiseMonitor.prototype.fatal = function(e, context) {
		var err = new Error();
		err.stack = this._createLongTrace([e, context]).join('\n');
		setTimer(function() {
			throw err;
		}, 0);
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
		var longTrace;

		for(var i=0; i<keys.length; ++i) {
			longTrace = this._createLongTrace(traces[keys[i]]);
			formatted.push(longTrace);
		}

		return formatted;
	};

	PromiseMonitor.prototype._createLongTrace = function(trace) {
		var filter = this.stackFilter;
		var separator = this.stackJumpSeparator;
		var seen = {};
		return trace.reduce(function(longTrace, t) {
			return error.createLongTrace(t, filter, separator, longTrace, seen);
		}, []);
	};

	return PromiseMonitor;
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
