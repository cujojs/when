(function(buster, define) {

var assert, fail;

assert = buster.assert;
fail = buster.assertions.fail;

define('when/else-test', function (require) {

  var when = require('when'),
      input = {},
      sentinel = { value: 'sentinel' };

  buster.testCase('promise.else', {
    'should resolve normally if previous promise doesnt fail': function() {

      return when.resolve(input)
        ['else'](sentinel)
        .then(function(val) {
          assert.same(val, input);
        });
    },

    'should resolve with else value if previous promise fails': function() {

      return when.reject(input)
        ['else'](sentinel)
        .then(function(val) {
          assert.same(val, sentinel);
        });
    }
  });

});

}(
  this.buster || require('buster'),
  typeof define === 'function' && define.amd ? define : function (id, factory) {
    var packageName = id.split(/[\/\-\.]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
    pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
    factory(function (moduleId) {
      return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
    });
  }
  // Boilerplate for AMD and Node
));
