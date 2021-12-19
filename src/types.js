import {
  isNumber,
  isString,
  isFunction,
  isPrimitive,
  isSymbol,
} from '@immutabl3/utils';

import {
  STRICTLY_IMMUTABLE_METHODS,
  LOOSELY_IMMUTABLE_ARRAY_METHODS,
} from './consts.js';

export const isArray = value => value && Array.isArray(value);

export const isArrayLike = value => value && value.length >= 0;

export const isObjectLike = value => value && typeof value === 'object';

export const isObject = target => (
  isObjectLike(target) &&
  !isArray(target) &&
  !(target.constructor === Date) &&
  !(target.constructor === RegExp) &&
  !(target.constructor === Map) &&
  !(target.constructor === Set)
);

export const isMapLike = target => (
  isObjectLike(target) && (
    target.constructor === Map ||
    target.constructor === Set ||
    target.constructor === WeakMap || 
    target.constructor === WeakSet
  )
);

export const isTypedArray = value => {
  return isArrayLike(value) && 
    (
      value.constructor === Int8Array || 
      value.constructor === Uint8Array || 
      value.constructor === Uint8ClampedArray || 
      value.constructor === Int16Array || 
      value.constructor === Uint16Array || 
      value.constructor === Int32Array || 
      value.constructor === Uint32Array || 
      value.constructor === Float32Array || 
      value.constructor === Float64Array || 
      value.constructor === BigInt64Array ||
      value.constructor === BigUint64Array
    );
};

export const isUnsupported = x => {
  return x && (
    x.constructor === Promise || 
    x.constructor === WeakMap || 
    x.constructor === WeakSet
  );
};

export const isWithoutMutableMethods = x => {
  return !x ||
    isPrimitive(x) || 
    x.constructor === RegExp || 
    x.constructor === ArrayBuffer || 
    x.constructor === Number || 
    x.constructor === Boolean || 
    x.constructor === String;
};

export const hasMutableMethods = x => {
  return x && !isPrimitive(x) && (
    x.constructor === Date || 
    x.constructor === Map || 
    x.constructor === Set || 
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
  isFunction(store.watch)
);

// assume a projection if it isn't a path (and won't be coerced to a path)
export const isProjection = value => {
  return value && !isArray(value) && !isString(value) && !isNumber(value);
};

export {
  isSymbol,
  isPrimitive,
  isFunction,
  isString,
  isNumber,
};