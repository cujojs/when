/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var setTimer = require('../lib/timer').set;

	function PromiseMonitor(reporter) {
		this.key = 0;
		this.traces = {};
		this.traceTask = 0;
		this.logDelay = 100;

		this._reporter = reporter;

		var self = this;
		this._doLogTraces = function() {
			self._logTraces();
		};
	}

	PromiseMonitor.prototype.captureStack = function() {
		return new Error();
	};

	PromiseMonitor.prototype.startTrace = function(trace) {
		var key = this.key++;
		this.traces[key] = [trace];
		return key;
	};

	PromiseMonitor.prototype.updateTrace = function(key, trace) {
		var t = this.traces[key];
		if(typeof t !== 'undefined') {
			t.push(trace);
			this.logTraces();
		}
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
		this._reporter.log(this.traces);
	};

	return PromiseMonitor;
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
