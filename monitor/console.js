/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function(require) {

	var PromiseMonitor = require('./PromiseMonitor');
	var ConsoleReporter = require('./ConsoleReporter');

	var promiseMonitor = new PromiseMonitor(new ConsoleReporter());

	if(typeof console !== 'undefined') {
		console.promiseMonitor = promiseMonitor;
	}

	return promiseMonitor;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
