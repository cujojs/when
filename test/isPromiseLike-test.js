(function(buster, define) {

var fakePromise, undef;

fakePromise = {
	then:function () {}
};

define('when.isPromise-test', function (require) {

	var when = require('when');

	function assertIsPromiseLike(it) {
		buster.assert(when.isPromiseLike(it));
	}

	function refuteIsPromiseLike(it) {
		buster.refute(when.isPromiseLike(it));
	}

	buster.testCase('when.isPromiseLike', {

		'should return true for trusted': function() {
			assertIsPromiseLike(when.resolve());
		},

		'should return true for promise': function() {
			assertIsPromiseLike(fakePromise);
		},

		'should return false for non-promise': function() {
			/*jshint -W009, -W010, -W053 */
			var inputs = [
				1,
				0,
				'not a promise',
				true,
				false,
				undef,
				null,
				'',
				/foo/,
				{},
				new Object(),
				new RegExp('foo'),
				new Date(),
				new Boolean(),
				[],
				new Array()
			];

			for(var i = inputs.length - 1; i >= 0; --i) {
				refuteIsPromiseLike(inputs[i]);
			}
		},

		'should return true for delegated promise': function() {
			function T() {}

			T.prototype = fakePromise;
			assertIsPromiseLike(new T());
		}
	});

});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
