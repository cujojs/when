var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var CorePromise = require('../lib/Promise');

function assertCycle(p) {
	return p.then(buster.referee.fail, function(e) {
		assert(e instanceof TypeError);
	});
}

buster.testCase('cycle detection', {

	'should detect self-cycles': {
		'when resolving':  function() {
			/*global setTimeout*/
			var p = new CorePromise(function(resolve) {
				setTimeout(function() {
					resolve(p);
				}, 0);
			});

			return assertCycle(p);
		},

		'when returning from handler': function() {
			var p = CorePromise.resolve();
			p = p.then(function() {
				return p;
			});

			return assertCycle(p);
		},

		'when returning resolved from handler': function() {
			var p = CorePromise.resolve();
			p = p.then(function() {
				return CorePromise.resolve(p);
			});

			return assertCycle(p);
		}
	},

	'should detect long cycles': function() {
		var p1 = new CorePromise(function(resolve) {
			setTimeout(function() {
				resolve(p2);
			}, 0);
		});

		var p2 = new CorePromise(function(resolve) {
			setTimeout(function() {
				resolve(p3);
			}, 0);
		});

		var p3 = new CorePromise(function(resolve) {
			setTimeout(function() {
				resolve(p1);
			}, 0);
		});

		return assertCycle(p3);
	}
});
