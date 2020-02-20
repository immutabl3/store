import baseIsEqual from 'lodash/isEqual';
import cloneWith from 'lodash/cloneWith';
import cloneDeepWith from 'lodash/cloneDeepWith';
import isPrimitive from 'is-primitive';
import {
  $TARGET,
  STRICTLY_IMMUTABLE_METHODS,
  LOOSELY_IMMUTABLE_METHODS,
} from './consts';

export const isEqual = (x, y) => {
  return isPrimitive(x) || isPrimitive(y) ? Object.is(x, y) : baseIsEqual(x, y);
};

export const isFunction = x => typeof x === 'function';

export const isSymbol = x => typeof x === 'symbol';

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
    x instanceof global.BigInt64Array || 
    x instanceof global.BigUint64Array;
};

const cloneCustomizer = value => {
  // TODO: FIXME: https://github.com/lodash/lodash/issues/4646
  if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
};
export const clone = x => cloneWith(x, cloneCustomizer);
export const cloneDeep = x => cloneDeepWith(x, cloneCustomizer);

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
  // TODO: "Array" should be included this, but then some tests will fail
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