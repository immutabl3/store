import { noop } from '@immutabl3/utils';
import makeTraps from './makeTraps.js';
import {
  isWithoutMutableMethods,
} from '../types.js';
import {
  $PROXY,
} from '../consts.js';

const noopWeakMap = new WeakMap();
const noopMap = new Map();

const annotate = function(object) { 
  let init = false;

  const state = {
    proxy: true,
    onChange: noop,
    cache: noopWeakMap,
    paths: noopMap,
  };

  Object.defineProperty(object, $PROXY, {
    value({ paths: map, cache: weakmap, schedule: { add } }) {
      if (init) return this;
      
      init = true;
      state.onChange = add;
      state.cache = weakmap;
      state.paths = map;
      return this;
    },
    enumerable: false,
    writable: false,
  });

  return state;
};

const makeProxy = function(object, cache, traps) {
  if (cache.has(object)) return cache.get(object);
  
  const proxy = new Proxy(object, traps);
  cache.set(object, proxy);
  return proxy;
};

export default function observe(object) {
  if (isWithoutMutableMethods(object)) return object;

  const state = annotate(object);
  const cache = new WeakMap();
  const traps = makeTraps(makeProxy, state);
  const proxy = makeProxy(object, cache, traps);

  return proxy;
};