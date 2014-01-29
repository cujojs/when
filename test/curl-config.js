(function (global) {
	'use strict';

	global.curl = {
		packages: {
			when: { location: './', main: 'when' },
			poly: { location: 'node_modules/poly' },
			curl: { location: 'node_modules/curl/src/curl', main: 'curl' }
		},
		preloads: [
			'poly/es5'
		]
	};

}(this));
