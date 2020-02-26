import {
  MAX_SAFE_INTEGER,
  STRICTLY_IMMUTABLE_METHODS,
  LOOSELY_IMMUTABLE_ARRAY_METHODS,
} from './consts';

// https://github.com/jonschlinkert/is-primitive
export const isPrimitive = function(val) {
  if (typeof val === 'object') return val === null;
  return typeof val !== 'function';
};

export const isArray = value => value && Array.isArray(value);

export const isObject = target => (
  target &&
  typeof target === 'object' &&
  !isArray(target) &&
  !(target instanceof Date) &&
  !(target instanceof RegExp) &&
  !(typeof Map === 'function' && target instanceof Map) &&
  !(typeof Set === 'function' && target instanceof Set)
);

export const isFunction = value => value && typeof value === 'function';

export const isString = value => typeof value === 'string';

export const isSymbol = value => typeof value === 'symbol';

export const isNumber = value => typeof value === 'number';

export const isObjectLike = value => value && typeof value === 'object';

export const isLength = value => {
  return isNumber(value) && value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
};

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

export const isBuiltinUnsupported = x => {
  return x instanceof Promise || 
    x instanceof WeakMap || 
    x instanceof WeakSet;
};

export const isBuiltinWithoutMutableMethods = x => {
  return isPrimitive(x) || 
    x instanceof RegExp || 
    x instanceof ArrayBuffer || 
    x instanceof Number || 
    x instanceof Boolean || 
    x instanceof String;
};

export const isBuiltinWithMutableMethods = x => {
  return !isPrimitive(x) && (
    x instanceof Date || 
    x instanceof Map || 
    x instanceof Set || 
    isTypedArray(x)
  );
};

export const isStrictlyImmutableMethod = (target, method) => {
  const { name } = method;
  if (!name) return false;
  return STRICTLY_IMMUTABLE_METHODS.has(name);
};

export const isLooselyImmutableMethod = (target, method) => {
  const { name } = method;
  if (!name) return false;
  if (Array.isArray(target)) return LOOSELY_IMMUTABLE_ARRAY_METHODS.has(name);
  return false;
};

export const isStore = store => (
  store &&
  'data' in store &&
  isFunction(store.projection) &&
  isFunction(store.watch)
);

export const isProjection = value => {
  return !isArray(value) && !isString(value) && !isNumber(value);
};