(function(define) {
define(['./when'], function(when) {
	return {
		apply: apply
	};

	/**
	* Takes a `traditional` callback-taking function and returns a promise for its
	* result, accepting an optional array of arguments. It assumes that the
	* function takes its callback and errback as the last two arguments. The
	* resolution of the promise depends on whether the function will call its
	* callback or its errback.
	*
	* @example
	*	var domIsLoaded = callbacks.apply($);
	*	domIsLoaded.then(function() {
	*		doMyDomStuff();
	*	});
	*
	* @example
	*	function existingAjaxyFunction(url, callback, errback) {
	*		// Complex logic you'd rather not change
	*	}
	*
	*	var promise = callbacks.apply(existingAjaxyFunction, ["/movies.json"]);
	*
	* promise.then(function(movies) {
	*   // Work with movies
	* }, function(reason) {
	*		// Handle error
	* });
	*
	* @param {function} asyncFunction function to be called
	* @param {Array} [extraAsyncArgs] array of arguments to asyncFunction
	* @returns {Promise} promise for the callback value of asyncFunction
	*/

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
