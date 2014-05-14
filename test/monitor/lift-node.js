require('../../monitor/console');
var node = require('../../node');

function test() {
	throw new Error('fail');
}

var f = node.lift(test);

f();