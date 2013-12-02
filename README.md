<a href="http://promises-aplus.github.com/promises-spec"><img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png" alt="Promises/A+ logo" align="right" /></a>

[![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when) 

# when.js

When.js is cujoJS's lightweight [Promises/A+](http://promises-aplus.github.com/promises-spec) and `when()` implementation that powers the async core of [wire.js](https://github.com/cujojs/wire), cujoJS's IOC Container.  It features:

* A rock solid, battle-tested Promise implementation
* Resolving, settling, mapping, and reducing arrays of promises
* Executing tasks in parallel and sequence
* Transforming Node-style and other callback-based APIs into promise-based APIs

It passes the [Promises/A+ Test Suite](https://github.com/promises-aplus/promises-tests), is [very fast](https://github.com/cujojs/promise-perf-tests#test-results) and compact, and has no external dependencies.

- [What's new](CHANGES.md)
- [API docs](docs/api.md#api)
- [Examples](https://github.com/cujojs/when/wiki/Examples)
- [More info on the wiki](https://github.com/cujojs/when/wiki)

Quick Start
-----------

#### AMD

1. Get it
	- `bower install when` or `yeoman install when`, *or*
	- `git clone https://github.com/cujojs/when` or `git submodule add https://github.com/cujojs/when`
1. Configure your loader with a package:

	```js
	packages: [
		{ name: 'when', location: 'path/to/when/', main: 'when' },
		// ... other packages ...
	]
	```

1. `define(['when', ...], function(when, ...) { ... });` or `require(['when', ...], function(when, ...) { ... });`

#### Node

1. `npm install when`
1. `var when = require('when');`

#### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

#### Ender

1. `ender add cujojs/when`
2. `var when = require('when');`

#### Legacy environments (via browserify)

1. `git clone https://github.com/cujojs/when`
1. `npm install`
1. `npm run browserify` to generate `build/when.js`
	1. Or `npm run browserify-debug` to build with [when/monitor/console](docs/api.md#debugging-promises) enabled
1. `<script src="path/to/when/build/when.js"></script>`
	1. `when` will be available as `window.when`
	1. Other modules will be available as sub-objects/functions, e.g. `window.when.fn.lift`, `window.when.sequence`.  See the [full sub-namespace list in the browserify build file](build/when.browserify.js)

Running the Unit Tests
----------------------

#### Node

Note that when.js includes the [Promises/A+ Test Suite](https://github.com/promises-aplus/promise-tests).  Running unit tests in Node will run both when.js's own test suite, and the Promises/A+ Test Suite.

1. `npm install`
2. `npm test`

#### Browsers

1. `npm install`
2. `npm start` - starts buster server & prints a url
3. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
4. `npm run-script test-browser`

References
----------

Much of this code was inspired by the async innards of [wire.js](https://github.com/cujojs/wire), and has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
