module.exports = Queue;

function Queue(capacity) {
	this.head = this.tail = this.length = 0;
	this.buffer = new Array(nextpow2(capacity || 1));
}

Queue.prototype.push = function(x) {
	if(this.length === this.buffer.length) {
		this._ensureCapacity(this.length * 2);
	}

	this.buffer[this.tail] = x;
	this.tail = (this.tail + 1) & (this.buffer.length - 1);
	++this.length;
	return this.length;
};

Queue.prototype.shift = function() {
	var x = this.buffer[this.head];
	this.buffer[this.head] = void 0;
	this.head = (this.head + 1) & (this.buffer.length - 1);
	--this.length;
	return x;
};


Queue.prototype._ensureCapacity = function(capacity) {
	var head = this.head;
	var buffer = this.buffer;
	var newBuffer = new Array(nextpow2(capacity));
	var i = 0;
	var len;

	if(head === 0) {
		len = this.length;
		for(; i<len; ++i) {
			newBuffer[i] = buffer[i];
		}
	} else {
		capacity = buffer.length;
		len = this.tail;
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

function nextpow2(x) {
	x = x >>> 0;
	x = x - 1;
	x |= (x >> 1);
	x |= (x >> 2);
	x |= (x >> 4);
	x |= (x >> 8);
	x |= (x >> 16);
	return x + 1;
}