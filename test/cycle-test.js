var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var Promise = require('../lib/Promise');

function assertCycle(p) {
	return p.then(buster.referee.fail, function(e) {
		assert(e instanceof TypeError);
	});
}

buster.testCase('cycle detection', {

	'should detect self-cycles': {
		'when resolving':  function() {
			var p = new Promise(function(resolve) {
				setTimeout(function() {
					resolve(p);
				}, 0);
			});

			return assertCycle(p);
		},

		'when returning from handler': function() {
			var p = Promise.resolve();
			p = p.then(function() {
				return p;
			});

			return assertCycle(p);
		},

		'when returning resolved from handler': function() {
			var p = Promise.resolve();
			p = p.then(function() {
				return Promise.resolve(p);
			});

			return assertCycle(p);
		}
	},

	'should detect long cycles': function() {
		var p1 = new Promise(function(resolve) {
			setTimeout(function() {
				resolve(p2);
			}, 0);
		});

		var p2 = new Promise(function(resolve) {
			setTimeout(function() {
				resolve(p3);
			}, 0);
		});

		var p3 = new Promise(function(resolve) {
			setTimeout(function() {
				resolve(p1);
			}, 0);
		});

		return assertCycle(p3);
	}
});
