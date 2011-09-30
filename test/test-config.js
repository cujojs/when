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

	doh.asyncHelper = {
		deferN: function(n) {
			var values, deferreds, i = 0;

			values = [];
			deferreds = [];

			for (; i < n; i++) {
				values.push(i);
				deferreds.push(when.defer());
			}

			for (i = 0; i < n; i++) {
				(function(i) {
					setTimeout(function() {
						deferreds[i].resolve(values[i]);
					}, Math.random() * 100);
				})(i);
			}

			return { values: values, promises: deferreds };
		},
		assertSome: function(expected, promisesOrValues, howMany) {
			var dohd = new doh.Deferred();

			if (arguments.length < 3) {
				howMany = promisesOrValues.length
			}

			// Yuck, using when.some in the test validation
			when.some(promisesOrValues, howMany,
				function(val) {
					var len = Math.min(promisesOrValues.length, howMany);
					var success = len === val.length;

					// This test may be overlay lax
					// The question of order and array position for when.some
					// is still up in the air, so this test simply ensures
					// that the results values are somewhere in the expected
					// set.
					for (var i = 0; i < len; i++) {
						success = success && (expected.indexOf(val[i]) >= 0);
					}

					dohd.callback(success);
				},
				doh.rejecter(dohd)
			);

			return dohd;
		}
	}

})(this, doh);