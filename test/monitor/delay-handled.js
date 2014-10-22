(function(define) { 'use strict';
define(function(require) {

	var when = require('../../when');
	var async = require('../../lib/env').asap;

	var p = when.reject(new Error('TEST FAILED, should not see this'));

	async(function() {
		p.catch(function(){});
	});
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

