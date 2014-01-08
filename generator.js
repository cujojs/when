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

	var when, slice;

	when = require('./when');
	slice = Array.prototype.slice;

	return {
		apply: apply,
		call: call,
		lift: lift
	};

	function lift(generator) {
		return function() {
			return apply(generator, arguments);
		};
	}

	function call(generator) {
		return apply(generator, slice.call(arguments, 1));
	}

	function apply(generator, args) {
		/*jshint validthis:true*/
		var iterator = generator.apply(this, args);

		return next();

		function next(x) {
			return step('next', x);
		}

		function fail(e) {
			return step('throw', e);
		}

		function step(action, x) {
			var result;

			try {
				result = iterator[action](x);
			} catch (e) {
				return when.reject(e);
			}

			return result.done ? result.value : when(result.value, next, fail);
		}
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
