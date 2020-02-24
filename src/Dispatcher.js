import event from './event';
import {
  get,
} from './utils';
import {
  isProjection,
} from './types';
import query from './query';

export default function Dispatcher(proxy, emitter, path = []) {
  const root = query.hash(path);
  const hasRoot = !!root;
  const listeners = [];

  const projectionReducer = (memo, [key, value]) => {
    const { map, paths, entries } = memo;
    const selector = query.resolve(proxy, value);
    const path = query.toString(root, selector);
    const hasPath = map.has(path);
    if (hasPath) paths.push(selector);
    entries.push([key, selector]);
    return memo;
  };

  const getMapper = ([key, selector]) => {
    return [key, get(proxy, selector)];
  };

  const emitProjection = (map, value, fn) => {
    const {
      paths,
      entries,
    } = Object.entries(value)
      .reduce(projectionReducer, {
        map,
        paths: [],
        entries: [],
      });
    
    if (!paths.length) return;

    fn(event(
      paths,
      Object.fromEntries(entries.map(getMapper))
    ));
  };

  const emitSelection = (map, value, fn) => {
    const selector = query.resolve(proxy, value);
    const path = query.toString(root, selector);
    if (!map.has(path)) return;

    fn(event(
      [selector],
      get(proxy, selector)
    ));
  };

  const emit = (map, values) => {    
    if (!hasRoot || (hasRoot && map.has(root))) {
      emitter.emit('change', event(
        values,
        proxy,
      ));
    }

    for (const [selectorFn, fn] of listeners) {
      const value = selectorFn();
      if (isProjection(value)) {
        emitProjection(map, value, fn);
      } else {
        emitSelection(map, value, fn);
      }
    }
  };

  emit.watcher = (selector, cursor, fn) => {
    const entry = [selector, fn];
    
    listeners.push(entry);

    const disposer = () => {
      const index = listeners.indexOf(entry);
      if (!~index) return;
      listeners.splice(index, 1);
    };

    disposer.get = () => {
      const value = selector();
      return isProjection(value) ? cursor.projection(value) : cursor.get(value);
    };

    return disposer;
  };

  return emit;
};