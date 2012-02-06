// Test boilerplate
var buster, assert, refute, when;

if (typeof require != "undefined") {
	buster = require("buster");
	when = require('../when');
}

assert = buster.assert;
refute = buster.refute;

// end boilerplate
var fakePromise, undef;

fakePromise = {
    then:function () {}
};

function assertIsPromise(it) {
    assert(when.isPromise(it));
}

function assertIsNotPromise(it) {
    refute(when.isPromise(it));
}

buster.testCase('when.isPromise', {
    'should return true for promise': function() {
        assertIsPromise(fakePromise);
    },

    'should return false for non-promise': function() {
        [
            1,
            0,
            'not a promise',
            true,
            false,
            undef,
            null,
            '',
            /foo/,
            {},
            new Object(),
            new RegExp('foo'),
            new Date(),
            new Boolean(),
            [],
            new Array()
        ].forEach(assertIsNotPromise);
    },
    
    'should return true for delegated promise': function() {
        function T() {}

        T.prototype = fakePromise;
        assertIsPromise(new T());
    }
});
