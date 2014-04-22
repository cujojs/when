var unhandledRejections = require('../lib/decorators/unhandledRejection');
unhandledRejections(require('../when').Promise, function(f) {
	setTimeout(f, 1000);
});

exports.node = {
	environment: 'node',
	rootPath: '../',
	tests: [
		'test/**/*-test.js'
	]
};

exports.browser = {
	environment: 'browser',
	rootPath: '../',
	tests: [
		'test/browser/tests.js'
	],
	testbed: 'test/browser/index.html'
};
