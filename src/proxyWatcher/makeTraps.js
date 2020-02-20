import makeProxy from './makeProxy';
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

// TODO: this could benefit fromm being prototypical

export default function makeTraps(callback, $PROXY) {
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
    return paths.get(parent) || '';
  };

  const getChildPath = function(parent, path) {
    const parentPath = getParentPath(parent);
    const childPath = parentPath ? `${parentPath}.${path}` : `${path}`;
    return childPath;
  };

  const setChildPath = function(parent, child, path) {
    paths.set(child, getChildPath(parent, path));
  };

  const wrapTrap = function(trap) {
    let depth = 0;
    return function trapWrapper(...args) {
      depth++;
      const result = trap(...args);
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
    get: wrapTrap((target, property, receiver) => {
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
    set: wrapTrap((target, property, value, receiver) => {
      if (value && value[$TARGET]) value = value[$TARGET];
      if (isBuiltinWithMutableMethods(receiver)) receiver = receiver[$TARGET];
      if (stopped || isSymbol(property)) return Reflect.set(target, property, value);
      const isValueUndefined = (value === undefined);
      const didPropertyExist = isValueUndefined && Reflect.has(target, property);
      const prev = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value);
      const changed = result && ((isValueUndefined && !didPropertyExist) || !isEqual(prev, value));
      return changed ? triggerChange(result, getChildPath(target, property)) : result;
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
      if (isBuiltinWithMutableMethods(thisArg)) thisArg = thisArg[$TARGET];
      if (stopped || isLooselyImmutableMethod(thisArg, target)) return Reflect.apply(target, thisArg, args);
      const clonedArg = clone(thisArg);
      const result = Reflect.apply(target, thisArg, args);
      const changed = !isEqual(clonedArg, thisArg);
      return changed ? 
        triggerChange(result, getParentPath(thisArg[$TARGET] || thisArg)) : 
        // TODO: FIXME: Why do we need to retrieve the path this way (for arrays)?
        result;
    }),
  };
  return traps;
};