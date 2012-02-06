var tests = [
	'isPromise.js',
	'then.js',
	'when.js',
	'all.js',
	'map.js',
	'reduce.js',
	'apply.js',
	'delay.js',
	'timeout.js',
	'cancelable.js'
//	'*.js'
];

exports['when:node'] = {
    env: 'node',
    tests: tests
};

exports['when:browser'] = {
	env: 'browser',
	libs: [ '../when.js', '../apply.js', '../delay.js', '../timeout.js', '../cancelable.js' ],
	tests: tests
};