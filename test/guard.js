(function(buster, guard, when) {

var assert, refute, fail, resolved, rejected;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

resolved = when.resolve;
rejected = when.reject;

buster.testCase('when/guard', {
	'should be usable for throttling when.map': function(done) {
		var dfds = [0, 1, 2, 3].map(function() {
			return when.defer();
		});
		when.map([0, 1, 2, 3], guard(2).do(function(v) {
			return dfds[v].resolve(v * 10);
		})).then(function(v) {
			assert.equals(v, [0, 10, 20, 30]);
			done();
		});
	},
	'should guard the function with `enter` and `exit` calls': function(done) {
		var got = [];
		var g = guard({
			enter: function() { got.push('enter'); return true; },
			exit: function() { got.push('exit'); }
		});
		g.do(function() {
			return when.defer().resolve();
		})().then(function() {
			assert.equals(got, ['enter', 'exit']);
			done();
		});
	},
	'should convert normal functions to return deferreds': function(done) {
		guard(1).do(function() { return 1; })()
			.then(function(v) {
				assert.equals(v, 1);
				done();
			});
	},
	'should allow deferred arguments': function(done) {
		var g = guard(1).do(function(v) { return v; });
		g(when.defer().resolve(1))
			.then(function(v) {
				assert.equals(v, 1);
				done();
		});
	},
	'should call exit even when the function throws': function(done) {
		var got = [];
		var condition = {
			exit: function() { got.push('exit'); },
			enter: function() { got.push('enter'); return true;}
		};
		guard(condition)
			.do(function() { throw new Error(); })()
			.then(null, function() {
				assert.equals(got, ['enter', 'exit']);
				done();
			});
	},
	'should be sharable between functions': function(done) {
		var g = guard(1);
		var first;
		var d = when.defer();
		g.do(function() {
			first = true;
			return d;
		})();
		g.do(function() {
			assert.equals(first, true);
			done();
		})();
		d.resolve();
	},
	'should limit concurrent users using a shorthand': function(done) {
		var calls = [];
		var first = when.defer();
		var dfds = [first.then(function() { assert.equals(calls, [0]); }),
					when.defer().resolve()];
		var g = guard(1).do(function(v) { calls.push(v); return dfds[v]; });
		g(0);
		g(1).then(function() {
			assert.equals(calls, [0, 1]);
			done();
		});
		first.resolve();
	}
});
})(
	this.buster || require('buster'),
	this.when_guard || require('../guard'),
	this.when || require('../when')
);
