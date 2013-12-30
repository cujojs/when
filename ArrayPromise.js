/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	var bind, uncurryThis, slice, Promise, cast;

	Promise = require('./Promise');
	cast = Promise.cast;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	slice = uncurryThis(Array.prototype.slice);

	function ArrayPromise(/*resolver, status*/) {
		Promise.apply(this, arguments);
	}

	ArrayPromise.of = function(x) {
		return resolve([x]);
	};

	ArrayPromise.cast = function(x) {
		return x instanceof ArrayPromise ? x : resolve(x);
	};

	ArrayPromise.empty = function() {
		return ArrayPromise.resolve([]);
	};

	ArrayPromise.resolve = resolve;
	function resolve(x) {
		return new ArrayPromise(function(resolve) {
			resolve(x);
		});
	}

	ArrayPromise.reject = Promise.reject;

	ArrayPromise.prototype = Object.create(Promise.prototype);
	ArrayPromise.prototype.constructor = ArrayPromise;

	ArrayPromise.prototype.all = function() {
		var self = this;
		return new ArrayPromise(function(resolve, reject, notify) {
			return self.then(function(array) {
				var results, toResolve;

				results = [];

				if(array.length === 0) {
					resolve(results);
					return;
				}

				toResolve = 0;

				array.forEach(function(x, i) {
					++toResolve;
					cast(x).then(resolveOne(x, i), reject, notify);
				});

				function resolveOne(x, i) {
					results[i] = x;

					if(--toResolve === 0) {
						resolve(results);
					}
				}
			});
		});
	};

	ArrayPromise.prototype.settle = function() {
		return this.then(function(array) {
			return array.map(function(x) {
				return cast(x).inspect();
			});
		});
	};

	ArrayPromise.prototype.any = function() {};

	ArrayPromise.prototype.race = function() {
		var self = this;
		return new ArrayPromise(function(resolve, reject) {
			return self.then(function(array) {
				array.forEach(function(x) {
					cast(x).then(resolve, reject);
				});
			});
		});
	};

	ArrayPromise.prototype.spread = function(onFulfilled) {
		return this.all().then(function(array) {
			return onFulfilled.apply(void 0, array);
		});
	};

	ArrayPromise.prototype.map = function(f) {
		return this.then(function(a) {
			return a.map(f);
		});
	};

	ArrayPromise.prototype.flatMap = function(f) {
		return this.reduceRight(function(result, x) {
			return f(x).concat(result);
		}, ArrayPromise.empty());
	};

	ArrayPromise.prototype.reduce = function(f, initial) {
		return this.then(function(a) {
			return a.reduce(function(result, x) {
				return cast(result).then(function(r) {
					return cast(x).then(function(x) {
						return f(r, x);
					});
				});
			}, resolve(initial));
		});
	};

	ArrayPromise.prototype.reduceRight = function(f, initial) {
		return this.then(function(a) {
			return a.reduceRight(function(result, x) {
				return cast(result).then(function(r) {
					return cast(x).then(function(x) {
						return f(r, x);
					});
				});
			}, resolve(initial));
		});
	};

	ArrayPromise.prototype.concat = function(a) {
		return this.then(function(b) {
			return a.then(function(a) {
				return a.concat(b);
			});
		});
	};

	ArrayPromise.prototype.join = function(separator) {
		return this.then(function(a) {
			return a.join(separator);
		});
	};

	ArrayPromise.prototype.slice = function() {
		var args = slice(arguments);
		return this.then(function(a) {
			return a.slice.apply(a, args);
		});
	};

	ArrayPromise.prototype.filter = function(predicate) {
		return this.all().then(function(a) {
			return a.filter(predicate);
		});
	};

	ArrayPromise.prototype.forEach = function(f) {
		return this.all().done(function(a) {
			a.forEach(f);
		});
	};

	ArrayPromise.prototype.find = function() {};
	ArrayPromise.prototype.findIndex = function() {};
	ArrayPromise.prototype.indexOf = function() {};
	ArrayPromise.prototype.lastIndexOf = function() {};

	return ArrayPromise;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
