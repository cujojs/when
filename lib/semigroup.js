/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) { 'use strict';
define(function() {

	return function semigroup(Promise) {

		Promise.prototype.concat = function(promise) {
			var self = this;
			return new this.constructor(function(resolve, reject) {
				var rejections = [];
				self.then(resolve, handleReject);
				promise.then(resolve, handleReject);

				function handleReject(e) {
					if(rejections.length < 2) {
						rejections.push(e);
					} else {
						reject(rejections);
					}
				}
			});
		};

		return Promise;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
