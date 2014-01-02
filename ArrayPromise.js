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

	var Promise, asPromise, resolvePromise,
		bind, uncurryThis, slice, map, reduce, reduceRight;

	Promise = require('./Promise');
	asPromise = Promise.cast;
	resolvePromise = Promise.resolve;

	bind = Function.prototype.bind;
	uncurryThis = bind.bind(bind.call);
	slice = uncurryThis(Array.prototype.slice);
	map = uncurryThis(Array.prototype.map);
	reduce = uncurryThis(Array.prototype.reduce);
	reduceRight = uncurryThis(Array.prototype.reduceRight);

	function ArrayPromise(resolver) {
		/*jshint unused:false*/
		Promise.apply(this, arguments);
	}

	ArrayPromise.of = function(x) {
		return resolve([x]);
	};

	ArrayPromise.empty = function() {
		return resolve([]);
	};

	ArrayPromise.cast = asArrayPromise;
	function asArrayPromise(x) {
		return x instanceof ArrayPromise ? x : resolve(x);
	}

	ArrayPromise.resolve = resolve;
	function resolve(x) {
		return new ArrayPromise(function(resolve) {
			resolve(slice(x));
		});
	}

	ArrayPromise.reject = Promise.reject;

	ArrayPromise.unfold = unfold;
	ArrayPromise.iterate = iterate;

	ArrayPromise.prototype = Object.create(Promise.prototype);
	ArrayPromise.prototype.constructor = ArrayPromise;

	ArrayPromise.prototype.all = function() {
		return this.then(Promise.all);
	};

	ArrayPromise.prototype.settle = function() {
		return this.then(Promise.settle);
	};

	ArrayPromise.prototype.any = function() {
		return this.then(Promise.any);
	};

	ArrayPromise.prototype.some = function(n) {
		return this.then(function(array) {
			return Promise.some(array, n);
		});
	};

	ArrayPromise.prototype.race = function() {
		return this.then(Promise.race);
	};

	ArrayPromise.prototype.spread = function(onFulfilled) {
		return this.all().then(function(array) {
			return onFulfilled.apply(void 0, array);
		});
	};

	ArrayPromise.prototype.map = function(f) {
		return this.then(function(a) {
			return map(a, function(x) {
				return resolvePromise(x).map(f);
			});
		});
	};

	ArrayPromise.prototype.flatMap = function(f) {
		return this.reduceRight(function(result, x) {
			return f(x).concat(result);
		}, ArrayPromise.empty());
	};

	ArrayPromise.prototype.foldl = function(f, initial) {
		return this.then(function(a) {
			return reduce(a, function(result, x, i) {
				return asPromise(result).then(function(r) {
					return asPromise(x).then(function(x) {
						return f(r, x, i);
					});
				});
			}, asPromise(initial));
		});
	};

	ArrayPromise.prototype.foldl1 = function(f) {
		return this.then(function(a) {
			return reduce(a, function(result, x, i) {
				return asPromise(result).then(function(r) {
					return asPromise(x).then(function(x) {
						return f(r, x, i);
					});
				});
			});
		});
	};

	ArrayPromise.prototype.reduce = function(f /*, initialValue */) {
		return arguments.length > 1 ? this.foldl(f, arguments[1]) : this.foldl1(f);
	};

	ArrayPromise.prototype.foldr = function(f, initial) {
		return this.then(function(a) {
			return reduceRight(a, function(result, x, i) {
				return asPromise(result).then(function(r) {
					return asPromise(x).then(function(x) {
						return f(r, x, i);
					});
				});
			}, asPromise(initial));
		});
	};

	ArrayPromise.prototype.foldr1 = function(f) {
		return this.then(function(a) {
			return reduceRight(a, function(result, x, i) {
				return asPromise(result).then(function(r) {
					return asPromise(x).then(function(x) {
						return f(r, x, i);
					});
				});
			});
		});
	};

	Array.prototype.reduceRight = function(f /*, initialValue */) {
		return arguments.length > 1 ? this.foldr(f, arguments[1]) : this.foldr1(f);
	};

	ArrayPromise.prototype.concat = function(tail) {
		return this.then(function(head) {
			return tail.then(function(tail) {
				return head.concat(tail);
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

	ArrayPromise.prototype.find = function(predicate) {
		return resolvePromise(find(predicate, this)).then(value);
	};

	ArrayPromise.prototype.findIndex = function(predicate) {
		return resolvePromise(find(predicate, this)).then(index);
	};

	ArrayPromise.prototype.indexOf = function(x) {
		return this.findIndex(function(y) {
			return y === x;
		});
	};

	ArrayPromise.prototype.lastIndexOf = function(y) {
		var found;
		return resolvePromise(this.then(function(a) {
			return reduceRight(a, function(_, x, i) {
				return asPromise(x).then(function(x) {
					if(y === x) {
						found = true;
						return Promise.reject(i);
					}
					return _;
				}, identity);
			}, void 0);

		}).catch(function(x) {
			if(found) {
				return x;
			}
			throw x;
		}));
	};

	function find(predicate, ap) {
		var found;
		return ap.then(function(a) {
			return reduce(a, function(_, x, i) {
				return asPromise(x).then(function(x) {
					if(predicate(x)) {
						found = true;
						return Promise.reject({ value: x, index: i });
					}
					return _;
				}, identity);
			}, void 0);
		}).catch(function(x) {
			if(found) {
				return x;
			}
			throw x;
		});
	}

	function value(x) {
		return x && x.value;
	}

	function index(x) {
		return x && x.index;
	}

	function unfold(generator, condition, seed) {
		var result = [];

		return asArrayPromise(Promise.unfold(generator, condition, append, seed)['yield'](result));

		function append(value, newSeed) {
			result.push(value);
			return newSeed;
		}
	}

	function iterate(generator, condition, seed) {
		var result = [];

		return asArrayPromise(Promise.iterate(generator, condition, append, seed)['yield'](result));

		function append(x) {
			result.push(x);
			return x;
		}
	}

	function identity(x) { return x; }

	return ArrayPromise;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
