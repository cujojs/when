(function(buster, define) {

var assert, fail, sentinel;

assert = buster.assert;
fail = buster.assertions.fail;

sentinel = {};

define('when.map-test', function (require) {

	var when, delay, resolved, reject;

	when = require('when');
	delay = require('when/delay');
	resolved = when.resolve;
	reject = when.reject;

	function mapper(val) {
		return val * 2;
	}

	function deferredMapper(val) {
		return delay(mapper(val), Math.random()*10);
	}

	buster.testCase('when.map', {

		'should map input values array': function(done) {
			var input = [1, 2, 3];
			when.map(input, mapper).then(
				function(results) {
					assert.equals(results, [2,4,6]);
				},
				fail
			).ensure(done);
		},

		'should map input promises array': function(done) {
			var input = [resolved(1), resolved(2), resolved(3)];
			when.map(input, mapper).then(
				function(results) {
					assert.equals(results, [2,4,6]);
				},
				fail
			).ensure(done);
		},

		'should map mixed input array': function(done) {
			var input = [1, resolved(2), 3];
			when.map(input, mapper).then(
				function(results) {
					assert.equals(results, [2,4,6]);
				},
				fail
			).ensure(done);
		},

		'should map input when mapper returns a promise': function(done) {
			var input = [1,2,3];
			when.map(input, deferredMapper).then(
				function(results) {
					assert.equals(results, [2,4,6]);
				},
				fail
			).ensure(done);
		},

		'should accept a promise for an array': function(done) {
			when.map(resolved([1, resolved(2), 3]), mapper).then(
				function(result) {
					assert.equals(result, [2,4,6]);
				},
				fail
			).ensure(done);
		},

		'should resolve to empty array when input promise does not resolve to an array': function(done) {
			when.map(resolved(123), mapper).then(
				function(result) {
					assert.equals(result, []);
				},
				fail
			).ensure(done);
		},

		'should map input promises when mapper returns a promise': function(done) {
			var input = [resolved(1),resolved(2),resolved(3)];
			when.map(input, mapper).then(
				function(results) {
					assert.equals(results, [2,4,6]);
				},
				fail
			).ensure(done);
		},

		'should reject when input contains rejection': function(done) {
			var input = [resolved(1), reject(2), resolved(3)];
			when.map(input, mapper).then(
				fail,
				function(result) {
					assert.equals(result, 2);
				}
			).ensure(done);
		},

		'should propagate progress': function() {
			// Thanks @depeele for this test
			var input, ncall;

			input = [ _resolver(1), _resolver(2), _resolver(3) ];
			ncall = 0;

			return when.map(input).then(
				function(){
					assert.equals(ncall, 6);
				},
				fail,
				function(){
					ncall++;
				}
			);

			function _resolver(id)
			{
				var p = when.defer();

				setTimeout(function() {
					var loop, timer;

					loop = 0;
					timer = setInterval(function () {
						p.notify(id);
						loop++;
						if (loop === 2) {
							clearInterval(timer);
							p.resolve(id);
						}
					}, 1);
				}, 0);

				return p.promise;
			}
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
