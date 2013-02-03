(function(define) {
define(['./when'], function(when) {
	var slice  = [].slice,
			concat = [].concat;

	return {
		apply: apply,
		call:  call,
		bind:  bind
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
		var deferred = when.defer();

		var asyncArgs = concat.call(extraAsyncArgs || [],
																deferred.resolve,
																deferred.reject);

		asyncFunction.apply(null, asyncArgs);

		return deferred.promise;
	}

	/**
	* Works as `callbacks.apply` does, with the difference that the arguments to
	* the function are passed individually, instead of as an array.
	*
	* @example
	*	function sumInFiveSeconds(a, b, callback) {
	*		setTimeout(function() {
	*			callback(a + b);
	*		}, 5000);
	*	}
	*
	*	var sumPromise = callbacks.call(sumInFiveSeconds, 5, 10);
	*
	* // Logs '15' 5 seconds later
	*	sumPromise.then(console.log);
	*
	* @param {function} asyncFunction function to be called
	* @param {...*} [args] arguments that will be forwarded to the function
	* @returns {Promise} promise for the callback value of asyncFunction
	*/

	function call(asyncFunction/*, arg1, arg2...*/) {
		var extraAsyncArgs = slice.call(arguments, 1);
		return apply(asyncFunction, extraAsyncArgs);
	}

	function bind(asyncFunction) {
		var leadingArgs = slice.call(arguments, 1);

		return function() {
			var trailingArgs = slice.call(arguments, 0);
			return apply(asyncFunction, leadingArgs.concat(trailingArgs));
		};
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
