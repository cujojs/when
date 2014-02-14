/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * unfold
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(function(require) {

	var Promise = require('./lib/Promise');

	/**
	 * @deprecated Use Promise.unfold
	 */
	return function unfold(unspool, condition, handler, seed) {
		return Promise.unfold(unspool, condition, handler, seed);
	};

});
})(typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); } );

