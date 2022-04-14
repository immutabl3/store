import {
  isWithoutMutableMethods,
} from '../types.js';
import makeProxy from './makeProxy.js';
import makeTraps from './makeTraps.js';

export default function proxyWatcher(object, onChange, paths = new Map(), cache = new WeakMap()) {
  if (isWithoutMutableMethods(object)) return object;

  const traps = makeTraps(makeProxy, {
    proxy: false,
    onChange,
    cache,
    paths,
  });
  
  return makeProxy(object, cache, traps);
};

export {
  default as observe,
} from './observe.js';
