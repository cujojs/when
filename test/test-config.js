(function(global, doh) {

	function assertIsPromise(it) {
		doh.assertTrue(when.isPromise(it));
	}

	function assertIsNotPromise(it) {
		doh.assertFalse(when.isPromise(it));
	}

	function assertResolutionEquals(expected, dohDeferred) {
	    return function(result) {
	        dohDeferred.callback(expected === result);
	    };
	}

	function rejecter(dohDeferred) {
	    return function(e) {
	        dohDeferred.errback(e);
	    };
	}

	doh.assertIsPromise = assertIsPromise;
	doh.assertIsNotPromise = assertIsNotPromise;
	doh.assertResolutionEquals = assertResolutionEquals;
	doh.rejecter = rejecter;
	
})(this, doh);