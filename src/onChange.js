import constant from 'lodash/constant';
import {
  $GET_RECORD_START,
  $GET_RECORD_STOP,
} from './proxyWatcher/consts'; // UGLY
import changesSubscribers from './changesSubscribers';
import { uniq } from './utils';

export default function onChange(store, selector, listener) {
  if (!listener) return onChange(store, constant, selector);

  const changes = changesSubscribers.get(store);
  return changes.subscribe(rootsChange => {
    if (selector === constant) return listener(store);
    store[$GET_RECORD_START];
    const data = selector(store);
    const rootsGetAll = store[$GET_RECORD_STOP];
    if (data === store || !rootsGetAll.length) return listener(data);
    const rootsGet = uniq(rootsGetAll);
    // TODO: this iteration could get expensive
    const changed = rootsGet.some(get => rootsChange.includes(get));
    if (!changed) return;
    return listener(data);
  });
};