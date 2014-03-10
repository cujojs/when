(function(buster, define) {

var assert, fail, sentinel, other;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = { value: 'sentinel' };
other = { value: 'other' };

define('when/flow-test', function (require) {

	var Promise = require('when').Promise;

	buster.testCase('when/lib/flow', {
		'otherwise': {
			'should be an alias for catch': function() {
				assert.same(Promise.prototype['catch'], Promise.prototype.otherwise);
			}
		},

		'catch': {
			'should catch rejections': function() {
				return Promise.reject(sentinel)['catch'](function(e) {
					assert.same(e, sentinel);
				});
			},

			'when predicate is provided': {

				'and is an Error type match': {
					'should only catch errors of same type': function() {
						var e1 = new TypeError();
						return Promise.reject(e1)['catch'](SyntaxError, fail)
							['catch'](TypeError, function(e) {
							assert.same(e1, e);
						});
					}
				},

				'and is a predicate function': {
					'should only catch errors of same type': function() {
						var e1 = new TypeError();
						return Promise.reject(e1)['catch'](function(e) {
							return e !== e1;
						}, fail)['catch'](function(e) {
							return e === e1;
						}, function(e) {
							assert.same(e1, e);
						});
					}
				},

				'but is not a function': {
					'when rejected should reject with a TypeError': function() {
						return Promise.reject(sentinel)['catch'](123, fail)
							['catch'](function(e) {
								assert(e instanceof TypeError);
							});
					},

					'when fulfilled should reject with a TypeError': function() {
						return Promise.resolve(sentinel)['catch'](123, fail)
							['catch'](function(e) {
							assert(e instanceof TypeError);
						});
					}

				}
			}
		},

		'finally': {
			'should be an alias for ensure': function() {
				var p = Promise.resolve();
				assert.same(p['finally'], p.ensure);
			}
		},

		'ensure': {
			'should return a promise': function() {
				assert.isFunction(Promise.resolve().ensure().then);
			},

			'when fulfilled': {
				'should ignore callback return value': function() {
					return Promise.resolve(sentinel).ensure(
						function() {
							return other;
						}
					).then(
						function(val) {
							assert.same(val, sentinel);
						},
						fail
					);
				},

				'should propagate rejection on throw': function() {
					return Promise.resolve(other).ensure(
						function() {
							throw sentinel;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					);
				}
			},

			'when rejected': {
				'should propagate rejection, ignoring callback return value': function() {
					return Promise.reject(sentinel).ensure(
						function() {
							return other;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					);
				},

				'should propagate rejection on throw': function() {
					return Promise.reject(other).ensure(
						function() {
							throw sentinel;
						}
					).then(
						fail,
						function(val) {
							assert.same(val, sentinel);
						}
					);
				}
			},

			'should ignore non-function': function() {
				return Promise.resolve(true).ensure().then(assert);
			}
		}

	});

});

}(this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
	var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
	pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
	factory(function (moduleId) {
		return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
	});
}));
