(function() {

var tests, config;

tests = ['test/**/*-test.js'];
config = {};

config.node = {
	environment: 'node',
	rootPath: '../',
	tests: tests
};

config.browser = {
	environment: 'browser',
	rootPath: '../',
	tests: tests,
	sources: [
		'when.js',
		'apply.js',
		'delay.js',
		'timeout.js',
		'cancelable.js',
		'sequence.js',
		'pipeline.js',
		'parallel.js',
		'callbacks.js',
		'function.js',
		'keys.js',
		'poll.js',
		'unfold.js',
		'unfold/list.js',
		'node/function.js'
	]
};

if(typeof module != 'undefined') {
	module.exports = config;
}

})();
