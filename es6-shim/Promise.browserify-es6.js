/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * ES6 Promise shim with unhandled rejection logging enabled
 */
var unhandledRejections = require('../lib/decorators/unhandledRejection');
var PromiseConstructor = unhandledRejections(require('../lib/Promise'));

module.exports = PromiseConstructor;

if(typeof Promise == 'undefined') {
	if(typeof self != 'undefined') {
		self.Promise = PromiseConstructor;
	} else if(typeof global != 'undefined') {
		global.Promise  = PromiseConstructor;
	}
}

