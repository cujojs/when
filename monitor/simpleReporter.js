/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */
(function(define) { 'use strict';
define(function() {

	return function simpleReporter(format, log) {
		var timeout;

		return function(promises) {
			if(timeout == null) {
				timeout = setTimeout(function() {
					timeout = null;
					log(filterAndFormat(format, promises));
				}, 250);
			}
		};
	}

	function filterAndFormat(format, promises) {
		return promises.reduce(function(rejected, rec) {
			if(rec.rejectedAt) {
				rejected.push(format(rec));
			}

			return rejected;
		}, []);
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
