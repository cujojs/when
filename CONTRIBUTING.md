# Contributing

Thank you for helping out with when.js! We really appreciate you investing your time in the project. Below, find information and guides on the best way to contribute.

Opening Issues
--------------

No software is truly without bugs, and if you find one we would love it if you let us know so we can patch it up for you. When opening an issue, make sure to use a clear, short title along with a thorough description of the problem so we can best understand it. It's extremely helpful if you provide concrete steps on how to replicate the issue so that we can isolate it and figure it out more quickly.

Pull Requests
-------------

There's nothing better than a great pull request. To ensure that yours gets accepted as quickly and smoothly as possible, make sure the following steps have been taken:

- Good clean commit messages. [This guide](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html) should help.
- A thorough description of what your code does in the description field
- Tests written for any features that have been added.

Running the Tests
-----------------

#### Node

Note that when.js includes the [Promises/A+ Test Suite](https://github.com/promises-aplus/promise-tests).  Running unit tests in Node will run both when.js's own test suite, and the Promises/A+ Test Suite.

1. `npm install`
2. `npm test`

#### Browsers

1. `npm install`
2. `npm start` - starts buster server & prints a url
3. Point browsers at <buster server url>/capture, e.g. `localhost:1111/capture`
4. `npm run test-browser`
