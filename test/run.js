(function (buster, define) {
	'use strict';

	define('when/test/run', ['curl/_privileged', 'domReady!'], function (curl) {

		var modules = Object.keys(curl.cache).filter(function (moduleId) {
			return moduleId.indexOf('-test') > 0;
		});

		buster.testRunner.timeout = 5000;
		define('when/test/run-faux', modules, function () {
			buster.run();
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
