import {
  clone,
  isEqual,
} from './utils/index.js';
import {
  isArray,
  isSymbol,
  isFunction,
  isLooselyImmutableMethod,
  isWithoutMutableMethods,
  isUnsupported,
  isStrictlyImmutableMethod,
  hasMutableMethods,
} from './types.js';
import {
  $TARGET,
  $PAUSE,
  $RESUME,
  $MAPMUTATE,
  $MAPDELETE,
  $LENGTH,
  $CONSTRUCTOR,
  OBJECT_STUB,
} from './consts.js';

const makeTraps = function(onChange, cache) {  
  // paused comed from the outside to optimize gets
  let paused = false;
  // locks comes from internal (from using Reflect.apply)
  // to prevent multiple changes from being fired for a 
  // single application of values
  let locked = false;

  const paths = new Map();
  
  // arrays can have numeric (index) accessors
  const fragmentToPath = (parent, path) => {
    if (!isArray(parent)) return path;
    const num = +path;
    if (Number.isNaN(num)) return path;
    return num;
  };

  const getChildPath = function(parent, fragment) {
    const path = fragmentToPath(parent, fragment);
    if (paths.has(parent)) {
      const childPath = paths.get(parent).slice();
      childPath.push(path);
      return childPath;
    }
    return [path];
  };

  const setChildPath = function(parent, child, fragment) {
    const path = fragmentToPath(parent, fragment);
    paths.set(child, getChildPath(parent, path));
  };

  const traps = {
    get(target, property, receiver) {
      // target access
      if (property === $TARGET) return target;

      if (property === $LENGTH) return target.length;
      if (property === $CONSTRUCTOR) return target.constructor;
      
      // when paused, short circuit the gets - this provides
      // a meaningful speed boost when accessing data e.g.
      // firing watchers (which performs gets on the proxy)
      if (paused && property !== $RESUME) return target[property];
      
      // pause toggling
      if (property === $PAUSE) return (paused = true);
      if (property === $RESUME) return (paused = false);

      // eslint-disable-next-line no-param-reassign
      if (hasMutableMethods(receiver)) receiver = receiver[$TARGET];
      const value = Reflect.get(target, property, receiver);
      if (isWithoutMutableMethods(value) || property === $CONSTRUCTOR) return value;
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
    set(target, property, value, receiver) {
      // occurs when we dynamically access objects
      // inside Maps/Sets - need to be able to track
      // the access. this means we're not actually
      // doing anything in this operation besides
      // caching a child path
      if (property === $MAPMUTATE) {
        !locked && onChange(getChildPath(target, value[0]), 'set', value[1]);
        return OBJECT_STUB;
      }
      if (property === $MAPDELETE) {
        !locked && onChange(getChildPath(target, value[0]), 'delete');
        return OBJECT_STUB;
      }

      // eslint-disable-next-line no-param-reassign
      if (value && value[$TARGET]) value = value[$TARGET];
      // eslint-disable-next-line no-param-reassign
      if (hasMutableMethods(receiver)) receiver = receiver[$TARGET];
      if (isSymbol(property)) return Reflect.set(target, property, value);
      const isValueUndefined = value === undefined;
      const didPropertyExist = isValueUndefined && Reflect.has(target, property);
      const prev = Reflect.get(target, property, receiver);
      const result = Reflect.set(target, property, value);
      const changed = result && ((isValueUndefined && !didPropertyExist) || !isEqual(prev, value));
      if (!changed) return result;
      
      !locked && onChange(getChildPath(target, property), 'set', value);

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
      
      !locked && onChange(getChildPath(target, property), 'define', descriptor);

      return changed;
    },
    deleteProperty(target, property) {
      if (!Reflect.has(target, property)) return true;
  
      const changed = Reflect.deleteProperty(target, property);
      if (isSymbol(property)) return changed;
      if (!changed) return changed;
      
      !locked && onChange(getChildPath(target, property), 'delete', undefined);

      return changed;
    },
    apply(target, thisArg, args) {
      let arg = thisArg;
      if (hasMutableMethods(arg)) arg = thisArg[$TARGET];
      if (isLooselyImmutableMethod(arg, target)) return Reflect.apply(target, thisArg, args);

      const clonedArg = clone(arg);
      
      locked = true;
      let result;
      try {
        result = Reflect.apply(target, arg, args);
      } finally {
        locked = false;
      }

      const changed = !isEqual(clonedArg, arg);
      if (!changed) return result;

      const val = arg[$TARGET] ?? arg;
      const path = paths.get(val); // getParentPath
      onChange(
        path,
        target.name,
        val,
        args
      );

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
