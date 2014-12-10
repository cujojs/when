var buster = typeof window !== 'undefined' ? window.buster : require('buster');
var assert = buster.assert;

var format = require('../lib/format');

buster.testCase('format', {

	'formatError': {
		'should format null as string': function() {
			var s = format.formatError(null);
			assert.equals(typeof s, 'string');
		},

		'should format undefined as string': function() {
			var s = format.formatError(void 0);
			assert.equals(typeof s, 'string');
		},

		'should be the contents of the stack property of an error': function() {
			var expected = 'ok';
			var e = new Error();
			e.stack = expected;
			var s = format.formatError(e);
			assert.equals(s, expected);
		}

	},

	'formatObject': {
		'should JSON.stringify a plain object': function() {
			var o = {foo: 'bar'};
			var s = format.formatObject(o);
			assert.equals(s, JSON.stringify(o));
		}
	},

	'tryStringify': {
		'should return default value when JSON.stringify fails': function() {
			var o = { circle: null };
			o.circle = o;

			var sentinel = {};
			assert.same(sentinel, format.tryStringify(o, sentinel));
		}
	}
});
