import signal from 'signal-js';
import proxyWatcher from './proxyWatcher';
import Scheduler from './Scheduler';

export default function Store(obj, {
  // should the transactions be handled asynchronously?
  asynchronous = true,
  // should the tree handle its transactions on its own?
  autoCommit = true,
  // should we debug the transactions?
  debug = false,
} = {}) {
  const emitter = signal();

  let scheduler;
  
  // creates a proxy and fires every time the proxy changes
  // with the changed paths
  const proxy = proxyWatcher(obj, path => {
    scheduler.add(path);
    autoCommit && scheduler.commit();
  });

  scheduler = Scheduler(proxy, emitter, asynchronous);

  return Object.assign(emitter, {
    data: proxy,
    // TODO: selectors/cursors
    select: () => {},
    commit: scheduler.commit,
    watch(listener, callback) {
      const selector = typeof listener === 'function' ? listener : () => listener;
      scheduler.watch(selector, callback);
      return this;
    },
    project(listener, callback) {
      const selector = typeof listener === 'function' ? listener : () => listener;
      scheduler.project(selector, callback);
      return this;
    },
  });
};