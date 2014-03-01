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

	var makePromise = require('./makePromise');
	var Scheduler = require('./scheduler');
	var async = require('./async');

	return makePromise({
		scheduler: new Scheduler(async),
		decorate: typeof console !== 'undefined' && console.PromiseStatus
			&& console.PromiseStatus.monitor
	});

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); });
