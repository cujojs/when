/** @license MIT License (c) copyright 2010-2014 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';

    function error(){
        throw new Error('error');
    }

    define(function(require) {

		require('../../monitor/console');

		var when = require('../../when');

			when.promise(function(resolve){
				resolve(123);
			}).then(function(){
				return 111;
			}).then(error);
    });
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));

