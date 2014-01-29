(function (global) {
	'use strict';

	global.curl = {
		packages: [
			{ name: 'when', location: './', main: 'when' },
			{ name: 'curl', location: 'node_modules/curl/src/curl', main: 'curl' }
		],
		preloads: [
			'//cdnjs.cloudflare.com/ajax/libs/es5-shim/2.2.0/es5-shim.min',
			'https://raw.github.com/es-shims/es5-shim/master/es5-sham.min'
		]
	};

}(this));
