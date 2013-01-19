(function(buster, when, when_callback) {

var assert = buster.assertions.assert;

var assertIsPromise = function(arg) {
	assert(when.isPromise(arg));
};

var toArray = function(arrayLike) {
	return Array.prototype.slice.call(arrayLike);
};

var makeAsyncFunction = function() {
	var callback;

	var that = function() {
		var args = toArray(arguments);

		callback = args.pop();
		that.passedArguments = args;
	};

	that.finish = function() {
		callback.apply(null, arguments);
	};

	return that;
};

buster.testCase('when/callback', {
	'should return a promise': function() {
		var fn = makeAsyncFunction();
		assertIsPromise(when_callback(fn));
	},

	'should resolve when callback is called': function() {
		var fn = makeAsyncFunction();
		var promise = when_callback(fn);

		var resolved = false;
		promise.
		then(function()   { resolved = true; }).
		always(function() { assert(resolved); });

		fn.finish();
	},

	'should not resolve when callback is not called': function() {
		var fn = makeAsyncFunction();
		var promise = when_callback(fn);

		var remainsUnresolved = true;
		promise.then(function() { remainsUnresolved = false; });

		assert(remainsUnresolved);
	},

	'should resolve with the callback arguments': function() {
		var fn = makeAsyncFunction();
		var promise = when_callback(fn);

		var resolveValue;
		promise.then(function(args) { resolveValue = args; });

		fn.finish(1, 2, 3);
		assert.equals(resolveValue, [1, 2, 3]);
	},

	'should forward its second argument to the function': function() {
		var fn = makeAsyncFunction();

		when_callback(fn, [1, 2, 3]);
		assert.equals(fn.passedArguments, [1, 2, 3]);
	}
});

})(
	this.buster || require('buster'),
	this.when || require('..'),
	this.when_callback || require('../callback')
);
