(function(global, doh) {

	function assertIsPromise(it) {
		doh.assertTrue(when.isPromise(it));
	}

	function assertIsNotPromise(it) {
		doh.assertFalse(when.isPromise(it));
	}

	doh.assertIsPromise = assertIsPromise;
	doh.assertIsNotPromise = assertIsNotPromise;
	
})(this, doh);