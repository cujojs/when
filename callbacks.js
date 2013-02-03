(function(define) {
define(['./when'], function(when) {
	return {
		apply: apply
	};

	function apply(asyncFunction, extraAsyncArgs) {
		if(typeof extraAsyncArgs === 'undefined') {
			extraAsyncArgs = [];
		}

		var deferred = when.defer();

		var resolve = function(value) {
			deferred.resolve(value);
		};

		var reject = function(reason) {
			deferred.reject(reason);
		};

		var asyncArgs = extraAsyncArgs.concat([resolve, reject]);
		asyncFunction.apply(null, asyncArgs);

		return deferred.promise;
	}
});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when_callback = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);
