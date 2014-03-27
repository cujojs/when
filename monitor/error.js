/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

(function(define) { 'use strict';
define(function() {

	var parse, captureStack, format;

	if(Error.captureStackTrace) {
		// Use Error.captureStackTrace if available
		parse = function(e) {
			return e && e.stack && e.stack.split('\n');
		};

		format = formatAsString;
		captureStack = Error.captureStackTrace;

	} else {
		// Otherwise, do minimal feature detection to determine
		// how to capture and format reasonable stacks.
		parse = function(e) {
			var stack = e && e.stack && e.stack.split('\n');
			if(stack && e.message) {
				stack.unshift(e.message);
			}
			return stack;
		};

		(function() {
			var e = new Error();
			if(typeof e.stack !== 'string') {
				format = formatAsString;
				captureStack = captureSpiderMonkeyStack;
			} else {
				format = formatAsErrorWithStack;
				captureStack = useStackDirectly;
			}
		}());
	}

	function createLongTrace(traceChain, stackFilter, stackJumpSeparator) {
		var seen = {};
		var longTrace = [];
		var separator = null;
		var stack;

		// Basically foldr
		while(traceChain) {
			stack = parse(traceChain.error || traceChain);

			if (stack) {
				stack = getFilteredFrames(stackFilter, seen, stack);
				appendTrace(longTrace, stack, separator);
			} else {
				longTrace.push(''+traceChain);
			}

			separator = stackJumpSeparator;
			traceChain = traceChain.next;
		}

		return longTrace;
	}

	function appendTrace(longTrace, stack, separator) {
		if (stack.length > 1) {
			if(separator) {
				stack[0] = separator;
			}
			longTrace.push.apply(longTrace, stack);
		}
	}

	function getFilteredFrames(stackFilter, seen, stack) {
		var filtered = stack.slice(0, 1);

		for(var frame, i = 1; i < stack.length; ++i) {
			frame = stack[i];
			if (!(seen[frame] || stackFilter.test(frame))) {
				seen[frame] = true;
				filtered.push(frame);
			}
		}

		return filtered;
	}

	function captureSpiderMonkeyStack(host) {
		try {
			throw new Error();
		} catch(err) {
			host.stack = err.stack;
		}
	}

	function useStackDirectly(host) {
		host.stack = new Error().stack;
	}

	function formatAsString(longTrace) {
		return join(longTrace);
	}

	function formatAsErrorWithStack(longTrace) {
		var e = new Error();
		e.stack = formatAsString(longTrace);
		return e;
	}

	// About 5-10x faster than String.prototype.join o_O
	function join(a) {
		var sep = false;
		var s = '';
		for(var i=0; i< a.length; ++i) {
			if(sep) {
				s += '\n' + a[i];
			} else {
				s+= a[i];
				sep = true;
			}
		}
		return s;
	}

	return {
		parse: parse,
		format: format,
		captureStack: captureStack,
		createLongTrace: createLongTrace
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(); }));
