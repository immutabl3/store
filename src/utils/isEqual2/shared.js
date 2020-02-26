/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */
/* eslint-disable indent */
import SetCache from './SetCache';
// TODO: don't import util
import util from 'util';

// Used as the size to enable large array optimizations
export const LARGE_ARRAY_SIZE = 200;

export const DATA = Symbol('__data__');

// Used to stand-in for `undefined` hash values
export const HASH_UNDEFINED = '__lodash_hash_undefined__';

// Used to compose bitmasks for comparison styles
const UNORDERED_COMPARE_FLAG = 1;
export const PARTIAL_COMPARE_FLAG = 2;

// Used as references for various `Number` constants
const MAX_SAFE_INTEGER = 9007199254740991;

// `Object#toString` result references
export const argsTag = '[object Arguments]';
export const arrayTag = '[object Array]';
export const objectTag = '[object Object]';
const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const errorTag = '[object Error]';
const funcTag = '[object Function]';
const genTag = '[object GeneratorFunction]';
const mapTag = '[object Map]';
const numberTag = '[object Number]';
const promiseTag = '[object Promise]';
const regexpTag = '[object RegExp]';
const setTag = '[object Set]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';
const weakMapTag = '[object WeakMap]';

const arrayBufferTag = '[object ArrayBuffer]';
const dataViewTag = '[object DataView]';
const float32Tag = '[object Float32Array]';
const float64Tag = '[object Float64Array]';
const int8Tag = '[object Int8Array]';
const int16Tag = '[object Int16Array]';
const int32Tag = '[object Int32Array]';
const uint8Tag = '[object Uint8Array]';
const uint8ClampedTag = '[object Uint8ClampedArray]';
const uint16Tag = '[object Uint16Array]';
const uint32Tag = '[object Uint32Array]';

const reIsUint = /^(?:0|[1-9]\d*)$/;

const typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

// Used for built-in method references
const arrayProto = Array.prototype;
const funcProto = Function.prototype;
const objectProto = Object.prototype;

// Used to resolve the decompiled source of functions
const funcToString = funcProto.toString;

export const isArray = Array.isArray;

const toSource = func => {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return `${func}`;
    } catch (e) {}
  }
  return '';
};

const arraySome = function(array, predicate) {
  let index = -1;
  const length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
};

const baseTimes = function(n, iteratee) {
  let index = -1;
  const result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
};

export const isHostObject = function(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  let result = false;
  if (value != null && typeof value.toString !== 'function') {
    try {
      result = !!(`${value}`);
    } catch (e) {}
  }
  return result;
};

const mapToArray = function(map) {
  let index = -1;
  const result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
};

const setToArray = function(set) {
  let index = -1;
  const result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
};

/** Used to check objects for own properties. */
const hasOwnProperty = objectProto.hasOwnProperty;

const objectToString = objectProto.toString;

/** Built-in value references. */
const propertyIsEnumerable = objectProto.propertyIsEnumerable;
export const splice = arrayProto.splice;

/** Used to detect maps, sets, and weakmaps. */
const dataViewCtorString = toSource(DataView);
const mapCtorString = toSource(Map);
const promiseCtorString = toSource(Promise);
const setCtorString = toSource(Set);
const weakMapCtorString = toSource(WeakMap);

/** Used to convert symbols to primitives and strings. */
const symbolProto = Symbol ? Symbol.prototype : undefined;
const symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

export const getTag = (function() {
  const getTag = function(value) {
    return objectToString.call(value);
  };

  // Fallback for data views, maps, sets, and weak maps in IE 11,
  // for data views in Edge < 14, and promises in Node.js.
  if (
    (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)
  ) {
    return function getTag(value) {
      const result = objectToString.call(value);
      const Ctor = result === objectTag ? value.constructor : undefined;
      const ctorString = Ctor ? toSource(Ctor) : undefined;

      if (ctorString) {
        if (ctorString === dataViewCtorString) return dataViewTag;
        if (ctorString === mapCtorString) return mapTag;
        if (ctorString === promiseCtorString) return promiseTag;
        if (ctorString === setCtorString) return setTag;
        if (ctorString === weakMapCtorString) return weakMapTag;
      }
      return result;
    };
  }

  return getTag;
}());

const isIndex = (value, len) => {
  const length = len == null ? MAX_SAFE_INTEGER : len;
  return !!length &&
    (typeof value === 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 === 0 && value < length);
};

