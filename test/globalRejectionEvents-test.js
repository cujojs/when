/*global process, window, setTimeout*/
var buster = typeof window !== 'undefined' ? window.buster : require('buster');

var CorePromise = require('../lib/Promise');

var sentinel = { value: 'sentinel' };

buster.testCase('global rejection events', {

	'on Node': {
		'tearDown': function() {
			if(typeof process === 'undefined') {
				return;
			}

			process.removeAllListeners('unhandledRejection');
			process.removeAllListeners('rejectionHandled');
		},

		'should emit unhandledRejection': function(done) {
			if(typeof window !== 'undefined') {
				buster.assert(true);
				return;
			}

			function listener(e) {
				buster.assert.same(e, sentinel);
				done();
			}

			process.on('unhandledRejection', listener);

			CorePromise.reject(sentinel);
		},

		'should emit rejectionHandled': function(done) {
			if(typeof window !== 'undefined') {
				buster.assert(true);
				return;
			}

			var r;
			function unhandled(e, rejection) {
				buster.assert.same(e, sentinel);
				r = rejection;
			}

			function handled(rejection) {
				buster.assert.same(rejection, r);
				done();
			}

			process.on('unhandledRejection', unhandled);
			process.on('rejectionHandled', handled);

			var p = CorePromise.reject(sentinel);
			setTimeout(function() {
				p.catch(function() {});
			}, 10);
		}
	},

	'in Browser': {
		'should emit unhandledRejection': function(done) {
			if(typeof window === 'undefined') {
				buster.assert(true);
				done();
				return;
			}

			function listener(e) {
				window.removeEventListener('unhandledRejection', listener, false);
				e.preventDefault();
				buster.assert.same(e.detail.reason, sentinel);
				done();
			}

			window.addEventListener('unhandledRejection', listener, false);

			CorePromise.reject(sentinel);
		},

		'should emit rejectionHandled': function(done) {
			if(typeof window === 'undefined') {
				buster.assert(true);
				done();
				return;
			}

			var key;
			function unhandled(e) {
				window.removeEventListener('unhandledRejection', unhandled, false);
				buster.assert.same(e.detail.reason, sentinel);
				key = e.detail.key;
			}

			function handled(e) {
				window.removeEventListener('rejectionHandled', handled, false);
				buster.assert.same(e.detail.key, key);
				done();
			}

			window.addEventListener('unhandledRejection', unhandled, false);
			window.addEventListener('rejectionHandled', handled, false);

			var p = CorePromise.reject(sentinel);
			setTimeout(function() {
				p.catch(function() {});
			}, 10);
		}
	}

});

