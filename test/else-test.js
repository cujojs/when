var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var when = require('../when');

var input = {};
var sentinel = { value: 'sentinel' };

buster.testCase('promise.else', {
	'should resolve normally if previous promise doesn\'t fail': function () {

		return when.resolve(input)
			['else'](sentinel)
			.then(function (val) {
				assert.same(val, input);
			});
	},

	'should resolve with else value if previous promise fails': function () {

		return when.reject(input)
			['else'](sentinel)
			.then(function (val) {
				assert.same(val, sentinel);
			});
	}
});
