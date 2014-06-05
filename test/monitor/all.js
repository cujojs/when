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

//		require('../../monitor/console');

		var when = require('../../when');

		var p = when.reject(new Error('fail1'));

		when.all([p]);

	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

