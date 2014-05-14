require('../../monitor/console');
var node = require('../../node');
var Promise = require('bluebird');

function test() {
	throw new Error('fail');
}

//var f = Promise.promisify(test);
var f = node.lift(test);

f();