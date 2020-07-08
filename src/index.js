import proxyWatcher from './proxyWatcher';
import Schedule from './Schedule';
import Dispatcher from './Dispatcher';
import locker from './locker';
import Cursor from './Cursor';
import Emitter from './Emitter';

export default function Store(obj, {
  // should the transactions be handled asynchronously?
  asynchronous = true,
  // should the tree handle its transactions on its own?
  autoCommit = true,
  // if the debugger is passed, we'll initialize it
  debug,
} = {}) {
  const emitter = Emitter();
  const dispatcher = Dispatcher(obj, emitter);
  const schedule = Schedule(dispatcher, asynchronous, autoCommit);
  // creates a proxy and fires every time the proxy changes
  // with the changed paths
  const proxy = proxyWatcher(obj, schedule.add);
  // allows locking and unlocking the proxy
  const lock = locker(proxy);
  const cursor = Cursor(proxy, lock, emitter);
  if (debug) schedule.debug(debug(proxy));
  cursor.commit = schedule.commit;
  return cursor;
};