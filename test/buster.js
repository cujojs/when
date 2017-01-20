exports.node = {
	environment: 'node',
	rootPath: '../',
	tests: [
		'test/**/*-test.js'
	]
};

exports.browser = {
	environment: 'browser',
	rootPath: '..',
	tests: [
		'test/browser/tests.js'
	],
	resources: [
		'test/browser/es5.js'
	],
	testbed: 'test/browser/index.html'
};
