# when.js [![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when)

When.js is cujojs's lightweight [CommonJS](http://wiki.commonjs.org/wiki/Promises) [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) and `when()` implementation, derived from the async core of [wire.js](https://github.com/cujojs/wire), cujojs's IOC Container.  It also provides several other useful Promise-related concepts, such as joining multiple promises, mapping and reducing collections of promises, timed promises, and has a robust [unit test suite](#running-the-unit-tests).

It passes the [Promises/A Test Suite](https://github.com/domenic/promise-tests), is [frighteningly fast](https://github.com/cujojs/promise-perf-tests#test-results), and is **under 1.3k** when compiled with Google Closure (w/advanced optimizations) and gzipped, and has no dependencies.

# What's New?

### 1.6.1

* Fix for accidental coercion of non-promises. See [#62](https://github.com/cujojs/when/issues/60).

### 1.6.0

* New [when.join](when/blob/master/docs/api.md#whenjoin) - Joins 2 or more promises together into a single promise.
* [when.some](when/blob/master/docs/api.md#whensome) and [when.any](when/blob/master/docs/api.md#whenany) now act like competitive races, and have generally more useful behavior.  [Read the discussion in #60](https://github.com/cujojs/when/issues/60).
* *Experimental* progress event propagation.  Progress events will propagate through promise chains. [Read the details here](when/blob/master/docs/api.md#progress-events).
* *Temporarily* removed calls to `Object.freeze`. Promises are no longer frozen due to a horrendous v8 performance penalty.  [Read discussion here](https://groups.google.com/d/topic/cujojs/w_olYqorbsY/discussion).
	* **IMPORTANT:** Continue to treat promises as if they are frozen, since `freeze()` will be reintroduced once v8 performance improves. 
* [when/debug](https://github.com/cujojs/when/wiki/when-debug) now allows setting global a debugging callback for rejected promises.

### 1.5.2

* Integrate @domenic's [Promises/A Test Suite](https://github.com/domenic/promise-tests). Runs via `npm test`.
* No functional change

### 1.5.1

* Performance optimization for [when.defer](when/blob/master/docs/api.md#whendefer), up to 1.5x in some cases.
* [when/debug](https://github.com/cujojs/when/wiki/when-debug) can now log exceptions and rejections in deeper promise chains, in some cases, even when the promises involved aren't when.js promises.

### 1.5.0

* New task execution and concurrency management: [when/sequence](when/blob/master/docs/api.md#whensequence), [when/pipeline](when/blob/master/docs/api.md#whenpipeline), and [when/parallel](when/blob/master/docs/api.md#whenparallel).
* Performance optimizations for [when.all](when/blob/master/docs/api.md#whenall) and [when.map](when/blob/master/docs/api.md#whenmap), up to 2x in some cases.
* Options for disabling [paranoid mode](when/blob/master/docs/api.md#paranoid-mode) that provides a significant performance gain in v8 (e.g. Node and Chrome). See this [v8 performance problem with Object.freeze](http://stackoverflow.com/questions/8435080/any-performance-benefit-to-locking-down-javascript-objects) for more info.
* **Important:** `deferred` and `deferred.resolver` no longer throw when resolved/rejected multiple times.  They will return silently as if the they had succeeded.  This prevents parties to whom *only* the `resolver` has been given from using `try/catch` to determine the state of the associated promise.
	* For debugging, you can use the [when/debug](https://github.com/cujojs/when/wiki/when-debug) module, which will still throw when a deferred is resolved/rejected multiple times.

[Full Changelog](https://github.com/cujojs/when/wiki/Changelog)

# Docs & Examples

[API docs](when/blob/master/docs/api.md#api)

[More info on the wiki](https://github.com/cujojs/when/wiki)

[Examples](https://github.com/cujojs/when/wiki/Examples)

Quick Start
===========

### AMD

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. Configure your loader with a package:

	```javascript
	packages: [
		{ name: 'when', location: 'path/to/when/', main: 'when' },
		// ... other packages ...
	]
	```

1. `define(['when', ...], function(when, ...) { ... });` or `require(['when', ...], function(when, ...) { ... });`

### Script Tag

1. `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. `<script src="path/to/when/when.js"></script>`
1. `when` will be available as `window.when`

### Node

1. `npm install when`
1. `var when = require('when');`

### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

# Running the Unit Tests

## Node

Note that when.js includes @domenic's [Promises/A Test Suite](https://github.com/domenic/promise-tests).  Running unit tests in Node will run both when.js's own test suite, and the Promises/A Test Suite.

1. `npm install`
1. `npm test`

## Browsers

1. `npm install`
1. `npm start` - starts buster server & prints a url
1. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
1. `npm run-script test-browser`

References
----------

Much of this code was inspired by @[unscriptable](https://github.com/unscriptable)'s [tiny promises](https://github.com/unscriptable/promises), the async innards of [wire.js](https://github.com/cujojs/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)

Some of the code has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
