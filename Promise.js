/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */
(function(define) { 'use strict';
define(function (require) {

	var makePromise = require('./lib/makePromise');
	var scheduler = require('./lib/scheduler');

	var environment = {
		enqueue: scheduler
	};

	if(typeof console !== 'undefined') {
		environment.monitor = console;
	}

	return makePromise(environment);

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
