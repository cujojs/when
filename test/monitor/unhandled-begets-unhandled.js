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

	var p = when.promise(function(_, reject) {
		reject(new Error('first error'));
	});

	setTimeout(function() {
		console.log('***Begetting new unhandled error now***');
		p.otherwise(function() { throw new Error('unhandled-begets-unhandled'); });
	}, 2000);

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
