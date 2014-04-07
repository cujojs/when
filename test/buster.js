exports.node = {
	environment: 'node',
	rootPath: '../',
	tests: [
		'test/inspect-test.js'
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