const isKeyable = value => {
  const type = typeof value;
  return (type === 'string' || type === 'number' || type === 'symbol' || type === 'boolean')
    ? (value !== '__proto__')
    : (value === null);
};

const isPrototype = value => {
  const Ctor = value && value.constructor;
  const proto = (typeof Ctor === 'function' && Ctor.prototype) || objectProto;

  return value === proto;
};

const baseKeys = object => {
  if (!isPrototype(object)) {
    return Object.keys(object);
  }
  const result = [];
  for (const key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key !== 'constructor') {
      result.push(key);
    }
  }
  return result;
};

const eq = (value, other) => {
  return value === other || (value !== value && other !== other);
};

const isLength = value => {
  return typeof value === 'number' &&
    value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
};

export const isObject = value => {
  const type = typeof value;
  return !!value && (type === 'object' || type === 'function');
};

export const isObjectLike = value => {
  return !!value && typeof value === 'object';
};

export const isTypedArray = util.types.isTypedArray || function(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
};

const isFunction = value => {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  const tag = isObject(value) ? objectToString.call(value) : '';
  return tag === funcTag || tag === genTag;
};

const isArrayLike = value => {
  return value != null && isLength(value.length) && !isFunction(value);
};

const isArrayLikeObject = value => {
  return isObjectLike(value) && isArrayLike(value);
};

const isArguments = value => {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) === argsTag);
};

const arrayLikeKeys = (value, inherited) => {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  const result = (isArray(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  const length = result.length;
  const skipIndexes = !!length;

  for (const key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (key === 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
};

const keys = object => {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
};

export const equalArrays = function(array, other, equalFunc, customizer, bitmask, stack) {
  const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
  const arrLength = array.length;
  const othLength = other.length;

  if (arrLength !== othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  const stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  let index = -1;
  let result = true;
  const seen = (bitmask & UNORDERED_COMPARE_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    const arrValue = array[index];
    const othValue = other[index];
    let compared;

    if (customizer) {
      compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (
        !arraySome(other, function(othValue, othIndex) {
          if (
            !seen.has(othIndex) &&
            (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))
          ) {
            return seen.add(othIndex);
          }
        })
      ) {
        result = false;
        break;
      }
    } else if (!(
      arrValue === othValue ||
      equalFunc(arrValue, othValue, customizer, bitmask, stack)
    )) {
      result = false;
      break;
    }
  }
  stack.delete(array);
  stack.delete(other);
  return result;
};

export const equalByTag = (object, other, tag, equalFunc, customizer, bitmask, stack) => {
  let convert;
  // eslint-disable-next-line no-restricted-syntax
  switch (tag) {
    case dataViewTag:
      if (
        (object.byteLength !== other.byteLength) ||
        (object.byteOffset !== other.byteOffset)
      ) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if (
        (object.byteLength != other.byteLength) ||
        !equalFunc(new Uint8Array(object), new Uint8Array(other))
      ) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name === other.name && object.message === other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      // eslint-disable-next-line prefer-template
      return object == (other + '');

    case mapTag:
      convert = mapToArray;

    case setTag:
      const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
      convert || (convert = setToArray);

      if (object.size !== other.size && !isPartial) return false;

      // Assume cyclic values are equal.
      const stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      const result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
      stack.delete(object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
};

export const equalObjects = (object, other, equalFunc, customizer, bitmask, stack) => {
  const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
  const objProps = keys(object);
  const objLength = objProps.length;
  const othProps = keys(other);
  const othLength = othProps.length;

  if (objLength !== othLength && !isPartial) {
    return false;
  }
  let index = objLength;
  while (index--) {
    const key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  const stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  let result = true;
  stack.set(object, other);
  stack.set(other, object);

  let skipCtor = isPartial;
  while (++index < objLength) {
    const key = objProps[index];
    const objValue = object[key];
    const othValue = other[key];
    let compared;

    if (customizer) {
      compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
      ? (objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack))
      : compared
    )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key === 'constructor');
  }
  if (result && !skipCtor) {
    const objCtor = object.constructor;
    const othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor === 'function' && objCtor instanceof objCtor &&
          typeof othCtor === 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack.delete(object);
  stack.delete(other);
  return result;
};

export const getMapData = (map, key) => {
  const data = map[DATA];
  return isKeyable(key)
    ? data[typeof key === 'string' ? 'string' : 'hash']
    : data.map;
};

export const assocIndexOf = (array, key) => {
  let length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
};