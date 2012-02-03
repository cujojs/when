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

    function indexOf(array, val) {
        var len, i;
        len = array.length;
        i = 0;
        for(;i<len; i++) {
            if(i in array && array[i] === val) {
                return i;
            }
        }

        return -1;
    }

    function getArrayAssertion(dohd, expected, expectedLength) {
        // Return a promise handler that will verify the results
        return function (val) {
            var success = expectedLength === val.length;

            // This test may be overlay lax
            // The question of order and array position for when.some
            // is still up in the air, so this test simply ensures
            // that the results values are somewhere in the expected
            // set.
            for (var i = 0; i < expectedLength; i++) {
                success = success && (indexOf(expected, val[i]) >= 0);
            }

            dohd.callback(success);
        }
    }

    function assertSameContents(dohd, array1, array2) {
        var len1, len2, i, success;

        len1 = array1.length;
        len2 = array2.length;

        success = len1 === len2;

        i = 0;
        while (success && i < len1) {
            success = success && array1[i] === array2[i];
            ++i;
        }

        dohd.callback(success);

    }

    doh.asyncHelper = {
        indexOf: indexOf,
        map: function(array, mapper) {
            var result, len, i;

            result = [];
            len = array.length;
            i = 0;

            for(;i<len; i++) {
                if(i in array) {
                    result[i] = mapper(array[i]);
                }
            }

            return result;
        },
		deferN: function(n) {
			// Create an array of N values, and N deferreds.
			// Each deferred will resolve to its corresponding value
			// after a random timeout
			
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
					}, Math.random() * 10);
				})(i);
			}

			return { values: values, promises: deferreds };
		},
		assertSome: function(expected, promisesOrValues, howMany, howManyExpected) {
			var dohd = new doh.Deferred();

			when.some(promisesOrValues, howMany,
				getArrayAssertion(dohd, expected, howManyExpected),
				doh.rejecter(dohd)
			);

			return dohd;
		},
		assertAll: function(expected, promisesOrValues) {
			var dohd = new doh.Deferred();

			when.all(promisesOrValues,
				function(results) {
                    assertSameContents(dohd, expected, results);
                },
				doh.rejecter(dohd)
			);

			return dohd;
		},
        assertSameContents: assertSameContents,
        assertRejected: function(promise, value) {
            var dohd, args;

            dohd = new doh.Deferred();

            args = arguments;

            promise.then(
                function(e) { dohd.errback(e); },
                function(v) {
                    dohd.callback(args.length < 2 ? true : (value === v));
                }
            );

            return dohd;
        },
        assertResolved: function(promise, value) {
            var dohd, args;

            dohd = new doh.Deferred();

            args = arguments;

            promise.then(
                function(v) {
                    dohd.callback(args.length < 2 ? true : (value === v));
                },
                function(e) { dohd.errback(e); }
            );

            return dohd;
        }

	}

})(this, doh);