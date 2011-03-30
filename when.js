(function(define) {
define([], function() {

	/*
		Constructor: Promise
		Creates a new Promise
	*/ 
	
	function Promise () {
		this._thens = [];
		this._progress = [];
	}

	Promise.prototype = {

		/* This is the "front end" API. */

		// then(onResolve, onReject): Code waiting for this promise uses the
		// then() method to be notified when the promise is complete. There
		// are two completion callbacks: onReject and onResolve. A more
		// robust promise implementation will also have an onProgress handler.
		then: function (onResolve, onReject, onProgress) {
			// capture calls to then()
			this._thens.push({ resolve: onResolve, reject: onReject, progress: onProgress });
			onProgress && this._progress.push(onProgress);
		},

		// Some promise implementations also have a cancel() front end API that
		// calls all of the onReject() callbacks (aka a "cancelable promise").
		// cancel: function (reason) {},

		/* This is the "back end" API. */

		// resolve(resolvedValue): The resolve() method is called when a promise
		// is resolved (duh). The resolved value (if any) is passed by the resolver
		// to this method. All waiting onResolve callbacks are called
		// and any future ones are, too, each being passed the resolved value.
		resolve: function (val) { this._complete('resolve', val); },

		// reject(exception): The reject() method is called when a promise cannot
		// be resolved. Typically, you'd pass an exception as the single parameter,
		// but any other argument, including none at all, is acceptable.
		// All waiting and all future onReject callbacks are called when reject()
		// is called and are passed the exception parameter.
		reject: function (ex) { this._complete('reject', ex); },

		// Some promises may have a progress handler. The back end API to signal a
		// progress "event" has a single parameter. The contents of this parameter
		// could be just about anything and is specific to your implementation.
		
		progress: function(statusObject) {
			var i=0,
				p;
			while(p = this._progress[i++]) { p(statusObject); }
		},

		/* "Private" methods. */

		_complete: function (which, arg) {
			// switch over to sync then()
			this.then = which === 'reject' ?
				function (resolve, reject) { reject && reject(arg); } :
                    function (resolve) { resolve && resolve(arg); };
            // disallow multiple calls to resolve or reject
			this.resolve = this.reject = this.progress =
				function () { throw new Error('Promise already completed.'); };

			// complete all waiting (async) then()s
			var aThen,
				i = 0;
			while (aThen = this._thens[i++]) { aThen[which] && aThen[which](arg); }
			delete this._thens;
		}
	};

	/*
		Function: isPromise
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
			if(isPromise(promiseOrValue)) {
				result = promiseOrValue;		
			} else {
				result = new Promise();
				result.then(promiseOrValue);
			}
		} else {
			result = isPromise(promiseOrValue)
				? promiseOrValue.then(callback, errback, progressHandler);
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
			when(promisesOrValues, resolve, reject, progress);
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
    // global when, if loaded directly
    this.when = factory();
});