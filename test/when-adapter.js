"use strict";

var when = require("../when");

exports.fulfilled = when.resolve;
exports.rejected = when.reject;

exports.pending = function () {
    var deferred = when.defer();

    return {
        promise: deferred.promise,
        fulfill: deferred.resolve,
        reject: deferred.reject
    };
};
