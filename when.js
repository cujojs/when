(function(define) {
define([], function() {

	/*
		Constructor: Promise
		Creates a new Promise
	*/ 
	
	function Promise () {}

	Promise.prototype = {
		// TODO: Promise implementation
		then: function() {},
		resolve: function() {},
		reject: function() {},
		progress: function() {}
	};

	/*
		Function: isPromise
		Determines if promiseOrValue is a promise or not.
	*/
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/*
		Function: when
	*/
	function when(promiseOrValue, callback, errback, progressHandler) {
		var result;

		if(arguments.length == 1) {
			// If exactly one arg, assume the caller wants a promise to
			// be returned, no matter what.  If promiseOrValue is a
			// promise, return it.  If it's a value, return a new
			// promise, with promiseOrValue as the resolution value.
			if(isPromise(promiseOrValue)) {
				result = promiseOrValue;		
			} else {
				result = new Promise();
				result.resolve(promiseOrValue);
			}
		} else {
			// If callback args were provided, implement the "traditional"
			// when behavior, and return the result of registering
			// the callbacks with promiseOrValue if it is a promise,
			// or the result of invoking callback with promiseOrValue.
			result = isPromise(promiseOrValue)
				? promiseOrValue.then(callback, errback, progressHandler)
				: callback(promiseOrValue);
		}

		return result;
	}

	/*
		Function: some
	*/
	function some(promisesOrValues, howMany) {
		var toResolve, results, promise;

		toResolve = Math.max(0, Math.min(howMany, promises.length));
		results = [];
		promise = new Promise();

		// Resolver for promises.  Captures the value and resolves
		// the returned promise when toResolve reaches zero.
		// Overwrites resolver var with a noop once promise has
		// be resolved to cover case where n < promises.length
		function resolver(val) {
			results.push(val);
			if(--toResolve == 0) {
				resolver = noop;
				promise.resolve(results);
			}
		}

		// Wrapper so that resolver can be replaced
		function resolve(val) {
			resolver(val);
		}

		// Rejecter for promises.  Rejects returned promise
		// immediately, and overwrites rejecter var with a noop
		// once promise to cover case where n < promises.length.
		// TODO: Consider rejecting only when N (or promises.length - N?)
		// promises have been rejected instead of only one?
		function rejecter(err) {
			rejecter = noop;
			promise.reject(err);		
		}

		// Wrapper so that rejecer can be replaced
		function reject(err) {
			rejecter(err);
		}

		function handleProgress(update) {
			handleProgress = noop;
			promise.progress(update);
		}

		function progress(update) {
			handleProgress(update);
		}

		for (var i = 0; i < promisesOrValues.length; i++) {
			when(promisesOrValues[i], resolve, reject, progress);
		}

		return promise;
	}

	/*
		Function: all
	*/
	function all(promisesOrValues, callback, errback, progressHandler) {
		return some(promisesOrValues, promisesOrValues.length, callback, errback, progressHandler);
	}

	/*
		Function: any
	*/
	function any() {
		return some(promisesOrValues, 1, callback, errback, progressHandler);		
	}

	/*
		Section: Public API
	*/

	when.isPromise = isPromise;
	when.some = some;
	when.all = all;
	when.any = any;

	return when;

});
})(typeof define != "undefined" ? define : function(deps, factory){
    // global when, if not loaded via require
    this.when = factory();
});