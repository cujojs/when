# when.js [![Build Status](https://secure.travis-ci.org/cujojs/when.png)](http://travis-ci.org/cujojs/when)

A lightweight [CommonJS](http://wiki.commonjs.org/wiki/Promises) [Promises/A](http://wiki.commonjs.org/wiki/Promises/A) and `when()` implementation.  It also provides several other useful Promise-related concepts, such as joining and chaining, and has a robust unit test suite.

It's **just over 1k** when compiled with Google Closure (w/advanced optimizations) and gzipped.

when.js was derived from the async core of [wire.js](https://github.com/cujojs/wire).

What's New?
===========

### 1.5.0

* Due to this [v8 performance problem with Object.freeze](http://stackoverflow.com/questions/8435080/any-performance-benefit-to-locking-down-javascript-objects), added configuration options for disabling [paranoid mode](when/blob/master/docs/api.md#paranoid-mode).  If you don't need the added safety, this can provide a significant performance gain in v8.

### 1.4.4

* Change UMD boilerplate to check for `exports` to avoid a problem with QUnit.  See [#54](https://github.com/cujojs/when/issues/54) for more info.

[Full Changelog](https://github.com/cujojs/when/wiki/Changelog)

Docs & Examples
===============

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

Running the Unit Tests
======================

Install [buster.js](http://busterjs.org/)

`npm install -g buster`

Run unit tests in Node:

1. `buster test -e node`

Run unit tests in Browsers (and Node):

1. `buster server` - this will print a url
2. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
3. `buster test` or `buster test -e browser`

References
----------

Much of this code was inspired by @[unscriptable](https://github.com/unscriptable)'s [tiny promises](https://github.com/unscriptable/promises), the async innards of [wire.js](https://github.com/cujojs/wire), and some gists [here](https://gist.github.com/870729), [here](https://gist.github.com/892345), [here](https://gist.github.com/894356), and [here](https://gist.github.com/894360)

Some of the code has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
