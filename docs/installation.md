Getting Started
===============

[CJS](http://wiki.commonjs.org/wiki/CommonJS) and [AMD](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition) are the primary targets for `when`, but instructions for a variety of setups are provided below.

As of version 3.0, when.js requires an ES5 environment.  In older environments, use an ES5 shim such as [poly](https://github.com/cujojs/poly) or [es5-shim](https://github.com/es-shims/es5-shim)

#### RaveJS

If you're already using [RaveJS](https://github.com/RaveJS/rave), just install when.js and start coding:

1. `npm install --save when` or `bower install --save when`
1. `var when = require('when');`

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

  	// your code...
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

If you prefer not to use an AMD or CommonJS loader in your project, you can use a pre-built UMD module available in `dist/browser/when[.min|.debug].js` to have a global `when` available.

1. `npm install --save when`
1. `<script src="path/to/when/dist/browser/when.js"></script>`
  1. Or `<script src="path/to/when/dist/browser/when.min.js"></script>` for minified version
  1. Or `<script src="path/to/when/dist/browser/when.debug.js"></script>` with [when/monitor/console](api.md#debugging-promises) enabled 
1. `when` will be available as `window.when`
  1. Other modules will be available as sub-objects/functions, e.g. `window.when.fn.lift`, `window.when.sequence`.  See the [full sub-namespace list in the browserify build file](../build/when.browserify.js)

If you expose the whole `dist/browser` folder in your application (or make sure that `when[.min|.debug].js` has its corresponding `*.map` file available next to it), you will have the [source maps](https://developer.chrome.com/devtools/docs/javascript-debugging#source-maps) available for debugging in the browser.

#### Web Worker (via browserify)

Similarly to browser global environments:

1. `npm install --save when`
1. `importScripts('path/to/when/dist/browser/when.js');`
  1. Or `importScripts('path/to/when/dist/browser/when.min.js');` for minified version
  1. Or `importScripts('path/to/when/dist/browser/when.debug.js');` with [when/monitor/console](api.md#debugging-promises) enabled
1. `when` will be available as `self.when`
  1. Other modules will be available as sub-objects/functions, e.g. `self.when.fn.lift`, `self.when.sequence`.  See the [full sub-namespace list in the browserify build file](../build/when.browserify.js)
