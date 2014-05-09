var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var when = require('../when');

function sum(x, y) {
	return x + y;
}

function equal(x, y) {
	if (x !== y) { throw 'not equal!'; }
}

buster.testCase('promise.fold', {

	'should pairwise combine two promises': function() {
		return when.resolve(1).fold(sum, when.resolve(2)).then(function(res){
			assert.equals(res, 3);
		});
	},

	'should still fail normally after a fold': function() {
		return when.resolve(1).fold(equal, 2)['catch'](function(res){
			assert.equals(res, 'not equal!');
		});
	},
	'should reject and not call fold if previous promise rejects': function() {
		return when.reject(1).fold(equal, 2)['catch'](function(res){
			assert.equals(res, 1);
		});
	}

});
