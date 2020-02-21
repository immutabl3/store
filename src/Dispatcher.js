import event from './event';
import {
  get,
  hashPath,
} from './utils';

export default function Dispatcher(proxy, emitter, path = []) {
  // TODO: WeakMap of listeners/paths e.g. https://github.com/Yomguithereal/baobab/blob/master/src/baobab.js#L303
  // TODO: WeakMap of projections/paths e.g. https://github.com/Yomguithereal/baobab/blob/master/src/baobab.js#L303

  // TODO: utilize root
  const root = hashPath(path);
  const listeners = [];
  const projections = [];

  const emit = pathMap => {
    emitter.emit('change', event(
      Array.from(pathMap.values()),
      proxy,
    ));

    listeners.forEach(([selectorFn, fn]) => {
      const value = selectorFn();
      const selector = Array.isArray(value) ? value : [value];
      const path = hashPath(selector);
      if (!pathMap.has(path)) return;

      fn(event(
        selector,
        // TODO: a short circuit stop on the gets for the proxy
        get(proxy, selector)
      ));
    });

    projections.forEach(([selector, fn]) => {
      const [
        paths,
        keySelectorPairs,
      ] = Object.entries(selector)
        // TODO: optimize
        .reduce((memo, [key, value]) => {
          const [paths, pairs] = memo;
          const selector = Array.isArray(value) ? value : [value];
          const path = hashPath(selector);
          
          if (pathMap.has(path)) paths.push(selector);
          pairs.push([key, selector]);

          return memo;
        }, [
          [],
          [],
        ]);

      // nothing changed
      if (!paths.length) return;

      const data = Object.fromEntries(
        keySelectorPairs
          .map(([key, selector]) => {
            return [key, get(proxy, selector)];
          })
      );

      fn(event(
        paths,
        data,
      ));
    });
  };

  emit.watch = (selector, callback) => {
    listeners.push([selector, callback]);
  };

  emit.project = (selector, callback) => {
    projections.push([selector, callback]);
  };

  return emit;
};