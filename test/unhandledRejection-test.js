var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var unhandledRejection = require('../lib/decorators/unhandledRejection');

buster.testCase('=>unhandledRejection', {

	'should not fail if JSON.stringify throws': function(done) {
		var fixture = unhandledRejection({}, function(f) {
			setTimeout(function() {
				buster.refute.exception(f);
				done();
			});
		});
		var circular = {};
		circular.self = circular;

		fixture.onPotentiallyUnhandledRejection({ handled: false, value: circular });
	}

});
