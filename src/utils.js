// TODO: use protected hasOwnProperty e.g. {}.hasOwnProperty
import {
  isArray,
  isObject,
  isFunction,
} from './type';

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

    if (typeof path[i] === 'function') {
      if (!isArray(current)) return;

      idx = index(current, path[i]);
      if (!~idx) return;

      current = current[idx];
    // TODO: use isPlainObject
    } else if (typeof path[i] === 'object') {
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

export const defer = fn => setTimeout(fn, 0);

const uniqid = (function() {
  let i = 0;
  return () => i++;
}());

// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
const hashPathIterator = step => (
  isFunction(step) || isObject(step) ? `#${uniqid()}#` : step
);
export const hashPath = path => `λ${path.map(hashPathIterator).join('λ')}`;