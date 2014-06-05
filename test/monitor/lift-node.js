//require('../../monitor/console');
var node = require('../../node');

function test(cb) {
	throw new Error('fail');
//	cb(new Error('fail'));
}

var f = node.lift(test);

f();