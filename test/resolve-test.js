(function(buster, define) {

var assert, refute, fail, sentinel, other;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

sentinel = {};
other = {};

function hasObjectDefineProperty() {
	try {
		Object.defineProperty({}, 'a', { value: 1 });
		return true;
	} catch (ex) {}
}

define('when.resolve-test', function (require) {

	var when;

	when = require('when');

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

				if(hasObjectDefineProperty()) {
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

});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
