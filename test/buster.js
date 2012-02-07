var tests = [ './*.js' ];

exports['when:node'] = {
    env: 'node',
    tests: tests
};

exports['when:browser'] = {
	env: 'browser',
	sources: [ '../when.js', '../apply.js', '../delay.js', '../timeout.js', '../cancelable.js' ],
	tests: tests
};