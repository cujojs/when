var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var unhandledRejection = require('../lib/decorators/unhandledRejection');

buster.testCase('unhandledRejection', {

	'should not fail if JSON.stringify throws': function() {
		var fixture = unhandledRejection({});
		var circle = { self: void 0 };
		circle.self = circle;

		buster.refute.exception(function() {
			fixture.onPotentiallyUnhandledRejection({
				id: 'JSON.stringify circular ref test',
				handled: false,
				value: circle
			});
		});
	}

});
