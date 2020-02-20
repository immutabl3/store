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
  $STOP,
  $GET_RECORD_START,
  $GET_RECORD_STOP,
  PROXY_CACHE,
} from './consts';

// TODO: this could benefit from being prototypical
const makeTraps = function(callback, $PROXY) {
  let stopped = false;
  let changed = false;
  let changedPaths = [];
  let getPathsRecording = false;
  let getPaths = [];
  let paths = new WeakMap();

  const triggerChange = function(result, path) {
    changed = true;
    changedPaths.push(path);
    return result;
  };
  
  const getParentPath = function(parent) {
    return paths.get(parent);
  };

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
    let depth = 0;
    // max arguments = 4
    return function trapWrapper(one, two, three, four) {
      depth++;
      const result = trap(one, two, three, four);
      depth--;
      if (changed && !depth && !stopped) {
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
      if (property === $STOP) {
        stopped = true;
        changedPaths = undefined;
        paths = undefined;
        delete PROXY_CACHE[$PROXY];
        return target;
      }
      if (property === $GET_RECORD_START) return (getPathsRecording = true);
      if (property === $GET_RECORD_STOP) {
        const paths = getPaths;
        getPathsRecording = false;
        getPaths = [];
        return paths;
      }
      
      let receiver = rec;
      if (isBuiltinWithMutableMethods(receiver)) receiver = receiver[$TARGET];
      // We are only recording root paths, because I don't see a use case for recording deeper paths too
      if (getPathsRecording && !getParentPath(target)) getPaths.push(property);
      const value = Reflect.get(target, property, receiver);
      if (isBuiltinWithoutMutableMethods(value) || property === 'constructor') return value;
      const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
      if (descriptor && !descriptor.configurable && !descriptor.writable) return value; // Preserving invariants
      if (stopped || isSymbol(property) || isBuiltinUnsupported(value)) return value;
      // TODO: FIXME: Binding here prevents the function to be potentially re-bounded later
      if (isFunction(value) && isStrictlyImmutableMethod(target, value)) return value.bind(target);
      setChildPath(target, value, property);
      return makeProxy(value, callback, $PROXY, traps);
    }),
    set: wrapTrap((target, property, val, rec) => {
      let value = val;
      let receiver = rec;
      if (value && value[$TARGET]) value = value[$TARGET];
      if (isBuiltinWithMutableMethods(receiver)) receiver = receiver[$TARGET];
      if (stopped || isSymbol(property)) return Reflect.set(target, property, value);
      const isValueUndefined = (value === undefined);
      const didPropertyExist = isValueUndefined && Reflect.has(target, property);
      const prev = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value);
      const changed = result && ((isValueUndefined && !didPropertyExist) || !isEqual(prev, value));
      if (!changed) return result;
      
      triggerChange(result, getChildPath(target, property));

      return result;
    }),
    defineProperty: wrapTrap((target, property, descriptor) => {
      if (stopped || isSymbol(property)) return Reflect.defineProperty(target, property, descriptor);
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
      return changed ? 
        triggerChange(changed, getChildPath(target, property)) : 
        changed;
    }),
    deleteProperty: wrapTrap((target, property) => {
      if (!Reflect.has(target, property)) return true;
      const changed = Reflect.deleteProperty(target, property);
      if (stopped || isSymbol(property)) return changed;
      return changed ? 
        triggerChange(changed, getChildPath(target, property)) : 
        changed;
    }),
    apply: wrapTrap((target, thisArg, args) => {
      let arg = thisArg;
      if (isBuiltinWithMutableMethods(arg)) arg = thisArg[$TARGET];
      if (stopped || isLooselyImmutableMethod(arg, target)) return Reflect.apply(target, thisArg, args);
      const clonedArg = clone(arg);
      const result = Reflect.apply(target, arg, args);
      const changed = !isEqual(clonedArg, arg);
      return changed ? 
        triggerChange(result, getParentPath(arg[$TARGET] || arg)) : 
        // TODO: FIXME: Why do we need to retrieve the path this way (for arrays)?
        result;
    }),
  };
  return traps;
};

// TODO: Maybe use revocable Proxies, will the target object remain usable?
export default function makeProxy(object, callback, $PROXY, passedTraps) {
  if ($PROXY) {
    const proxy = PROXY_CACHE[$PROXY].get(object);
    if (proxy) return proxy;
  } else {
    // TODO: no param reassign
    // TODO: move symbol to constants
    // eslint-disable-next-line no-param-reassign
    $PROXY = Symbol('Target -> Proxy');
    PROXY_CACHE[$PROXY] = new WeakMap();
  }

  const traps = passedTraps || makeTraps(callback, $PROXY);
  const proxy = new Proxy(object, traps);
  PROXY_CACHE[$PROXY].set(object, proxy);
  return proxy;
};