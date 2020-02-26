/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
/* eslint-disable eqeqeq */
/* eslint-disable no-param-reassign */
/* eslint-disable indent */
import {
  isArray,
  isTypedArray,
  isPrimitive,
} from '../../types';
import {
  UNORDERED_COMPARE_FLAG,
  PARTIAL_COMPARE_FLAG,
} from '../../consts';
import eq from './eq';
import Stack from './Stack';
import SetCache from './SetCache';

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

const some = function(array, predicate) {
  let index = -1;
  const length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index)) return true;
  }
  return false;
};

const objectToString = Object.prototype.toString;
const getTag = value => objectToString.call(value);

const equalArrays = function(array, other, bitmask, stack) {
  const isPartial = bitmask & PARTIAL_COMPARE_FLAG;
  const arrLength = array.length;
  const othLength = other.length;

  if (arrLength !== othLength && !(isPartial && othLength > arrLength)) return false;

  // assume cyclic values are equal
  const stacked = stack.get(array);
  if (stacked && stack.get(other)) return stacked == other;
    
  let index = -1;
  let result = true;
  const seen = (bitmask & UNORDERED_COMPARE_FLAG) ? new SetCache() : undefined;

  stack.set(array, other);
  stack.set(other, array);

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
    // recursively compare arrays (susceptible to call stack limits)
    if (seen) {
      if (
        !some(other, function(othValue, othIndex) {
          if (
            !seen.has(othIndex) &&
            (arrValue === othValue || baseIsEqual(arrValue, othValue, bitmask, stack))
          ) {
            return seen.add(othIndex);
          }
        })
      ) {
        result = false;
        break;
      }
    } else if (
      !(
        arrValue === othValue ||
        baseIsEqual(arrValue, othValue, bitmask, stack)
      )
    ) {
      result = false;
      break;
    }
  }
  stack.delete(array);
  stack.delete(other);
  return result;
};

const equalByTag = (object, other, tag, bitmask, stack) => {
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
      const stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= UNORDERED_COMPARE_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      const result = equalArrays(convert(object), convert(other), bitmask, stack);
      stack.delete(object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
};

const equalObjects = (object, other, bitmask, stack) => {
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
  // assume cyclic values are equal
  const stacked = stack.get(object);
  if (stacked && stack.get(other)) return (stacked == other);
  
  let result = true;
  stack.set(object, other);
  stack.set(other, object);

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
          ? (objValue === othValue || baseIsEqual(objValue, othValue, bitmask, stack))
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
  stack.delete(object);
  stack.delete(other);
  return result;
};

const baseIsEqualDeep = function(object, other, bitmask, stack) {
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
    stack || (stack = new Stack());
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, stack)
      : equalByTag(object, other, objTag, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    const objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__');
    const othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      const objUnwrapped = objIsWrapped ? object.value() : object;
      const othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack());
      return baseIsEqual(objUnwrapped, othUnwrapped, bitmask, stack);
    }
  }

  if (!isSameTag) return false;
    
  stack || (stack = new Stack());
  return equalObjects(object, other, bitmask, stack);
};

const baseIsEqual = function(value, other, bitmask, stack) {
  if (value === other) return true;
  
  // eslint-disable-next-line eqeqeq
  if (value == null || other == null) return value !== value && other !== other;

  return baseIsEqualDeep(value, other, bitmask, stack);
};

export default function isEqual(value, other) {
  if (isPrimitive(value) || isPrimitive(other)) return Object.is(value, other);
  return baseIsEqual(value, other);
};