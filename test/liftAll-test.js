(function(buster, define) {

	var assert, refute, fail, sentinel;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	sentinel = {};

	define('when.liftAll-test', function (require) {

		var liftAll = require('when/lib/liftAll');

		function lift(f) {
			return function() {
				return f.apply(this, arguments);
			};
		}

		buster.testCase('when/lib/liftAll', {

			'should call lift for src own methods': function() {
				var src = { a: this.spy(), b: this.spy() };
				var dst = liftAll(lift, void 0, void 0, src);

				dst.a(1);
				dst.b(2);

				assert.calledOnceWith(src.a, 1);
				assert.calledOnceWith(src.b, 2);
			},

			'should not call lift for non-functions': function() {
				var src = { a: this.spy(), c: sentinel };
				var dst = liftAll(lift, void 0, void 0, src);

				assert.same(dst.c, sentinel);
			},

			'when dst not provided': {
				'and src is an object': {
					'should lift onto Object.create(src)': function() {
						var src = { a: this.spy(), b: sentinel };
						var dst = liftAll(lift, void 0, void 0, src);

						refute.same(src, dst);
						assert.isObject(dst);
						assert.same(dst.b, sentinel);
						assert(dst.hasOwnProperty('a'));
						refute(dst.hasOwnProperty('b'));
					}
				},
				'and src is a function': {
					'should lift onto a "copy" of src': function() {
						var src = this.spy();
						src.a = this.spy();
						var dst = liftAll(lift, void 0, void 0, src);

						refute.same(src, dst);
						assert.isFunction(dst);
						assert(dst.hasOwnProperty('a'));

						dst.a();
						assert.calledOnce(src.a);
					}
				}
			},

			'when dst is provided': {
				'when dst is an object': {
					'should lift onto dst': function() {
						var src = { a: function(){}, b: sentinel };
						var d = {};
						var dst = liftAll(lift, void 0, d, src);

						assert.same(dst, d);
					}
				},
				'when dst is a function': {
					'should lift onto dst': function() {
						var src = { a: function(){}, b: sentinel };
						var d = function(){};
						var dst = liftAll(lift, void 0, d, src);

						assert.same(dst, d);
					}
				}
			},

			'when combine is provided': {
				'should call combine for all src own methods': function() {
					function addKey(o, f, k) {
						o[k+'Test'] = f;
						return o;
					}

					var src = { a: this.spy(), b: this.spy() };
					var dst = liftAll(lift, addKey, void 0, src);

					dst.aTest(1);
					assert.calledOnceWith(src.a, 1);
					assert.isFunction(dst.a);
					refute(dst.hasOwnProperty('a'));

					dst.bTest(2);
					assert.calledOnceWith(src.b, 2);
					assert.isFunction(dst.b);
					refute(dst.hasOwnProperty('b'));
				}
			}

		});

	});

}(this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
	var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
	pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
	factory(function (moduleId) {
		return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
	});
}));
