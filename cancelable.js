/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * cancelable.js
 *
 * Decorator that makes a deferred "cancelable".  It adds a cancel() method that
 * will call a special cancel handler function and then reject the deferred.  The
 * cancel handler can be used to do resource cleanup, or anything else that should
 * be done before any other rejection handlers are executed.
 *
 * Usage:
 *
 * var cancelableDeferred = cancelable(when.defer(), myCancelHandler);
 *
 * @author brian@hovercraftstudios.com
 */

(function(define) {
define(function() {

    // private flag to indicate that a rejection is actually a cancel
    var canceled = {};

    /**
     * Makes deferred cancelable, adding a cancel() method.
     *
     * @param deferred {Deferred} the {@link Deferred} to make cancelable
     * @param canceler {Function} cancel handler function to execute when this deferred is canceled.  This
     * is guaranteed to run before all other rejection handlers.  The canceler will NOT be executed if the
     * deferred is rejected in the standard way, i.e. deferred.reject().  It ONLY executes if the deferred
     * is canceled, i.e. deferred.cancel()
     *
     * @returns deferred, with an added cancel() method.
     */
    return function(deferred, canceler) {

        // Add a cancel method to the deferred
        deferred.cancel = function() {
            deferred.reject(canceled);
        };

        // Replace deferred's promise with a promise that will always call canceler() first, *if*
        // deferred is canceled.  Can now safely give out deferred.promise
        deferred.promise = deferred.then(null,
            function cancelHandler(e) {
                throw e === canceled ? canceler(deferred) : e;
            });

        // Replace deferred.then to allow it to be called safely and observe the cancellation
        deferred.then = deferred.promise.then;

        return deferred;
    };

});
})(typeof define == 'function'
    ? define
    : function (factory) { typeof module != 'undefined'
        ? (module.exports = factory())
        : (this.when_cancelable = factory());
    }
    // Boilerplate for AMD, Node, and browser global
);


