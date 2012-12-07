# when.js [![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when)

When.js is cujojs's lightweight [CommonJS](http://wiki.commonjs.org/wiki/Promises) [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) and `when()` implementation, derived from the async core of [wire.js](https://github.com/cujojs/wire), cujojs's IOC Container.  It also provides several other useful Promise-related concepts, such as joining multiple promises, mapping and reducing collections of promises, timed promises, and has a robust [unit test suite](#running-the-unit-tests).

It passes the [Promises/A Test Suite](https://github.com/domenic/promise-tests), is [frighteningly fast](https://github.com/cujojs/promise-perf-tests#test-results), and is **under 1.3k** when compiled with Google Closure (w/advanced optimizations) and gzipped, and has no dependencies.

# What's New?

### 1.7.1

* Removed leftover internal usages of `deferred.then`.
* [when/debug](https://github.com/cujojs/when/wiki/when-debug) allows configuring the set of "fatal" error types that will be rethrown to the host env.

### 1.7.0

* **DEPRECATED:** `deferred.then` [is deprecated](when/blob/master/docs/api.md#deferred) and will be removed in an upcoming release.  Use `deferred.promise.then` instead.
* [promise.yield](when/blob/master/docs/api.md#yield)(promiseOrValue) convenience API for substituting a new value into a promise chain.
* [promise.spread](when/blob/master/docs/api.md#spread)(variadicFunction) convenience API for spreading an array onto a fulfill handler that accepts variadic arguments. [Mmmm, buttery](http://s.shld.net/is/image/Sears/033W048977110001_20100422100331516?hei=1600&wid=1600&op_sharpen=1&resMode=sharp&op_usm=0.9,0.5,0,0)
* Doc improvements:
	* [when()](when/blob/master/docs/api.md#when) and [promise.then()](when/blob/master/docs/api.md#main-promise-api) have more info about callbacks and chaining behavior.
	* More info and clarifications about the roles of [Deferred](when/blob/master/docs/api.md#deferred) and [Resolver](when/blob/master/docs/api.md#resolver)
	* Several minor clarifications for various APIs
* Internal improvements to assimilation and interoperability with other promise implementations.

### 1.6.1

* Fix for accidental coercion of non-promises. See [#62](https://github.com/cujojs/when/issues/60).

### 1.6.0

* New [when.join](when/blob/master/docs/api.md#whenjoin) - Joins 2 or more promises together into a single promise.
* [when.some](when/blob/master/docs/api.md#whensome) and [when.any](when/blob/master/docs/api.md#whenany) now act like competitive races, and have generally more useful behavior.  [Read the discussion in #60](https://github.com/cujojs/when/issues/60).
* *Experimental* progress event propagation.  Progress events will propagate through promise chains. [Read the details here](when/blob/master/docs/api.md#progress-events).
* *Temporarily* removed calls to `Object.freeze`. Promises are no longer frozen due to a horrendous v8 performance penalty.  [Read discussion here](https://groups.google.com/d/topic/cujojs/w_olYqorbsY/discussion).
	* **IMPORTANT:** Continue to treat promises as if they are frozen, since `freeze()` will be reintroduced once v8 performance improves.
* [when/debug](https://github.com/cujojs/when/wiki/when-debug) now allows setting global a debugging callback for rejected promises.

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
