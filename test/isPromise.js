// Test boilerplate
var buster, when;

buster = require('buster');
when = require('../when');
// end boilerplate

var fakePromise, undef;

fakePromise = {
    then:function () {}
};

function assertIsPromise(it) {
    buster.assert(when.isPromise(it));
}

function assertIsNotPromise(it) {
    buster.refute(when.isPromise(it));
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
