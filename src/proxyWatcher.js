import clone from './utils/clone';
import isEqual from './utils/isEqual';
// import get from './utils/get';
import {
  isArray,
  isSymbol,
  isFunction,
  isLooselyImmutableMethod,
  isWithoutMutableMethods,
  isUnsupported,
  isStrictlyImmutableMethod,
  hasMutableMethods,
} from './types';
import {
  $TARGET,
  $PAUSE,
  $RESUME,
} from './consts';

// TODO: how to optimize further?

const makeTraps = function(onChange, cache) {  
  let paused = false;

  const paths = new WeakMap();
  
  const getParentPath = parent => paths.get(parent);

  // arrays can have numeric (index) accessors
  const fragmentToPath = (parent, path) => {
    if (!isArray(parent)) return path;
    const num = +path;
    if (Number.isNaN(num)) return path;
    return num;
  };

  const getChildPath = function(parent, fragment) {
    const path = fragmentToPath(parent, fragment);
    const childPath = paths.has(parent) ? 
      [...paths.get(parent), path] : 
      [path];
    return childPath;
  };

  // const getChildPath = function(parent, fragment) {
  //   const path = fragmentToPath(parent, fragment);
  //   if (paths.has(parent)) {
  //     const parentPath = paths.get(parent);
  //     // cyclical path
  //     if (get(parent, parentPath) === parent) return [path];
  //     // legitimate path
  //     return [...paths.get(parent), path];
  //   }
  //   // no parent path
  //   return [path];
  // };

  const setChildPath = function(parent, child, fragment) {
    const path = fragmentToPath(parent, fragment);
    paths.set(child, getChildPath(parent, path));
  };
  
  const traps = {
    get(target, property, rec) {
      // target access
      if (property === $TARGET) return target;
      
      // when paused, short circuit the gets - this provides
      // a meaningful speed boost when accessing data e.g.
      // firing watchers (which performs gets on the proxy)
      if (paused && property !== $RESUME) return target[property];
      
      // pause toggling
      if (property === $PAUSE) return (paused = true);
      if (property === $RESUME) return (paused = false);

      let receiver = rec;
      if (hasMutableMethods(receiver)) receiver = receiver[$TARGET];
      const value = Reflect.get(target, property, receiver);
      if (isWithoutMutableMethods(value) || property === 'constructor') return value;
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
      // preserving invariants
      if (descriptor && !descriptor.configurable && !descriptor.writable) return value;
      if (isSymbol(property) || isUnsupported(value)) return value;
      // NOTE: binding here to give function correct context
      if (isFunction(value) && isStrictlyImmutableMethod(value.name)) return value.bind(target);
      
      setChildPath(target, value, property);

      // eslint-disable-next-line no-use-before-define
      return makeProxy(value, cache, traps);
    },
    set(target, property, val, rec) {
      let value = val;
      let receiver = rec;
      if (value && value[$TARGET]) value = value[$TARGET];
      if (hasMutableMethods(receiver)) receiver = receiver[$TARGET];
      if (isSymbol(property)) return Reflect.set(target, property, value);
      const isValueUndefined = value === undefined;
      const didPropertyExist = isValueUndefined && Reflect.has(target, property);
      const prev = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value);
      const changed = result && ((isValueUndefined && !didPropertyExist) || !isEqual(prev, value));
      if (!changed) return result;
      
      onChange(getChildPath(target, property));

      return result;
    },
    defineProperty(target, property, descriptor) {
      if (isSymbol(property)) return Reflect.defineProperty(target, property, descriptor);
      const prev = Reflect.getOwnPropertyDescriptor(target, property);
      const changed = Reflect.defineProperty(target, property, descriptor);
      if (!changed) return changed;
      
      const next = {
        // accounting for defaults
        configurable: false,
        enumerable: false,
        writable: false,
        ...descriptor,
      };
      if (isEqual(prev, next)) return true;
      
      onChange(getChildPath(target, property));

      return changed;
    },
    deleteProperty(target, property) {
      if (!Reflect.has(target, property)) return true;
      
      const changed = Reflect.deleteProperty(target, property);
      if (isSymbol(property)) return changed;
      if (!changed) return changed;
      
      onChange(getChildPath(target, property));

      return changed;
    },
    apply(target, thisArg, args) {
      let arg = thisArg;
      if (hasMutableMethods(arg)) arg = thisArg[$TARGET];
      if (isLooselyImmutableMethod(arg, target)) return Reflect.apply(target, thisArg, args);

      const clonedArg = clone(arg);
      const result = Reflect.apply(target, arg, args);
      const changed = !isEqual(clonedArg, arg);
      if (!changed) return result;

      onChange(getParentPath(arg[$TARGET] || arg));

      return result;
    },
  };

  return traps;
};

const makeProxy = function(object, cache, traps) {
  if (cache.has(object)) return cache.get(object);

  const proxy = new Proxy(object, traps);
  cache.set(object, proxy);
  return proxy;
};

export default function proxyWatcher(object, callback) {
  if (isWithoutMutableMethods(object)) return object;

  const cache = new WeakMap();
  const traps = makeTraps(callback, cache);
  return makeProxy(object, cache, traps);
};
