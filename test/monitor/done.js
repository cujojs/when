/** @license MIT License (c) copyright 2010-2013 original author or authors */

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
		var when = require('../../when');

		when.resolve(123)
			.then(function(x) {
				throw new Error(x);
			})
			.done(console.log);

	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));


