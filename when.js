(function(define, undef) {
define([], function() {

	var freeze = Object.freeze || function() {};

	/*
		Constructor: Deferred
		Creates a new Deferred
	*/
	function Deferred() {
		var deferred, promise, resolver, result, listeners, tail;

		function thenImpl(callback, errback, progback) {
			var d, l;

			d = Deferred();
			l = {
				deferred: d,
				resolve: callback,
				reject: errback,
				progress: progback
			};

			if(listeners) {
				tail = tail.next = l;
			} else {
				listeners = tail = l;
			}

			return d.promise;
		}

		function then(callback, errback, progback) {
			return thenImpl(callback, errback, progback);
		}

		function resolve(val) { complete('resolve', val); }
		
		function reject(err) { complete('reject', err); }
		
		function progress(update) {
			var listener, progress;
			
			listener = listeners;

			while(listener) {
				progress = listener.progress;
				progress && progress(update);
				listener = listener.next;
			}
		}

		function complete(which, val) {
			resolve = reject = function alreadyCompleted() {
				throw new Error("Promise already completed");
			};

			// Save original thenImpl
			var origThen = thenImpl;

			// Replace thenImpl with one that immediately notifies
			thenImpl = function newThen(callback, errback) {
				var promise = origThen(callback, errback);
				notify(which, result);
				return promise;
			};

			result = val;

			notify(which, val);
		}

		function notify(which, val) {
			
			while(listeners) {
				var listener, ldeferred, newResult, handler;

				listener = listeners;
				ldeferred = listener.deferred;
				listeners = listeners.next;

				handler = listener[which];
				if(handler) {
					try {
						newResult = handler(result);

						if(isPromise(newResult)) {
							newResult.then(ldeferred.resolve, ldeferred.reject, ldeferred.progress);
						
						} else {
							ldeferred[which](newResult === undef ? result : newResult);							

						}
					} catch(e) {
						ldeferred[which](result);
					}
				}
			}			
		}

		deferred = {};

		// Promise and Resolver parts
		promise  = deferred.promise  = {};
		resolver = deferred.resolver = {};

		// Expose Promise API
		promise.then = deferred.then = then;
		
		// Expose Resolver API
		resolver.resolve  = deferred.resolve  = resolve;
		resolver.reject   = deferred.reject   = reject;
		resolver.progress = deferred.progress = progress;

		// Freeze Promise and Resolver APIs
		freeze(promise);
		freeze(resolver);

		return deferred;
	}

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
				result = new Deferred();
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

		// TODO: Return Promise instead of Deferred
		return result;
	}

	/*
		Function: some
	*/
	function some(promisesOrValues, howMany) {
		var toResolve, results, deferred;

		toResolve = Math.max(0, Math.min(howMany, promises.length));
		results = [];
		deferred = new Deferred();

		// Resolver for promises.  Captures the value and resolves
		// the returned promise when toResolve reaches zero.
		// Overwrites resolver var with a noop once promise has
		// be resolved to cover case where n < promises.length
		function resolver(val) {
			results.push(val);
			if(--toResolve == 0) {
				resolver = noop;
				deferred.resolve(results);
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
			deferred.reject(err);		
		}

		// Wrapper so that rejecer can be replaced
		function reject(err) {
			rejecter(err);
		}

		function handleProgress(update) {
			handleProgress = noop;
			deferred.progress(update);
		}

		function progress(update) {
			handleProgress(update);
		}

		for (var i = 0; i < promisesOrValues.length; i++) {
			when(promisesOrValues[i], resolve, reject, progress);
		}

		// TODO: Return Promise instead of Deferred
		return deferred;
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

	when.Deferred  = Deferred;

	when.isPromise = isPromise;
	when.some      = some;
	when.all       = all;
	when.any       = any;

	return when;

});
})(typeof define != 'undefined' ? define : function(deps, factory){
    // global when, if not loaded via require
    this.when = factory();
});