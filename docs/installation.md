Getting Started
===============

CommonJS and AMD are the primary targets for `when`, but instructions for a variety of setups are provided below.

#### AMD

1. Get it. `bower install when`, `yeoman install when`, or `git clone https://github.com/cujojs/when`

1. Configure your loader. When.js is AMD-compatible out of the box need for shims or anything. Below is an example of how configuring the package might look:

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
  define(['when', ...], function(when, ...) { ... });
  ```

#### Node

1. `npm install when`
1. `var when = require('when');`

#### RingoJS

1. `ringo-admin install cujojs/when`
1. `var when = require('when');`

#### Ender

1. `ender add when`
2. `var when = require('when');`

#### Legacy environments (via browserify)

1. `git clone https://github.com/cujojs/when`
1. `npm install`
1. `npm run browserify` to generate `build/when.js`
  1. Or `npm run browserify-debug` to build with [when/monitor/console](docs/api.md#debugging-promises) enabled
1. `<script src="path/to/when/build/when.js"></script>`
  1. `when` will be available as `window.when`
  1. Other modules will be available as sub-objects/functions, e.g. `window.when.fn.lift`, `window.when.sequence`.  See the [full sub-namespace list in the browserify build file](build/when.browserify.js)
