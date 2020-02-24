import isPrimitive from 'is-primitive';
import {
  STRICTLY_IMMUTABLE_METHODS,
  LOOSELY_IMMUTABLE_METHODS,
} from './consts';

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

export const isString = x => typeof x === 'string';

export const isSymbol = x => typeof x === 'symbol';

export const isNumber = x => typeof x === 'number';

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
  if (Array.isArray(target)) return LOOSELY_IMMUTABLE_METHODS.array.has(name);
  // TODO: For some reason mutations generated via these methods from Map or Set objects don't get detected
  // return LOOSELY_IMMUTABLE_METHODS.others.has(name);
  return false;
};
