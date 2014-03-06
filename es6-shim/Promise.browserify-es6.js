/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * ES6 global Promise shim
 */
var PromiseConstructor = module.exports = require('../lib/Promise');

var g = typeof global !== 'undefined' && global
	|| typeof window !== 'undefined' && window
	|| typeof self !== 'undefined' && self;

if(typeof g !== 'undefined' && typeof g.Promise === 'undefined') {
	g.Promise = PromiseConstructor;
}
