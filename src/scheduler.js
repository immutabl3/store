import get from 'lodash/get';
import {
  $GET_RECORD_START,
  $GET_RECORD_STOP,
} from './proxyWatcher/consts'; // UGLY

// TODO: move to utils
const defer = fn => setTimeout(fn, 0);

// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
const hashPath = path => `λ${path.join('λ')}`;

// TODO: break permute out and unit test
const permute = arr => {
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

export default function Scheduler(proxy, emitter, asynchronous) {
  let processing;
  
  // TODO: don't hold onto paths here, get it from the proxyWatcher
  let paths = [];
  
  const listeners = [];
    
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
    proxy[$GET_RECORD_STOP];

    emitter.emit('change', {
      paths: Array.from(pathMap.values()),
      data: proxy,
    });

    listeners.forEach(([selectorFn, fn]) => {
      const value = selectorFn();
      const selector = Array.isArray(value) ? value : [value];
      const path = hashPath(selector);
      if (!pathMap.has(path)) return;

      fn({
        paths: selector,
        // TODO: this is going to trigger all gets on the proxy
        // even if nothing comes of it because we're stopped
        data: get(proxy, selector),
      });
    });

    proxy[$GET_RECORD_START];

    paths = [];

    processing = false;
  };

  return {
    add(changes) {
      paths.push(...changes);
    },

    watch(selector, callback) {
      listeners.push([selector, callback]);
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