/** @license MIT License (c) copyright B Cavalier & J Hann */

(function(define) {
define(['./when'], function(origWhen) {

	function debugPromise(p) {
		// TODO: Need to find a way for promises returned by .then()
		// to also be debug promises.
		p.then(
			function(val) {
				console.log('[object Promise] resolved', val);
			},
			function(err) {
				console.error('[object Promise] REJECTED', err);
			}
		);

		return p;
	}

	function when() {
		return debugPromise(origWhen.apply(null, arguments));
	}

	function defer() {
		var d = origWhen.defer();

		debugPromise(d.promise);
//		d.promise = debugPromise(d.promise);
//		d.then = d.promise.then;

		return d;
	}

	when.defer = defer;

	for(var p in origWhen) {
		if(origWhen.hasOwnProperty(p) && !(p in when)) {
			(function(p, orig) {
				when[p] = function() {
					return debugPromise(orig.apply(origWhen, arguments));
				}
			})(p, origWhen[p]);
		}
	}

	return when;

});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when      = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);
