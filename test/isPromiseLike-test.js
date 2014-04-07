var buster = typeof window !== 'undefined' ? window.buster : require('buster');

var when = require('../when');

var fakePromise = {
	then:function () {}
};

function assertIsPromiseLike(it) {
	buster.assert(when.isPromiseLike(it));
}

function refuteIsPromiseLike(it) {
	buster.refute(when.isPromiseLike(it));
}

buster.testCase('when.isPromiseLike', {

	'should return true for trusted': function() {
		assertIsPromiseLike(when.resolve());
	},

	'should return true for promise': function() {
		assertIsPromiseLike(fakePromise);
	},

	'should return false for non-promise': function() {
		/*jshint -W009, -W010, -W053 */
		var inputs = [
			1,
			0,
			'not a promise',
			true,
			false,
			void 0,
			null,
			'',
			/foo/,
			{},
			new Object(),
			new RegExp('foo'),
			new Date(),
			new Boolean(),
			[],
			new Array()
		];

		for(var i = inputs.length - 1; i >= 0; --i) {
			refuteIsPromiseLike(inputs[i]);
		}
	},

	'should return true for delegated promise': function() {
		function T() {}

		T.prototype = fakePromise;
		assertIsPromiseLike(new T());
	}
});
