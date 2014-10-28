/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	return {
		cons: cons,
		tail: tail,
		copy: copy,
		concat: concat
	};

	function cons (x, arr) {
		var l = arr.length;
		var a = new Array(l + 1);
		a[0] = x;
		for (var i = 0; i < l; ++i) {
			a[i + 1] = arr[i];
		}
		return a;
	}

	function tail (arr) {
		if(arr.length === 0) {
			return [];
		}

		var l = arr.length - 1;
		var a = new Array(l);
		for (var i = 0; i < l; ++i) {
			a[i] = arr[i + 1];
		}
		return a;
	}

	function copy(arr) {
		var l = arr.length;
		var a = new Array(l);
		for(var i=0; i<l; ++i) {
			a[i] = arr[i];
		}
		return a;
	}

	function concat (a, b) {
		var al = a.length;
		var bl = b.length;
		var c = new Array(al + bl);
		var i;

		for (i = 0; i < al; ++i) {
			c[i] = a[i];
		}

		for (i = 0; i < bl; ++i) {
			c[i + al] = b[i];
		}

		return c;
	}
});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));