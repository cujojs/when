Getting Started
===============

[CJS](http://wiki.commonjs.org/wiki/CommonJS) and [AMD](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition) are the primary targets for `when`, but instructions for a variety of setups are provided below.

As of version 3.0, when.js requires an ES5 environment.  In older environments, use an ES5 shim such as [poly](https://github.com/cujojs/poly) or [es5-shim](https://github.com/es-shims/es5-shim)

#### AMD

1. Get it. `bower install --save when`, or `git clone https://github.com/cujojs/when`

1. Configure your loader. Here is an example of how configuring the package might look:

  ```js
  // using requirejs
  requirejs.config({
    packages: [
      { name: 'when', location: '/path/to/when', main: 'when' }
    ]
  });

  // using curl.js
  curl.config({
    packages: {
      when: { location: '/path/to/when', main: 'when' }
    }
  });
  ```

1. Load when wherever you need it. For example, as part of a module:

  ```
  define(function(require) {
  	var when = require('when');
  });
  ```

#### Node

1. `npm install --save when`
1. `var when = require('when');`

#### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

#### Ender

1. `ender add when`
2. `var when = require('when');`

#### Other CommonJS environments (eg vert.x 1.x and 2.x with CommonJS module support)

1. `git clone https://github.com/cujojs/when`
1. `var when = require('when');` or `var when = require('path/to/when');`

#### Browser environments (via browserify)

Since when.js primarily targets modular environments, it doesn't export to the global object (`window` in browsers) by default. You can create your own build of when.js using browserify, if you prefer not to use an AMD or CommonJS loader in your project.

1. `git clone https://github.com/cujojs/when`
1. `npm install`
1. `npm run browserify` to generate `build/when.js`
  1. Or `npm run browserify-debug` to build with [when/monitor/console](docs/api.md#debugging-promises) enabled
1. `<script src="path/to/when/build/when.js"></script>`
  1. `when` will be available as `window.when`
  1. Other modules will be available as sub-objects/functions, e.g. `window.when.fn.lift`, `window.when.sequence`.  See the [full sub-namespace list in the browserify build file](build/when.browserify.js)

#### Web Worker (via browserify)

Similarly to browser global environments:

1. `git clone https://github.com/cujojs/when`
1. `npm install`
1. `npm run browserify` to generate `build/when.js`
  1. Or `npm run browserify-debug` to build with [when/monitor/console](docs/api.md#debugging-promises) enabled
1. `importScripts('path/to/when/build/when.js');`
  1. `when` will be available as `self.when`
  1. Other modules will be available as sub-objects/functions, e.g. `self.when.fn.lift`, `self.when.sequence`.  See the [full sub-namespace list in the browserify build file](build/when.browserify.js)
