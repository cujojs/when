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

Installation
------------

#### AMD

Availble as `when` through [bower](http://bower.io) and [yeoman](https://github.com/yeoman/yo), or just clone the repo and load `when.js` from the root. When.js is AMD-compatible out of the box, so no need for shims.

#### CommonJS/Node

```
npm install when
```

[More help & other environments &raquo;](docs/installation.md)

Usage
-----

Promises can be used to help manage complex and/or nested callback flows in a simple manner. To get a better handle on how promise flows look and how they can be helpful, there are a couple examples below (using commonjs).

This first example will print `"hello world!!!!"` if all went well, or `"drat!"` if there was a problem. It also uses [rest](https://github.com/cujojs/rest) to make an ajax request to a (fictional) external service.

```js
var rest = require('rest');

fetchRemoteGreeting()
    .then(addExclamation)
    .catch(handleError)
    .done(function(greeting) {
        console.log(greeting);
    });

function fetchRemoteGreeting() {
    // returns a when.js promise for 'hello world'
    return rest('http://example.com/greeting');
}

function addExclamation(greeting) {
    return greeting + '!!!!'
}

function handleError(e) {
    return 'drat!';
}
```

The second example shows off the power that comes with when's promise logic. Here, we get an array of numbers from a remote source and reduce them. The example will print `150` if all went well, and if there was a problem will print a full stack trace.

```js
var when = require('when');
var rest = require('rest');

when.reduce(when.map(getRemoteNumberList(), times10), sum)
    .done(function(result) {
        console.log(result);
    });

function getRemoteNumberList() {
    // Get a remote array [1, 2, 3, 4, 5]
    return rest('http://example.com/numbers').then(JSON.parse);
}

function sum(x, y) { return x + y; }
function times10(x) {return x * 10; }
```

- For more examples, see [examples &raquo;](https://github.com/cujojs/when/wiki/Examples)
- For the full documentation see [api docs &raquo;](docs/api.md#api)

License
-------

Licensed under MIT. [See the license here &raquo;](LICENSE.txt)

Contributing
------------

Please see the [contributing guide](CONTRIBUTING.md) for more information on running tests, opening issues, and contributing code to the project.

References
----------

Much of this code was inspired by the async innards of [wire.js](https://github.com/cujojs/wire), and has been influenced by the great work in [Q](https://github.com/kriskowal/q), [Dojo's Deferred](https://github.com/dojo/dojo), and [uber.js](https://github.com/phiggins42/uber.js).
