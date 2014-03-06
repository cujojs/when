/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
(function(define) { 'use strict';
define(function() {

	function PromiseStatus(parent) {
		this.key = PromiseStatus.nextKey++;
		PromiseStatus.promises[this.key] = this;

		this.parent = parent;
		this.timestamp = Date.now();
		this.createdAt = captureStack();
		this.reason = void 0;
		this.rejectedAt = void 0;
	}

	PromiseStatus.prototype = {
		observed: function () {
			if(this.key in PromiseStatus.promises) {
				delete PromiseStatus.promises[this.key];
				report();
			}

			return new PromiseStatus(this);
		},

		fulfilled: function () {
			if(this.key in PromiseStatus.promises) {
				delete PromiseStatus.promises[this.key];
				report();
			}
		},

		rejected: function (reason) {
			if(this.key in PromiseStatus.promises) {
				this.reason = reason;
				this.rejectedAt = captureStack(reason && reason.message || reason);
				report();
			}
		}
	};

	reset();

	PromiseStatus.report = report;
	PromiseStatus.reset = reset;

	return PromiseStatus;

	function report() {
		if(typeof PromiseStatus.reporter === 'function') {
			return PromiseStatus.reporter(PromiseStatus.promises);
		}
	}

	function reset() {
		PromiseStatus.nextKey = 0;
		PromiseStatus.promises = {}; // Should be WeakMap
	}

	function captureStack(msg) {
		try {
			throw new Error(msg);
		} catch (e) {
			return e;
		}
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
