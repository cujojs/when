var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var when = require('../when');
var sentinel = { value: 'sentinel' };
var other = { value: 'other' };

function noop() {}

buster.testCase('promise.fold', {

	'should pass value and arg': function() {
		return when.resolve(other).fold(function(a, b) {
			assert.same(a, sentinel);
			assert.same(b, other);
		}, sentinel);
	},

	'should pairwise combine two promises': function() {
		return when.resolve(1).fold(function sum(x, y) {
			return x + y;
		}, when.resolve(2)).then(function(x){
			assert.equals(x, 3);
		});
	},

	'should reject if combine throws': function() {
		return when.resolve(1).fold(function() {
			throw sentinel;
		}, 2)['catch'](function(e){
			assert.same(e, sentinel);
		});
	},

	'should reject if combine returns rejection': function() {
		return when.resolve(1).fold(when.reject, sentinel)['catch'](function(e){
			assert.same(e, sentinel);
		});
	},

	'should reject and not call combine': {
		'if promise rejects': function() {
			return when.reject(sentinel).fold(noop, 2)['catch'](function(e){
				assert.same(e, sentinel);
			});
		},

		'if arg rejects': function() {
			return when.resolve(1).fold(noop, when.reject(sentinel))
				['catch'](function(e){
					assert.same(e, sentinel);
				});
		}
	}

});
