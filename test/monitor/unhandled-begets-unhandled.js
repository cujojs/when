/** @license MIT License (c) copyright 2010-2014 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	require('../../monitor/console');

	var Promise = require('../../when').Promise;

	var p = new Promise.reject(new Error('first error'));

	setTimeout(function() {
		console.log('***Begetting new unhandled error now***');
		p['catch'](function() { throw new Error('unhandled-begets-unhandled'); });
	}, 2000);

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
