(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

define('when/semigroup-test', function (require) {

	var Promise = require('when/Promise');

	function assertAssociative(a, b, c) {
		return a.concat(b).concat(c).then(function(x) {
			return a.concat(b.concat(c)).then(function(y) {
				assert.same(x, y);
			});
		});
	}

	buster.testCase('semigroup', {
		'concat': {
			'should fulfill when both fulfilled': function() {
				return Promise.of().concat(Promise.of()).then(function() {
					assert(true);
				});
			},

			'should fulfill when a fulfills and b rejects': function() {
				return Promise.of(sentinel).concat(Promise.reject()).then(function(x) {
					assert.same(x, sentinel);
				});
			},

			'should fulfill when a rejects and b fulfills': function() {
				return Promise.reject().concat(Promise.of(sentinel)).then(function(x) {
					assert.same(x, sentinel);
				});
			},

			'should be associative': function() {
				return assertAssociative(Promise.of('a'), Promise.of('b'), Promise.of('c'));
			},

			'should be associative for rejections a': function() {
				return assertAssociative(Promise.reject('a'), Promise.of('b'), Promise.of('c'));
			},

			'should be associative for rejections b': function() {
				return assertAssociative(Promise.of('a'), Promise.reject('b'), Promise.of('c'));
			},

			'should be associative for rejections c': function() {
				return assertAssociative(Promise.of('a'), Promise.of('b'), Promise.reject('c'));
			},

			'should be associative for rejections a b': function() {
				return assertAssociative(Promise.reject('a'), Promise.reject('b'), Promise.of('c'));
			},

			'should be associative for rejections a c': function() {
				return assertAssociative(Promise.reject('a'), Promise.of('b'), Promise.reject('c'));
			},

			'should be associative for rejections b c': function() {
				return assertAssociative(Promise.of('a'), Promise.reject('b'), Promise.reject('c'));
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
