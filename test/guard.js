(function(buster, guard, when) {

var assert, refute, fail, resolved, rejected;

assert = buster.assert;
refute = buster.refute;
fail = buster.assertions.fail;

resolved = when.resolve;
rejected = when.reject;


buster.testCase('when/guard', {
	'should be usable for throttling when.map': function(done) {
		var called = [];
		var dfds = [when.defer(), when.defer(), when.defer(), when.defer()];
		when.map([0, 1, 2, 3], guard(2).do(function(v) {
			called.push(v);
			return dfds[v];
		}));
		assert.equals(called, [0, 1]);
		dfds[1].resolve();
		assert.equals(called, [0, 1, 2]);
		done();
	},
	'should guard the function with `enter` and `exit` calls': function(done) {
		var got = [];
		function condition(t) {
			got.push(t);
			return true;
		}
		var g = guard(condition);
		g.do(function() {
			return when.defer().resolve();
		})();
		assert.equals(got, ['enter', 'exit']);
		done();
	},
	'should prevent execution of guarded function if condition returns false': function(done) {
		var called;
		function condition() {
			called = true;
			return false;
		}
		guard(condition).do(function() {
			throw new Error('should not be called');
		})();
		assert.equals(called, true);
		done();
	},
	'should convert normal functions to return deferreds': function(done) {
		guard(function() { return true; }).do(function() { return 1; })()
			.then(function(v) {
				assert.equals(v, 1);
				done();
			});
	},
	'should allow deferred arguments': function(done) {
		var g = guard(function() { return true; }).do(function(v) { return v; });
		g(when.defer().resolve(1))
			.then(function(v) {
				assert.equals(v, 1);
				done();
		});
	},
	'should call exit even when the function throws': function(done) {
		var got = [];
		guard(function(t) { got.push(t); return true; })
			.do(function() { throw new Error(); })()
			.then(null, function() {
				assert.equals(got, ['enter', 'exit']);
				done();
			});
	},
	'should understand shorthand for limiting concurrent users ': function(done) {
		var calls = [];
		var dfds = [when.defer(), when.defer()];
		var g = guard(1).do(function(v) { calls.push(v); return dfds[v]; });
		g(0);
		g(1);
		assert.equals(calls, [0]);
		dfds[0].resolve();
		assert.equals(calls, [0, 1]);
		done();
	},
	'should allow multiple concurrent users when limited using shorthand': function(done) {
		var calls = [];
		var g = guard(2).do(function(v) { calls.push(v); return when.defer(); });
		g(1);
		g(2);
		assert.equals(calls, [1, 2]);
		done();
	},
	'should trigger guarded function calls when previous call finishes': function(done) {
		var occupied;
		function condition(t) {
			if(t === 'enter') {
				if(occupied) {
					return false;
				}
				occupied = true;
				return true;
			}
			occupied = false;
		}
		var dfds = [when.defer(), when.defer()];
		var calls = [];
		var fn = guard(condition).do(function(v) {
			calls.push(v);
			return dfds[v];
		});
		fn(0);
		fn(1);
		assert.equals(calls, [0]);
		dfds[0].resolve();
		assert.equals(calls, [0, 1]);
		done();
	}

});
})(
	this.buster || require('buster'),
	this.when_guard || require('../guard'),
	this.when || require('../when')
);
