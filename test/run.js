(function (buster, require) {
	'use strict';

	require(['curl/_privileged', 'domReady!'], function (curl) {

		var modules = [], moduleId;

		for (moduleId in curl.cache) {
			if (moduleId.indexOf('-test') > 0) {
				modules.push(moduleId);
			}
		}

		buster.testRunner.timeout = 5000;
		require(modules, function () {
			buster.run();
		});

	});

}(
	this.buster,
	this.curl
));
