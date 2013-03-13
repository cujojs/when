(function() {

var config = {};

config.node = {
	environment: 'node',
	rootPath: '../',
	tests: [
		'test/**/*-test.js'
	]
};

config.browser = {
	environment: 'browser',
	autoRun: false,
	rootPath: '../',
	resources: [
		//'**', ** is busted in buster
		'*.js',
		'node/**/*.js',
		'unfold/**/*.js',
		'node_modules/curl/**/*.js'
	],
	libs: [
		'test/curl-config.js',
		'node_modules/curl/src/curl.js'
	],
	sources: [
		// loaded as resources
	],
	tests: [
		'test/**/*-test.js',
		'test/run.js'
	]
};

if(typeof module != 'undefined') {
	module.exports = config;
}

})();
