(function (global) {
	'use strict';
	if(typeof console === 'undefined' && typeof window !== 'undefined') {
		window.console = {};
	}

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
