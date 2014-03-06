/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return function(isExcluded, replace) {
		return function filterStack(stack) {
			var excluded;

			if(!(stack && stack.length)) {
				return [];
			}

			excluded = [];

			return stack.reduce(function(filtered, line) {
				var match;

				match = isExcluded(line);
				if(match) {
					if(!excluded) {
						excluded = [];
					}
					excluded.push(line);
				} else {
					if(excluded) {
						if(filtered.length > 1) {
							filtered = filtered.concat(replace(excluded));
							excluded = null;
						}
					}
					filtered.push(line);
				}

				return filtered;
			}, []);
		};
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
