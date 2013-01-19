(function(define) {
define(['./when'], function(when) {
	return function callback(asyncFunction, extraAsyncArgs) {
		if(typeof extraAsyncArgs === 'undefined') {
			extraAsyncArgs = [];
		}

		var deferred = when.defer();
		var resolverFn = function() {
			deferred.resolve(arguments);
		};

		var asyncArgs = extraAsyncArgs.concat([resolverFn]);

		asyncFunction.apply(null, asyncArgs);

		return deferred.promise;
	};
});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when_callback = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);
