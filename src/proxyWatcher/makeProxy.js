import {
  isEqual,
  isLooselyImmutableMethod,
  clone,
  isBuiltinWithoutMutableMethods,
  isBuiltinUnsupported,
  isFunction,
  isStrictlyImmutableMethod,
  isBuiltinWithMutableMethods,
  isSymbol,
} from './utils';
import {
  $TARGET,
} from './consts';

// TODO: this could benefit from being prototypical
const makeTraps = function(callback, cache) {
  let changed = false;
  let changedPaths = [];
  
  const paths = new WeakMap();

  const triggerChange = function(path) {
    changed = true;
    changedPaths.push(path);
  };
  
  const getParentPath = parent => paths.get(parent);

  const getChildPath = function(parent, path) {
    // TODO: reused (see setChildPath)
    if (Array.isArray(parent)) {
      const num = +path;
      // TODO: reassignment
      // eslint-disable-next-line no-param-reassign
      if (!Number.isNaN(num)) path = num;
    }
    const childPath = paths.has(parent) ? 
      [...paths.get(parent), path] : 
      [path];
    return childPath;
  };

  const setChildPath = function(parent, child, path) {
    if (Array.isArray(parent)) {
      const num = +path;
      // TODO: reassignment
      // eslint-disable-next-line no-param-reassign
      if (!Number.isNaN(num)) path = num;
    }
    paths.set(child, getChildPath(parent, path));
  };

  const wrapTrap = function(trap) {
    // max arguments = 4
    return function trapWrapper(one, two, three, four) {
      const result = trap(one, two, three, four);
      if (changed) {
        const paths = changedPaths;
        changed = false;
        changedPaths = [];
        callback(paths);
      }
      return result;
    };
  };
  
  const traps = {
    get: wrapTrap((target, property, rec) => {
      if (property === $TARGET) return target;
      
      let receiver = rec;
      if (isBuiltinWithMutableMethods(receiver)) receiver = receiver[$TARGET];
      const value = Reflect.get(target, property, receiver);
      if (isBuiltinWithoutMutableMethods(value) || property === 'constructor') return value;
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
      // preserving invariants
      if (descriptor && !descriptor.configurable && !descriptor.writable) return value;
      if (isSymbol(property) || isBuiltinUnsupported(value)) return value;
      // TODO: FIXME: binding here prevents the function to be potentially re-bounded later
      if (isFunction(value) && isStrictlyImmutableMethod(target, value)) return value.bind(target);
      setChildPath(target, value, property);
      return makeProxy(value, callback, cache, traps);
    }),
    set: wrapTrap((target, property, val, rec) => {
      let value = val;
      let receiver = rec;
      if (value && value[$TARGET]) value = value[$TARGET];
      if (isBuiltinWithMutableMethods(receiver)) receiver = receiver[$TARGET];
      if (isSymbol(property)) return Reflect.set(target, property, value);
      const isValueUndefined = (value === undefined);
      const didPropertyExist = isValueUndefined && Reflect.has(target, property);
      const prev = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value);
      const changed = result && ((isValueUndefined && !didPropertyExist) || !isEqual(prev, value));
      if (!changed) return result;
      triggerChange(getChildPath(target, property));
      return result;
    }),
    defineProperty: wrapTrap((target, property, descriptor) => {
      if (isSymbol(property)) return Reflect.defineProperty(target, property, descriptor);
      const prev = Reflect.getOwnPropertyDescriptor(target, property);
      const changed = Reflect.defineProperty(target, property, descriptor);
      if (changed) {
        const next = Object.assign({
          // Accounting for defaults
          configurable: false,
          enumerable: false,
          writable: false
        }, descriptor);
        if (isEqual(prev, next)) return true;
      }
      if (!changed) return changed;
      triggerChange(getChildPath(target, property));
      return changed;
    }),
    deleteProperty: wrapTrap((target, property) => {
      if (!Reflect.has(target, property)) return true;
      const changed = Reflect.deleteProperty(target, property);
      if (isSymbol(property)) return changed;
      if (!changed) return changed;
      triggerChange(getChildPath(target, property));
      return changed;
    }),
    apply: wrapTrap((target, thisArg, args) => {
      let arg = thisArg;
      if (isBuiltinWithMutableMethods(arg)) arg = thisArg[$TARGET];
      if (isLooselyImmutableMethod(arg, target)) return Reflect.apply(target, thisArg, args);
      const clonedArg = clone(arg);
      const result = Reflect.apply(target, arg, args);
      const changed = !isEqual(clonedArg, arg);
      if (!changed) return result;
      triggerChange(getParentPath(arg[$TARGET] || arg));
      // TODO: FIXME: Why do we need to retrieve the path this way (for arrays)?
      return result;
    }),
  };
  return traps;
};

export default function makeProxy(object, callback, cache = new WeakMap(), traps) {
  if (cache.has(object)) return cache.get(object);
  
  const proxy = new Proxy(object, traps || makeTraps(callback, cache));
  cache.set(object, proxy);
  return proxy;
};