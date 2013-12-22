
/**
 * A simple but secure lock system. Can only unlock using the return value
 * from lock.
 *
 * The locking system is quite simple. You can think of it like a door. The
 * first lock is considered "creating" the door and locking it. Every lock
 * after that is just like adding another lock to the door. Once you've removed
 * all the locks, that's like "destroying" the door.
 *
 * Locker emits 4 different events.
 *
 *  - "create":  triggered when you "create the door", i.e, when locking
 *               when the are no pre-existing locks.
 *
 *  - "up":      triggered every time you add a lock
 *
 *  - "destroy": triggered when you remove the last lock from the door
 *
 *  - "down":    triggered when you remove a lock
 *
 *
 * create and destroy and triggered before their up and down counter parts
 *
 *
 * Copyright (c) 2013 Parallax
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

 (function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['EventEmitter', 'heir'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(EventEmitter, heir);
    } else {
        root.Locker = factory(root.EventEmitter, root.heir);
    }
 }(this, function(EventEmitter, heir) {

    'use strict';

    var Locker = function() {

        /**
         * If we haven't called it using new, fix that.
         */
        if (!(this instanceof Locker)) {
            return new Locker();
        }

        /**
         * Because of the way that javascript evaluates variables, only
         * objects are passed-by-reference, which means we'll have to wrap our
         * lock count in an object to share it between methods, but still
         * keep it private.
         *
         * @type {Object}
         */
        var countObject = { count: 0 };

        /**
         * We'll need to generate versions of our methods that are bound to
         * this object.
         */
        this.lock = this.lock.bind(this, countObject);
        this.get = this.get.bind(this, countObject);
    };

    /**
     * We'll use EventEmitter to let the outside world know about our
     * locks.
     */
    heir.inherit(EventEmitter, Locker);

    /**
     * This function gets the count
     *
     * @param  {Object} countObject The countObject we bound in the constructor
     * @return {Number}             The count of locks we have
     */
    Locker.prototype.get = function(countObject) {
        return countObject.count;
    };

    /**
     * This function checks if we're currently locked.
     *
     * @return {Boolean} Are we currently locked?
     */
    Locker.prototype.isLocked = function() {
        return this.get() !== 0;
    };

    /**
     * This function generates a lock. The return value is the only thing
     * that can be used to "unlock" the lock.
     * @param  {Object}   countObject The countObject we bound in our
     *                                constructor
     * @return {Function}             The function used to "unlock"
     */
    Locker.prototype.lock = function(countObject) {
        /**
         * If the current lock count is 0, we've "created" a new door.
         * @type {Boolean}
         */
        var created = !countObject.count;

        /**
         * Increment the count
         * @type {Number}
         */
        countObject.count = countObject.count + 1;

        /**
         * If this was the first call, trigger the create event
         */
        if (created) {
            this.trigger('create');
        }

        /**
         * Trigger the up event
         */
        this.trigger('up');

        /**
         * This variables holds if the unlock method has been used before, as
         * unlocks only apply to the lock it was created for. Can't just use
         * it to unlock another lock. Think of it like keys, only one key will
         * work for one key.
         * @type {Boolean}
         */
        var used = false;

        /**
         * This function is used to unlock the lock. It can only be used
         * once and is the only way to unlock it.
         */
        return function() {
            /**
             * If we've used this unlock before, don't use it again.
             */
            if (used) {
                return;
            }

            /**
             * Say that we've used this  method before before
             * @type {Boolean}
             */
            used = true;

            /**
             * Decrement the lock count
             * @type {Number}
             */
            countObject.count = countObject.count - 1;

            /**
             * If we have no locks left, trigger the destroy method
             */
            if (!countObject.count) {
                this.trigger('destroy');
            }

            /**
             * Trigger the down method
             */
            this.trigger('down');
        }.bind(this);
    };

    return Locker;
});