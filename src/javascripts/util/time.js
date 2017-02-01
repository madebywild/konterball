/**
 * Implementation of JS setTimeout and setInterval functions. The core
 * difference is that there is a custom step function that the user can choose
 * to call or not to call.  Useful for animation loops that are paused when the
 * tab is inactive, so that timeouts and intervals are paused too. When an
 * interval (or more) are missed, only one interval will be fired, but it will
 * continue from the next interval on.
 */

import randomstring from 'randomstring';

export default class Time {
  constructor() {
    this.timeouts = {};
    this.intervals = {};
  }

  setTimeout(callback, delay) {
    let key = randomstring.generate({length: 32});
    while (key in this.timeouts) {
      key = randomstring.generate({length: 32});
    }
    this.timeouts[key] = {
      callback,
      delay: Date.now() + delay,
    };
    return key;
  }

  setInterval(callback, interval) {
    let key = randomstring.generate({length: 32});
    while (key in this.intervals) {
      key = randomstring.generate({length: 32});
    }
    this.intervals[key] = {
      callback,
      interval,
      next: Date.now() + interval,
    };
    return key;
  }

  clearTimeout(key) {
    delete this.timeouts[key];
  }

  clearInterval(key) {
    delete this.intervals[key];
  }

  step() {
    const now = Date.now();
    Object.keys(this.timeouts).forEach(key => {
      if (now >= this.timeouts[key].delay) {
        this.timeouts[key].callback();
        delete this.timeouts[key];
      }
    });

    Object.keys(this.intervals).forEach(key => {
      if (now >= this.intervals[key].next) {
        this.intervals[key].callback();
        while (this.intervals[key] && now >= this.intervals[key].next) {
          this.intervals[key].next += this.intervals[key].interval;
        }
      }
    });
  }
}
