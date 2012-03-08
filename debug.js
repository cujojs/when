/** @license MIT License (c) copyright B Cavalier & J Hann */

(function(define) {
define(['./when'], function(when) {

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

	function whenDebug() {
		return debugPromise(when.apply(null, arguments));
	}

	function defer() {
		var d = when.defer();

		debugPromise(d.promise);

		return d;
	}

	whenDebug.defer = defer;
	whenDebug.isPromise = when.isPromise;

	for(var p in when) {
		if(when.hasOwnProperty(p) && !(p in whenDebug)) {
			(function(p, orig) {
				whenDebug[p] = function() {
					return debugPromise(orig.apply(when, arguments));
				}
			})(p, when[p]);
		}
	}

	return whenDebug;

});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when      = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);
