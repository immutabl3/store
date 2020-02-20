import './changesCounters';

import proxyWatcher from './proxyWatcher';
import ChangeSubscriber from './changesSubscriber';
import changesSubscribers from './changesSubscribers';
import hooks from './hooks';

export default function store(store) {
  const changes = new ChangeSubscriber();
  const [proxy] = proxyWatcher(store, paths => {
    hooks.store.change.trigger(proxy, paths);
    changes.schedule(paths);
  });
  changesSubscribers.set(proxy, changes);
  hooks.store.new.trigger(proxy);
  return proxy;
};