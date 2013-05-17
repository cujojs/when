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

	function ok(v) {
		console.log('ok', v);
		return v;
	}

	function fail(e) {
//	console.error('fail', e);
		throw new Error(e + '-rethrow');
	}

	var d;

	d = when.defer();
	when(d.promise, ok, fail);
	d.reject(0);

	d = when.defer('test1');
	when(d.promise, ok, fail).then(ok);
	d.reject(1);

//-----------------

	d = when.defer('test2');
	when(d.promise, ok, function() {
		throw new Error(2);
	});
	d.reject(2);

//-----------------

	d = when.defer('test3');
	when(d.promise, ok).then(ok);
	d.reject(3);

//-----------------

	d = when.defer('test4');
	when(d.promise, ok).then(ok, ok);
	d.reject('4');

	d = when.defer('test4-1');
	d.promise.then(ok).then(ok, ok);
	d.reject('4-1');

//-----------------

	d = when.defer(5);
	when(d.promise, ok, ok).then(ok);
	d.reject(5);

//-----------------

	d = when.defer('test6');
	when(d.promise, ok, function() {
		throw new Error('throw6');
	}).then(ok, fail);
	d.reject(6);

//-----------------

	d = when.defer('test7');
	when(d.promise, ok, function() {
		throw new TypeError('throw7');
	});
	d.reject(7);

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

