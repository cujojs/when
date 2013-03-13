(function (global) {
	'use strict';

	global.curl = {
		packages: [
			{ name: 'when', location: './', main: 'when' },
			{ name: 'curl', location: 'node_modules/curl/src/curl', main: 'curl' }
		]
	};

}(this));
