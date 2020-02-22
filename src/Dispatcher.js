import event from './event';
import {
  get,
  hashPath,
  solvePath,
} from './utils';
import {
  isArray,
  isDynamicPath,
  isString,
} from './types';
import query from './query';

export default function Dispatcher(proxy, emitter, path = []) {
  const root = hashPath(path);
  const listeners = [];

  const emit = pathMap => {    
    if (root) {
      if (pathMap.has(root)) {
        emitter.emit('change', event(
          Array.from(pathMap.values()),
          proxy,
        ));
      }
    } else {
      emitter.emit('change', event(
        Array.from(pathMap.values()),
        proxy,
      ));
    }

    // TODO: optimize (heavily)
    listeners.forEach(([selectorFn, fn]) => {
      const value = selectorFn();
      const isProjection = !isArray(value) && !isString(value);

      if (isProjection) {
        const [
          paths,
          entries,
        ] = Object.entries(value)
          .reduce((memo, [key, value]) => {
            const [paths, entries] = memo;
            const selector = query.resolve(proxy, value);
            const path = query.toString(root, selector);
            const hasPath = pathMap.has(path);
            if (hasPath) paths.push(path);
            entries.push([key, selector]);
            return memo;
          }, [
            [],
            [],
          ]);
        
        if (!paths.length) return;

        fn(event(
          paths,
          // TODO: a short circuit stop on the gets for the proxy
          Object.fromEntries(
            entries.map(([key, selector]) => {
              return [key, get(proxy, selector)];
            })
          )
        ));
      } else {
        const selector = query.resolve(proxy, value);
        const path = query.toString(root, selector);
        if (!pathMap.has(path)) return;

        fn(event(
          selector,
          // TODO: a short circuit stop on the gets for the proxy
          get(proxy, selector)
        ));
      }
    });
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
      const isProjection = query.isProjection(value);
      return isProjection ? cursor.projection(value) : cursor.get(value);
    };

    return disposer;
  };

  return emit;
};