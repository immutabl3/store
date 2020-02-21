export const isArray = target => Array.isArray(target);

export const isObject = target => (
  target &&
  typeof target === 'object' &&
  !Array.isArray(target) &&
  !(target instanceof Date) &&
  !(target instanceof RegExp) &&
  !(typeof Map === 'function' && target instanceof Map) &&
  !(typeof Set === 'function' && target instanceof Set)
);

export const isFunction = target => typeof target === 'function';

export const isSymbol = x => typeof x === 'symbol';

export const isObjectLike = x => typeof x === 'object';

export const isTypedArray = x => {
  return x instanceof Int8Array || 
    x instanceof Uint8Array || 
    x instanceof Uint8ClampedArray || 
    x instanceof Int16Array || 
    x instanceof Uint16Array || 
    x instanceof Int32Array || 
    x instanceof Uint32Array || 
    x instanceof Float32Array || 
    x instanceof Float64Array || 
    x instanceof BigInt64Array ||
    x instanceof BigUint64Array;
};