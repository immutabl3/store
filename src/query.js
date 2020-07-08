import StoreError from './StoreError';
import {
  get as baseGet,
  dynamicGet,
  indexOf,
  indexOfCompare,
} from './utils';
import {
  isArray,
  isString,
  isNumber,
  isFunction,
  isObject,
} from './types';

export const coerce = value => {
  if (isArray(value)) return value;

  const selector = isString(value) || isNumber(value) ? [value] : value;
  if (!isArray(selector)) throw new StoreError(`invalid selector`, { selector: value });
  
  return selector;
};

const isDynamic = function(path) {
  for (const value of path) {
    if (isFunction(value) || isObject(value)) return true;
  }
  return false;
};

const solvePath = (object, path) => {
  const solvedPath = [];

  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    if (current === null || current === undefined) return solvedPath.concat(path.slice(idx));

    const chunk = path[idx];
    const type = typeof chunk;

    if (type === 'function') {
      if (!isArray(current)) return [];

      const index = indexOf(current, chunk);
      if (!~index) return [];

      solvedPath.push(index);
      current = current[index];
    } else if (type === 'object') {
      if (!isArray(current)) return [];

      const index = indexOfCompare(current, chunk);
      if (!~index) return [];

      solvedPath.push(index);
      current = current[index];
    } else {
      solvedPath.push(chunk);
      current = current[chunk];
    }
  }

  return solvedPath;
};

export const solve = (proxy, value) => {
  const selector = coerce(value);
  return isDynamic(selector) ? solvePath(proxy, selector) : selector;
};

export const get = (proxy, value) => {
  const selector = coerce(value);
  return isDynamic(selector) ? dynamicGet(proxy, selector) : baseGet(proxy, selector);
};