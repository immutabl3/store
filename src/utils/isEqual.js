// NOTE: this is a heavily modified version of lodash/isEqual
//
// modifications include:
// - add support of store's types to address compat issues
//   e.g. typed array support for BigInt
// - remove cyclical checking (as store doesn't support 
//   cyclical entries), removing Stack checks and hashing
// - add Object.is checking for primitives
// - refactoring to remove dead code
//
// these modifications drastically speed up the code
// and reduce the size for our usecase 

/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */
/* eslint-disable indent */
import {
  isArray,
  isTypedArray,
  isPrimitive,
} from '../types.js';
import {
  UNORDERED_COMPARE_FLAG,
  PARTIAL_COMPARE_FLAG,
} from '../consts.js';

// `Object#toString` result references
const argsTag = '[object Arguments]';
const arrayTag = '[object Array]';
const objectTag = '[object Object]';
const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const errorTag = '[object Error]';
const mapTag = '[object Map]';
const numberTag = '[object Number]';
const regexpTag = '[object RegExp]';
const setTag = '[object Set]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';
const arrayBufferTag = '[object ArrayBuffer]';
const dataViewTag = '[object DataView]';

// used to check objects for own properties
const hasOwnProperty = Object.prototype.hasOwnProperty;

// Used to convert symbols to primitives and strings
const symbolValueOf = Symbol.prototype.valueOf;

const objectToString = Object.prototype.toString;
const getTag = value => objectToString.call(value);

const eq = (value, other) => {
  return value === other || (value !== value && other !== other);
};

const equalArrays = function(array, other, bitmask) {
  const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
  const arrLength = array.length;
  const othLength = other.length;

  if (arrLength !== othLength && !(isPartial && othLength > arrLength)) return false;
    
  let index = -1;
  let result = true;

  // ignore non-index properties
  while (++index < arrLength) {
    const arrValue = array[index];
    const othValue = other[index];
    let compared;

    if (compared !== undefined) {
      if (compared) continue;
      result = false;
      break;
    }
    // NOTE: removed "seen" checking here as we don't support cyclical entries
    // this results in removal of stack passing and checking throughout the file
    if (
      !(
        arrValue === othValue ||
        baseIsEqual(arrValue, othValue, bitmask)
      )
    ) {
      result = false;
      break;
    }
  }
  return result;
};

const equalByTag = (object, other, tag, bitmask) => {
  let convert;
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
        !baseIsEqual(new Uint8Array(object), new Uint8Array(other))
      ) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // coerce booleans to `1` or `0` and dates to milliseconds.
      // invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name === other.name && object.message === other.message;

    case regexpTag:
    case stringTag:
      // coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      // eslint-disable-next-line prefer-template
      return object == (other + '');

    case mapTag:
      convert = Array.from;

    case setTag:
      const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
      convert || (convert = Array.from);

      if (!isPartial && object.size !== other.size) return false;

      // Assume cyclic values are equal.
      bitmask |= UNORDERED_COMPARE_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      const result = equalArrays(convert(object), convert(other), bitmask);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
};

const equalObjects = (object, other, bitmask) => {
  const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
  const objProps = Object.keys(object);
  const objLength = objProps.length;
  const othProps = Object.keys(other);
  const othLength = othProps.length;

  if (objLength !== othLength && !isPartial) return false;
    
  let index = objLength;
  while (index--) {
    const key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  
  let result = true;
  
  let skipCtor = isPartial;
  while (++index < objLength) {
    const key = objProps[index];
    const objValue = object[key];
    const othValue = other[key];
    let compared;

    // recursively compare objects (susceptible to call stack limits).
    if (
      !(
        compared === undefined
          ? (objValue === othValue || baseIsEqual(objValue, othValue, bitmask))
          : compared
      )
    ) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key === 'constructor');
  }
  if (result && !skipCtor) {
    const objCtor = object.constructor;
    const othCtor = other.constructor;

    // non `Object` object instances with different constructors are not equal.
    if (
      objCtor != othCtor &&
      ('constructor' in object && 'constructor' in other) &&
      !(
        typeof objCtor === 'function' && objCtor instanceof objCtor &&
        typeof othCtor === 'function' && othCtor instanceof othCtor
      )
    ) {
      result = false;
    }
  }
  return result;
};

const baseIsEqualDeep = function(object, other, bitmask) {
  const objIsArr = isArray(object);
  const othIsArr = isArray(other);
  let objTag = arrayTag;
  let othTag = arrayTag;

  if (!objIsArr) {
    objTag = getTag(object);
    objTag = objTag === argsTag ? objectTag : objTag;
  }
  if (!othIsArr) {
    othTag = getTag(other);
    othTag = othTag === argsTag ? objectTag : othTag;
  }
  const objIsObj = objTag === objectTag;
  const othIsObj = othTag === objectTag;
  const isSameTag = objTag === othTag;

  if (isSameTag && !objIsObj) {
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask)
      : equalByTag(object, other, objTag, bitmask);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    const objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__');
    const othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      const objUnwrapped = objIsWrapped ? object.value() : object;
      const othUnwrapped = othIsWrapped ? other.value() : other;

      return baseIsEqual(objUnwrapped, othUnwrapped, bitmask);
    }
  }

  if (!isSameTag) return false;
    
  return equalObjects(object, other, bitmask);
};

const baseIsEqual = function(value, other, bitmask) {
  if (value === other) return true;
  
  // eslint-disable-next-line eqeqeq
  if (value == null || other == null) return value !== value && other !== other;

  return baseIsEqualDeep(value, other, bitmask);
};

export default function isEqual(value, other) {
  if (isPrimitive(value) || isPrimitive(other)) return Object.is(value, other);
  return baseIsEqual(value, other);
};