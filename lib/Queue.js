module.exports = Queue;

function Queue(capacity) {
	this.head = this.tail = this.length = 0;
	this.buffer = new Array(capacity || 256);
}

Queue.prototype.push = function(x) {
	if(this.length === this.buffer.length) {
		this.ensureCapacity(this.length * 2);
	}

	this.buffer[this.tail] = x;
	this.tail = (this.tail + 1) & (this.buffer.length - 1);
	++this.length;
	return this.length;
};

Queue.prototype.shift = function() {
	if(this.length > 0) {
		var x = this.buffer[this.head];
		this.buffer[this.head] = void 0;
		this.head = (this.head + 1) & (this.buffer.length - 1);
		--this.length;
		return x;
	}
};

Queue.prototype.ensureCapacity = function(capacity) {
	var head = this.head;
	var buffer = this.buffer;
	var newBuffer = new Array(capacity);

	var i = 0;
	if(head === 0) {
		len = this.length;
		for(; i<len; ++i) {
			newBuffer[i] = buffer[i];
		}
	} else {
		capacity = buffer.length;
		var len = this.tail;
		for(; head<capacity; ++i, ++head) {
			newBuffer[i] = buffer[head];
		}

		for(head=0; head<len; ++i, ++head) {
			newBuffer[i] = buffer[head];
		}
	}

	this.buffer = newBuffer;
	this.head = 0;
	this.tail = this.length;
};