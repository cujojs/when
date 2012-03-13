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
define(['./when'], function(when) {

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

        // Add a cancel method to the deferred to reject the original
        // with the special canceled indicator.
        deferred.cancel = function() {
            deferred.reject(canceled);
        };

        // Setup a rejection handler that will run before all others to
        // detect the canceled indicator and run the provided canceler
        // function if necessary.
        function cancelHandler(e) {
            d.reject(e === canceled ? canceler(deferred) : e);
        }

        // Replace deferred's promise with a promise that will always call canceler() first,
        // *if* deferred is canceled.  Can now safely give out deferred.promise
        var d = when.defer();

        deferred.then(d.resolve, cancelHandler, d.progress);

        deferred.promise = d.promise;

        // Also replace deferred.then to allow it to be called safely and
        // observe the cancellation
        deferred.then = d.promise.then;

        return deferred;
    };

});
})(typeof define == 'function'
    ? define
    : function (deps, factory) { typeof module != 'undefined'
        ? (module.exports = factory(require('./when')))
        : (this.when_cancelable = factory(this.when));
    }
    // Boilerplate for AMD, Node, and browser global
);


