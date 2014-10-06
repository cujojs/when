/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	var getHandler = require('../when').Promise._handler;
	var defer = require('../when').Promise._defer;

	/**
	 * Returns a promise in the same state as the earliest of
	 * two promises to settle, even if they settled in the past.
	 * If a and b were/are simultaneous, returns a promise in the
	 * same state as a.
	 */
	return function earliest(a, b) {
		var p = defer();
		var resolver = getHandler(p);

		var ah = getHandler(a);
		var bh = getHandler(b);

		ah.visit(resolver, decide, decide);
		bh.visit(resolver, decide, decide);

		return p;

		function decide() {
			var anearest = ah.join();
			var astate = anearest.state();

			var bnearest = bh.join();
			var bstate = bnearest.state();

			var winner;

			if(astate !== 0 && bstate !== 0) {
				// Both are settled, pick the one with the earliest time,
				// preferring a over b if they are simultaneous
				winner = anearest.time() <= bnearest.time() ? ah : bh;
			} else {
				// Only one settled, pick it
				winner = astate !== 0 ? ah : bh;
			}

			this.become(winner);
		}
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
