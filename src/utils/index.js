import permute from './permute';
import uniqueId from './uniqueId';
import hashPath from './hashPath';
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

export const noop = () => {};

const index = (arr, fn) => {
  let idx = 0;
  const len = arr.length;
  for (; idx < len; idx++) {
    if (fn(arr[idx])) return idx;
  }
  return -1;
};

const compare = (object, description) => {
  let ok = true;

  // If we reached here via a recursive call, object may be undefined because
  // not all items in a collection will have the same deep nesting structure.
  if (!object) return false;

  // TODO: optimize
  for (const key in description) {
    if (isObject(description[key])) {
      ok = ok && compare(object[key], description[key]);
    } else if (isArray(description[key])) {
      ok = ok && !!~description[key].indexOf(object[key]);
    }
    
    if (object[key] !== description[key]) return false;
  }

  return ok;
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
    } else if (isObjectLike(path[i])) {
      if (!isArray(current)) return;

      // TODO: a lodash impl of find for object?
      // eslint-disable-next-line no-loop-func
      idx = index(current, e => compare(e, path[i]));
      if (!~idx) return;

      current = current[idx];
    } else {
      current = current[path[i]];
    }
  }

  return current;
};

export const solvePath = (object, path) => {
  const solvedPath = [];

  let current = object;
  let idx;
  let i = 0;
  const len = path.length;

  for (; i < len; i++) {
    debugger;
    if (!current) return solvedPath.concat(path.slice(i));

    if (isFunction(path[i])) {
      if (!isArray(current)) return [];

      idx = index(current, path[i]);
      if (!~idx) return [];

      solvedPath.push(idx);
      current = current[idx];
    } else if (isObjectLike(path[i])) {
      if (!isArray(current)) return [];

      // TODO: a lodash impl of find for object?
      // eslint-disable-next-line no-loop-func
      idx = index(current, e => compare(e, path[i]));
      if (!~idx) return [];

      solvedPath.push(idx);
      current = current[idx];
    } else {
      solvedPath.push(path[i]);
      current = current[path[i]];
    }
  }

  return solvedPath;
};

export const defer = fn => setTimeout(fn, 0);

export const delay = (ms = 0) => (
  new Promise(resolve => setTimeout(resolve, ms))
);

export const isEqual = (x, y) => {
  return isPrimitive(x) || isPrimitive(y) ? Object.is(x, y) : baseIsEqual(x, y);
};

const cloneCustomizer = value => {
  // TODO: FIXME: https://github.com/lodash/lodash/issues/4646
  if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
};

export const clone = x => cloneWith(x, cloneCustomizer);

export const cloneDeep = x => cloneDeepWith(x, cloneCustomizer);

export const isEmpty = obj => {
  for (const key in obj) return false;
  return true;
};

export const isStore = store => (
  'data' in store &&
  isFunction(store.projection) &&
  isFunction(store.watch)
);

export {
  permute,
  uniqueId,
  hashPath,
};