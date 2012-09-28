/** @license MIT License (c) copyright B Cavalier & J Hann */

/*jshint devel: true*/
/*global console:true, setTimeout:true*/

/**
 * This is a drop-in replacement for the when module that sets up automatic
 * debug output for promises created or consumed by when.js.  Use this
 * instead of when to help with debugging.
 *
 * WARNING: This module **should never** be use this in a production environment.
 * It exposes details of the promise
 *
 * In an AMD environment, you can simply change your path or package mappings:
 *
 * paths: {
 *   // 'when': 'path/to/when/when'
 *   'when': 'path/to/when/debug'
 * }
 *
 * or
 *
 * packages: [
 *   // { name: 'when', location: 'path/to/when', main: 'when' }
 *   { name: 'when', location: 'path/to/when', main: 'debug' }
 * ]
 *
 * In a CommonJS environment, you can directly require this module where
 * you would normally require 'when':
 *
 * // var when = require('when');
 * var when = require('when/debug');
 *
 * Or you can temporarily modify the package.js to point main at debug.
 * For example, when/package.json:
 *
 * ...
 * "main": "./debug"
 * ...
 *
 * @author brian@hovercraftstudios.com
 */
(function(define) {
define(['./when'], function(when) {

	var promiseId, pending, exceptionsToRethrow, own, debugProp, undef;

	promiseId = 0;
	pending = {};
	own = Object.prototype.hasOwnProperty;
	debugProp = 'whendebug';

	exceptionsToRethrow = {
		RangeError: 1,
		ReferenceError: 1,
		SyntaxError: 1,
		TypeError: 1
	};

	/**
	 * Replacement for when() that sets up debug logging on the
	 * returned promise.
	 */
	function whenDebug() {
		return debugPromise(when.apply(null, wrapCallbacks(arguments)));
	}

	/**
	 * Setup debug output handlers for the supplied promise.
	 * @param p {Promise} A trusted (when.js) promise
	 * @return {Promise} a new promise that outputs debug info and
	 * has a useful toString
	 */
	function debugPromise(p, parent) {
		var id, origThen, newPromise, logReject;

		if(own.call(p, debugProp)) {
			return p;
		}

		promiseId++;
		id = (parent && 'id' in parent) ? (parent.id + '.' + promiseId) : promiseId;

		origThen = p.then;
		newPromise = beget(p);
		newPromise.id = id;
		newPromise.parent = parent;
		newPromise[debugProp] = true;

		newPromise.toString = function() {
			return toString('Promise', id);
		};

		newPromise.then = function(cb, eb) {
			if(typeof eb === 'function') {
				var promise = newPromise;
				do {
					promise.handled = true;
				} while((promise = promise.parent) && !promise.handled);
			}

			return debugPromise(origThen.apply(p, wrapCallbacks(arguments)), newPromise);
		};

		logReject = function() {
			console.error(newPromise.toString());
		};

		p.then(
			function(val) {
				newPromise.toString = function() {
					return toString('Promise', id, 'resolved', val);
				};
				return val;
			},
			wrapCallback(function(err) {
				newPromise.toString = function() {
					return toString('Promise', id, 'REJECTED', err);
				};

				if(!newPromise.handled) {
					logReject();
				}

				throw err;
			})
		);

		return newPromise;
	}

	/**
	 * Replacement for when.defer() that sets up debug logging
	 * on the created Deferred, its resolver, and its promise.
	 * @param [id] anything optional identifier for this Deferred that will show
	 * up in debug output
	 * @return {Deferred} a Deferred with debug logging
	 */
	function deferDebug() {
		var d, status, value, origResolve, origReject, origProgress, origThen, id;

		// Delegate to create a Deferred;
		d = when.defer();

		status = 'pending';
		value = pending;

		// if no id provided, generate one.  Not sure if this is
		// useful or not.
		id = arguments[arguments.length - 1];
		if(id === undef) {
			id = ++promiseId;
		}

		// Promise and resolver are frozen, so have to delegate
		// in order to setup toString() on promise, resolver,
		// and deferred
		origThen = d.promise.then;
		d.id = id;
		d.promise = debugPromise(d.promise, d);

		d.resolver = beget(d.resolver);
		d.resolver.toString = function() {
			return toString('Resolver', id, status, value);
		};

		origProgress = d.resolver.progress;
		d.progress = d.resolver.progress = function(update) {
			if(value !== pending) {
				alreadyResolved();
			}

			return origProgress(update);
		};

		origResolve = d.resolver.resolve;
		d.resolve = d.resolver.resolve = function(val) {
			if(value !== pending) {
				alreadyResolved();
			}

			value = val;
			status = 'resolving';
			return origResolve.apply(undef, arguments);
		};

		origReject = d.resolver.reject;
		d.reject = d.resolver.reject = function(err) {
			if(value !== pending) {
				alreadyResolved();
			}

			value = err;
			status = 'REJECTING';
			return origReject.apply(undef, arguments);
		};

		d.toString = function() {
			return toString('Deferred', id, status, value);
		};

		// Setup final state change handlers
		d.then(
			function(v) { status = 'resolved'; return v; },
			function(e) { status = 'REJECTED'; return when.reject(e); }
		);

		d.then = d.promise.then;

		// Add an id to all directly created promises.  It'd be great
		// to find a way to propagate this id to promise created by .then()
		d.resolver.id = id;

		// TODO: Should we still freeze these?
		// freeze(d.promise);
		// freeze(d.resolver);

		return d;
	}

	whenDebug.defer = deferDebug;
	whenDebug.isPromise = when.isPromise;

	// For each method we haven't already replaced, replace it with
	// one that sets up debug logging on the returned promise
	for(var p in when) {
		if(when.hasOwnProperty(p) && !(p in whenDebug)) {
			makeDebug(p, when[p]);
		}
	}

	return whenDebug;

	// Wrap result of when[name] in a debug promise
	function makeDebug(name, func) {
		whenDebug[name] = function() {
			return debugPromise(func.apply(when, arguments));
		};
	}

	// Wrap a promise callback to catch exceptions and log or
	// rethrow as uncatchable
	function wrapCallback(cb) {
		if(typeof cb != 'function') {
			return cb;
		}

		return function(v) {
			try {
				return cb(v);
			} catch(err) {
				throwUncatchableIfNecessary(err);
				
				throw err;
			}
		};
	}

	// Wrap a callback, errback, progressback tuple
	function wrapCallbacks(callbacks) {
		var cb, args, len, i;

		args = [];

		for(i = 0, len = callbacks.length; i < len; i++) {
			args[i] = typeof (cb = callbacks[i]) == 'function'
				? wrapCallback(cb)
				: cb;
		}

		return args;
	}

	// Stringify a promise, deferred, or resolver
	function toString(name, id, status, value) {
		var s = '[object ' + name + ' ' + id + ']';

		if(arguments.length > 2) {
			s += ' ' + status;
			if(value !== pending) {
				s += ': ' + value;
			}
		}

		return s;
	}

	function throwUncatchableIfNecessary(err) {
		if (err && err.name in exceptionsToRethrow) {
			setTimeout(function() {
				throw err;
			}, 0);
		}

	}

	// Helper to invoke when resolve/reject/progress is called on
	// an already-resolved deferred or resolver
	function alreadyResolved() {
		throw new Error('already completed');
	}

	// The usual Crockford
	function F() {}
	function beget(o) {
		F.prototype = o;
		o = new F();
		F.prototype = undef;

		return o;
	}

});
})(typeof define == 'function'
	? define
	: function (deps, factory) { typeof module != 'undefined'
		? (module.exports = factory(require('./when')))
		: (this.when      = factory(this.when));
	}
	// Boilerplate for AMD, Node, and browser global
);
