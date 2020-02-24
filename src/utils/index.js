import permute from './permute';
import {
  isArray,
  isObject,
  isFunction,
  isTypedArray,
  isObjectLike,
} from '../types';
import baseIsEqual from 'lodash/isEqual';
import cloneWith from 'lodash/cloneWith';
import cloneDeepWith from 'lodash/cloneDeepWith';
import isPrimitive from 'is-primitive';
import {
  $TARGET,
} from '../consts';

// TODO: break apart

export const index = (arr, fn) => {
  let idx = 0;
  const len = arr.length;
  for (; idx < len; idx++) {
    if (fn(arr[idx])) return idx;
  }
  return -1;
};

export const compare = (object, description) => {
  // If we reached here via a recursive call, object may be undefined because
  // not all items in a collection will have the same deep nesting structure.
  if (!object) return false;

  for (const key in description) {
    const obj = object[key];
    const des = description[key];

    if (isObject(des)) {
      const ok = compare(obj, des);
      if (!ok) return false;
      continue;
    }
    
    if (isArray(des)) {
      const ok = !!~des.indexOf(obj);
      if (!ok) return false;
      continue;
    }
    
    if (obj !== des) return false;
  }

  return true;
};

export const get = (object, path) => {
  let current = object;
  let idx;
  let i = 0;
  const len = path.length;

  for (; i < len; i++) {
    if (!current) return;

    if (isFunction(path[i])) {
      if (!isArray(current)) return;

      idx = index(current, path[i]);
      if (!~idx) return;

      current = current[idx];
      continue;
    }
    
    if (isObjectLike(path[i])) {
      if (!isArray(current)) return;

      // TODO: a lodash impl of find for object?
      // eslint-disable-next-line no-loop-func
      idx = index(current, e => compare(e, path[i]));
      if (!~idx) return;

      current = current[idx];
      continue;
    }
    
    current = current[path[i]];
  }

  return current;
};

export const defer = fn => setTimeout(fn, 0);

export const isEqual = (x, y) => {
  return isPrimitive(x) || isPrimitive(y) ? 
    Object.is(x, y) : 
    baseIsEqual(x, y);
};

const cloneCustomizer = value => {
  // to support BigInt64Array and BigUint64Array
  if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
};

export const clone = x => cloneWith(x, cloneCustomizer);

export const cloneDeep = x => cloneDeepWith(x, cloneCustomizer);

export const isEmpty = obj => {
  for (const key in obj) return false;
  return true;
};

export {
  permute,
};