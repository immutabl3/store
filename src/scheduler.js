import { get, defer, hashPath } from './utils';

// TODO: break permute out and unit test
const permute = arr => {
  if (!arr) debugger;
  if (!arr.length) return arr;
  if (arr.length === 1) return [arr];

  const result = [];
  let idx = 0;
  while (idx < arr.length) {
    result.push(arr.slice(0, idx + 1));
    idx++;
  }
  return result;
};

// TODO: scheduler shouldn't also be the emitter - should behave as a batcher

export default function Scheduler(proxy, emitter, asynchronous) {
  // TODO: WeakMap of listeners/paths e.g. https://github.com/Yomguithereal/baobab/blob/master/src/baobab.js#L303
  // TODO: WeakMap of projections/paths e.g. https://github.com/Yomguithereal/baobab/blob/master/src/baobab.js#L303

  let processing;
  
  let paths = [];
  
  const listeners = [];
  const projections = [];
    
  const process = () => {
    if (!paths.length) return;

    // TODO: performance
    const pathMap = new Map(
      paths.reduce((memo, path) => {
        const masterPaths = permute(path)
          .map(path => [hashPath(path), path]);
        memo.push(...masterPaths);
        return memo;
      }, [])
    );

    emitter.emit('change', {
      paths: Array.from(pathMap.values()),
      data: proxy,
    });

    if (proxy.arr[3].foo === 2) debugger;

    listeners.forEach(([selectorFn, fn]) => {
      const value = selectorFn();
      const selector = Array.isArray(value) ? value : [value];
      const path = hashPath(selector);
      if (!pathMap.has(path)) return;

      fn({
        paths: selector,
        // TODO: a short circuit stop on the gets for the proxy
        data: get(proxy, selector),
      });
    });

    projections.forEach(([selectorFn, fn]) => {
      const [
        paths,
        keySelectorPairs,
      ] = Object.entries(selectorFn())
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

      fn({
        paths,
        // TODO: a short circuit stop on the gets for the proxy
        data,
      });
    });

    paths = [];

    processing = false;
  };

  return {
    add(path) {
      paths.push(path);
    },

    watch(selector, callback) {
      listeners.push([selector, callback]);
    },

    project(selector, callback) {
      projections.push([selector, callback]);
    },

    commit() {
      if (asynchronous) {
        if (processing) return;
        processing = true;
        return defer(process);
      }

      process();
    },
  };
};