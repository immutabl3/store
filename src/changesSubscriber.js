import Subscriber from './subscriber';
import { uniq } from './utils';

export default class ChangesSubscriber extends Subscriber {
  constructor() {
    super();
    this.paths = [];
  }
  
  schedule(paths) {
    this.paths = this.paths.concat(paths);
    return super.schedule();
  }

  trigger(...args) {
    // TODO: regexp
    const roots = uniq(this.paths.map(path => path.replace(/^(.+?)\..*$/, '$1')));
    // TODO: why hang on to args?
    this.args = [roots];
    // TODO: remapping of trigger :S 
    Subscriber.prototype.trigger.apply(this, args);
    this.paths = [];
    this.args = [this.paths];
  }
};