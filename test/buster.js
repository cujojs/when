// Throttle back potentially unhandled rejection reporting
// since buster seems to hold onto promises returned from test cases
// without observing them immediately.
// Still report, just wait longer to give them a chance to be observed
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
