/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * ES6 global Promise shim
 */
var unhandledRejections = require('../lib/decorators/unhandledRejection');
var PromiseConstructor = module.exports = unhandledRejections(require('../lib/Promise'));

var g = typeof global !== 'undefined' && global
	|| typeof self !== 'undefined' && self;

if(typeof g !== 'undefined' && typeof g.Promise === 'undefined') {
	g['Promise'] = PromiseConstructor;
}
