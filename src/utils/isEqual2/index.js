/* eslint-disable no-param-reassign */
import {
  isArray,
  isHostObject,
  isTypedArray,
  isObject,
  isObjectLike,

  arrayTag,
  argsTag,
  objectTag,
  
  getTag,

  equalArrays,
  equalByTag,
  equalObjects,

  PARTIAL_COMPARE_FLAG,
} from './shared';
import Stack from './Stack';

const baseIsEqualDeep = function(object, other, equalFunc, customizer, bitmask, stack) {
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
  const objIsObj = objTag === objectTag && !isHostObject(object);
  const othIsObj = othTag === objectTag && !isHostObject(other);
  const isSameTag = objTag === othTag;

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, equalFunc, customizer, bitmask, stack)
      : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
  }
  if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
    const objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__');
    const othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      const objUnwrapped = objIsWrapped ? object.value() : object;
      const othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
};

const baseIsEqual = function(value, other, customizer, bitmask, stack) {
  if (value === other) return true;
  
  // eslint-disable-next-line eqeqeq
  if (value == null || other == null || (!isObject(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }

  return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
};

export default function isEqual(value, other) {
  return baseIsEqual(value, other);
};