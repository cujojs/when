var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var unhandledRejection = require('../lib/decorators/unhandledRejection');

buster.testCase('unhandledRejection', {

	'should not fail if JSON.stringify throws': function() {
		var fixture = unhandledRejection({});
		var circle = {};
		circle.self = circle;

		buster.refute.exception(function() {
			fixture.onPotentiallyUnhandledRejection({ handled: false, value: circle });
		});
	}

});
