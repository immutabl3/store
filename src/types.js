import {
  STRICTLY_IMMUTABLE_METHODS,
  LOOSELY_IMMUTABLE_ARRAY_METHODS,
} from './consts';

// https://github.com/jonschlinkert/is-primitive
export const isPrimitive = function(val) {
  const type = typeof val;
  if (type === 'object') return val === null;
  return type !== 'function';
};

export const isArray = value => value && Array.isArray(value);

export const isFunction = value => value && typeof value === 'function';

export const isString = value => typeof value === 'string';

export const isSymbol = value => typeof value === 'symbol';

export const isNumber = value => typeof value === 'number';

export const isObjectLike = value => value && typeof value === 'object';

export const isObject = target => (
  isObjectLike(target) &&
  !isArray(target) &&
  !(target instanceof Date) &&
  !(target instanceof RegExp) &&
  !(target instanceof Map) &&
  !(target instanceof Set)
);

export const isTypedArray = value => {
  return isObjectLike(value) && 
    (
      value instanceof Int8Array || 
      value instanceof Uint8Array || 
      value instanceof Uint8ClampedArray || 
      value instanceof Int16Array || 
      value instanceof Uint16Array || 
      value instanceof Int32Array || 
      value instanceof Uint32Array || 
      value instanceof Float32Array || 
      value instanceof Float64Array || 
      value instanceof BigInt64Array ||
      value instanceof BigUint64Array
    );
};

export const isUnsupported = x => {
  return x && (
    x instanceof Promise || 
    x instanceof WeakMap || 
    x instanceof WeakSet
  );
};

export const isWithoutMutableMethods = x => {
  return !x ||
    isPrimitive(x) || 
    x instanceof RegExp || 
    x instanceof ArrayBuffer || 
    x instanceof Number || 
    x instanceof Boolean || 
    x instanceof String;
};

export const hasMutableMethods = x => {
  return x && !isPrimitive(x) && (
    x instanceof Date || 
    x instanceof Map || 
    x instanceof Set || 
    isTypedArray(x)
  );
};

export const isStrictlyImmutableMethod = methodName => {
  if (!methodName) return false;
  return STRICTLY_IMMUTABLE_METHODS.has(methodName);
};

export const isLooselyImmutableMethod = (target, method) => {
  const { name } = method;
  if (!name) return false;
  if (isArray(target)) return LOOSELY_IMMUTABLE_ARRAY_METHODS.has(name);
  return false;
};

// check that the object matches the store's shape
export const isStore = store => (
  store &&
  'data' in store &&
  isFunction(store.projection) &&
  isFunction(store.watch)
);

// assume a projection if it isn't a path (and won't be coerced to a path)
export const isProjection = value => {
  return value && !isArray(value) && !isString(value) && !isNumber(value);
};