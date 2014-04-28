var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;
var fail = buster.referee.fail;

var Promise = require('../../lib/Promise');

function replace(target, method, replacement) {
	var tmp = target[method];
	target[method] = function() {
		target[method] = tmp;
		return replacement.apply(this, arguments);
	};
}

buster.testCase('when/unhandledRejectionApi', {

	'reject should trigger report': function(done) {
		replace(Promise, 'onPotentiallyUnhandledRejection', function () {
			assert(true);
			done();
		});

		new Promise(function (_, reject) {
			reject();
		});
	},

	'Promise.reject should trigger report': function(done) {
		replace(Promise, 'onPotentiallyUnhandledRejection', function () {
			assert(true);
			done();
		});

		Promise.reject();
	}
});
