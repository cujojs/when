var tests = ['*.js'];

exports['node'] = {
    environment: 'node',
	tests: tests
};

// FIXME: Something has changed with buster's browser testing, and either
// it is not working at all, or this configuration is not valid
//var browserTests = tests.map(function(t) { return './test/' + t; });
//exports['browser'] = {
//	environment: 'browser',
//	rootPath: '../',
//	tests: browserTests,
//	sources: [ './when.js', './apply.js', './delay.js', './timeout.js', './cancelable.js' ]
//};