import proxyWatcher, { observe } from './proxyWatcher/index.js';
import Schedule from './Schedule.js';
import Dispatcher from './Dispatcher.js';
import locker from './locker.js';
import Cursor from './Cursor/index.js';
import Emitter from './Emitter.js';

export default function Store(obj, {
  // should the transactions be handled asynchronously?
  asynchronous = true,
  // should the store handle its transactions on its own?
  autoCommit = true,
  // should the autoCommit emit quickly or slowly?
  fast = false,
  // if the debugger is passed, we'll initialize it
  debug,
} = {}) {
  const paths = new Map();
  const cache = new WeakMap();
  const emitter = Emitter();
  const dispatcher = Dispatcher(obj, emitter);
  const schedule = Schedule(dispatcher, asynchronous, autoCommit, fast);
  // creates a proxy and fires every time the proxy changes
  // with the changed paths
  const proxy = proxyWatcher(obj, schedule.add, paths, cache);
  // allows locking and unlocking the proxy
  const lock = locker(proxy);
  const cursor = new Cursor(proxy, lock, emitter, [], {
    paths,
    cache,
    schedule,
  });
  if (debug) schedule.debug(debug(proxy));
  cursor.commit = schedule.commit;
  return cursor;
};

export { observe };