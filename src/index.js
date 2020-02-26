import proxyWatcher from './proxyWatcher';
import scheduler from './scheduler';
import locker from './locker';
import Cursor from './Cursor';

export default function Store(obj, {
  // should the transactions be handled asynchronously?
  asynchronous = true,
  // should the tree handle its transactions on its own?
  autoCommit = true,
  // if the debugger is passed, we'll initialize it
  debug,
} = {}) {
  const schedule = scheduler(asynchronous, autoCommit);
  // creates a proxy and fires every time the proxy changes
  // with the changed paths
  const proxy = proxyWatcher(obj, schedule.add);
  // allows locking and unlocking the proxy
  const lock = locker(proxy);
  const cursor = new Cursor(proxy, lock, schedule);
  schedule.locker(lock);
  if (debug) schedule.debug(debug(proxy));
  cursor.commit = schedule.commit;
  return cursor;
};