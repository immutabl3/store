import noop from 'lodash/noop';
import scheduler from './scheduler';

export default class Subscriber {
  constructor() {
    this.args = undefined;
    this.listeners = [];
    this.trigger = this.trigger.bind(this);
  }
  
  subscribe(listener) {
    if (this.listeners.indexOf(listener) >= 0) return noop;
    
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  schedule() {
    return scheduler.schedule(this.trigger);
  }

  trigger(...args) {
    const listenerArgs = args.length ? args : this.args || args;
    this.listeners.forEach(listener => listener(...listenerArgs));
  }
};