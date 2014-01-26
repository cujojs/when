/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	// Credit to Twisol (https://github.com/Twisol) for suggesting
	// this type of extensible queue + trampoline approach for next-tick conflation.

	function Scheduler(enqueue) {
		this._enqueue = enqueue;
		this.handlerQueue = [];
	}

	/**
	 * Enqueue a task. If the queue is not currently scheduled to be
	 * drained, schedule it.
	 * @param {function} task
	 */
	Scheduler.prototype.enqueue = function(task) {
		var self = this;
		if(this.handlerQueue.push(task) === 1) {
			this._enqueue(function() {
				self.drainQueue();
			});
		}
	};

	/**
	 * Drain the handler queue entirely, being careful to allow the
	 * queue to be extended while it is being processed, and to continue
	 * processing until it is truly empty.
	 */
	Scheduler.prototype.drainQueue = function() {
		var q = this.handlerQueue;
		for (var i = 0; i < q.length; i++) {
			q[i].run();
		}
		this.handlerQueue = [];
	};

	Scheduler.createDefault = createDefault;

	return Scheduler;

	function createDefault() {
		// Sniff "best" async scheduling option
		// Prefer process.nextTick or MutationObserver, then check for
		// vertx and finally fall back to setTimeout
		/*global process,document,setTimeout,MutationObserver,WebKitMutationObserver*/
		var nextTick, cjsRequire, MutationObs, capturedSetTimeout, scheduler;

		if (typeof process === 'object' && process.nextTick) {
			nextTick = process.nextTick;
		} else if(MutationObs =
			(typeof MutationObserver === 'function' && MutationObserver) ||
				(typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
			nextTick = (function(document, MutationObserver) {
				var el = document.createElement('div');
				new MutationObserver(drainQueue).observe(el, { attributes: true });

				function drainQueue() {
					scheduler.drainQueue();
				}

				return function() {
					el.setAttribute('x', 'x');
				};
			}(document, MutationObs));
		} else {
			cjsRequire = require;
			try {
				// vert.x 1.x || 2.x
				nextTick = cjsRequire('vertx').runOnLoop || cjsRequire('vertx').runOnContext;
			} catch(ignore) {
				// capture setTimeout to avoid being caught by fake timers
				// used in time based tests
				capturedSetTimeout = setTimeout;
				nextTick = function(t) { capturedSetTimeout(t, 0); };
			}
		}

		scheduler = new Scheduler(nextTick);
		return scheduler;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
