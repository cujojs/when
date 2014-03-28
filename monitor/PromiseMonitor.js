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
		var trace = new Error();
		trace.clone = clone;
		trace.merge = merge;
		return trace;
	};

	PromiseMonitor.prototype.startTrace = function(trace) {
		var key = this.key++;
		this.traces[key] = [trace];
		return key;
	};

	PromiseMonitor.prototype.updateTrace = function(key, trace) {
		var t = this.traces[key];
		if(typeof t !== 'undefined') {
			do
			  t = t.concat(trace);
			while(trace = trace.parent);

			this.traces[key] = t;
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

	function clone(){
		var cloned = Object.create(Error.prototype);
		var me = this;
		Object.getOwnPropertyNames(me).map(function(i){
			cloned[i] = me[i];
		});
		return cloned;
	}

	function merge(other){
		var me = this;
		Object.getOwnPropertyNames(other).map(function(i){
			me[i] = other[i];
		});
	}

	return PromiseMonitor;
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
