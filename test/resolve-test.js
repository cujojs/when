var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var when = require('../when');
var sentinel = { value: 'sentinel' };
var other = { value: 'other' };

function hasGetters() {
	try {
		return Object.defineProperty({}, 'a', { get: function() { return 1; } }).a === 1;
	} catch (ex) {}
}

buster.testCase('when.resolve', {

	'should resolve an immediate value': function(done) {
		var expected = 123;

		when.resolve(expected).then(
			function(value) {
				assert.equals(value, expected);
			},
			fail
		).ensure(done);
	},

	'should resolve a resolved promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.resolve(expected);

		when.resolve(d.promise).then(
			function(value) {
				assert.equals(value, expected);
			},
			fail
		).ensure(done);
	},

	'should reject a rejected promise': function(done) {
		var expected, d;

		expected = 123;
		d = when.defer();
		d.reject(expected);

		when.resolve(d.promise).then(
			fail,
			function(value) {
				assert.equals(value, expected);
			}
		).ensure(done);
	},

	'should preserve implicit order': function() {
		var result = [];
		var resolveA;
		var a = new when.Promise(function() {
			resolveA = arguments[0];
		});

		var c = a.then(function() {
			result.push(1);
		});

		var resolveB;
		var b = new when.Promise(function() {
			resolveB = arguments[0];
		});

		// There is a very subtle implicit ordering between
		// resolving a with b, a's handlers, and b's handlers.
		// It seems that a reasonable order should be:
		// b handlers run before a handlers added in the same stack
		b.then(function() {
			result.push(2);
		});

		resolveA(b);

		b.then(function() {
			result.push(3);
		});

		resolveB();

		return c.then(function() {
			assert.equals(result, [2,3,1]);
		});
	},

	'when assimilating untrusted thenables': {

		'should trap exceptions during assimilation': function(done) {
			when.resolve({
				then: function() {
					throw sentinel;
				}
			}).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).ensure(done);
		},

		'should ignore exceptions after fulfillment': function(done) {
			when.resolve({
				then: function(onFulfilled) {
					onFulfilled(sentinel);
					throw other;
				}
			}).then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).ensure(done);
		},

		'should ignore exceptions after rejection': function(done) {
			when.resolve({
				then: function(_, onRejected) {
					onRejected(sentinel);
					throw other;
				}
			}).then(
				fail,
				function(val) {
					assert.same(val, sentinel);
				}
			).ensure(done);
		},

		'should assimilate thenable used as fulfillment value': function(done) {
			when.resolve({
				then: function(onFulfilled) {
					onFulfilled({
						then: function(onFulfilled) {
							onFulfilled(sentinel);
						}
					});
					throw other;
				}
			}).then(
				function(val) {
					assert.same(val, sentinel);
				},
				fail
			).ensure(done);
		},

		'should call untrusted then only after stack clears': function(done) {
			var value, p, spy;

			// value = intentionally undefined
			spy = this.spy();

			p = when.resolve({
				then: function(fulfill) {
					spy(value);
					fulfill();
				}
			}).then(function() {
				assert.calledWith(spy, sentinel);
			}).ensure(done);

			value = sentinel;
		},

		'should assimilate thenables provided as fulfillment arg': function(done) {
			when.resolve({
				then: function(fulfill) {
					fulfill({
						then: function(fulfill) {
							fulfill(sentinel);
						}
					});
				}
			}).then(function(value) {
				assert.same(value, sentinel);
			}).ensure(done);
		},

		'should reject if accessing thenable.then throws': function(done) {
			var result, thenable;

			if(hasGetters()) {
				thenable = {};
				Object.defineProperty(thenable, 'then', {
					get: function() {
						throw sentinel;
					}
				});

				result = when.resolve(thenable).then(
					fail,
					function(e) {
						assert.same(e, sentinel);
					}
				).ensure(done);

			} else {
				// Non-ES5 env, no need to test pathological getters/proxies
				assert(true);
				done();
			}
		}

	}

});
