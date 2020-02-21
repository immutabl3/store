import proxyWatcher from './proxyWatcher';
import Scheduler from './Scheduler';
import Cursor from './Cursor';

export default function Store(obj, {
  // should the transactions be handled asynchronously?
  asynchronous = true,
  // should the tree handle its transactions on its own?
  autoCommit = true,
  // debug changes if the debugger is passed
  debug,
} = {}) {
  const schedule = Scheduler(asynchronous, autoCommit);
  // creates a proxy and fires every time the proxy changes
  // with the changed paths
  const proxy = proxyWatcher(obj, schedule.add);
  const cursor = Cursor(proxy, schedule);
  if (debug) schedule.debug(debug(proxy));
  cursor.commit = schedule.commit;
  return cursor;
};