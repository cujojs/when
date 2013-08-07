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

		var when = require('../../when');

		var i = 1;
		var p = when.promise(function(_, reject) {
			setTimeout(reject.bind(null, new Error(i++)), 1);
		});

		var p = when.promise(function(_, reject) {
			setTimeout(reject.bind(null, new Error(i++)), 1);
		});

		var p = when.promise(function(_, reject) {
			setTimeout(reject.bind(null, new Error(i++)), 1);
		});

	});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

