import StoreError from './StoreError';
import indexOf from './utils/indexOf';
import indexOfCompare from './utils/indexOfCompare';
import {
  isArray,
  isString,
  isNumber,
  isFunction,
  isObject,
  isObjectLike,
} from './types';
import {
  PATH_DELIMITER,
} from './consts';

// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
// however, we have a check to see if the path is dynamic 
// (and to solve) before hashing, so it's simplified
const hash = path => path.length ? path.join(PATH_DELIMITER) : '';

const isDynamicPath = function(path) {
  for (const value of path) {
    if (isFunction(value) || isObject(value)) return true;
  }
  return false;
};

const solvePath = (object, path) => {
  const solvedPath = [];

  let current = object;
  let idx;
  let i = 0;
  const len = path.length;

  for (; i < len; i++) {
    if (!current) return solvedPath.concat(path.slice(i));

    if (isFunction(path[i])) {
      if (!isArray(current)) return [];

      idx = indexOf(current, path[i]);
      if (!~idx) return [];

      solvedPath.push(idx);
      current = current[idx];
    } else if (isObjectLike(path[i])) {
      if (!isArray(current)) return [];

      idx = indexOfCompare(current, path[i]);
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

export default {
  hash,
  resolve(proxy, value) {
    const selector = isString(value) || isNumber(value) ? [value] : value;
    if (!isArray(selector)) throw new StoreError(`invalid selector`, { selector: value });
    return isDynamicPath(selector) ? solvePath(proxy, selector) : selector;
  },
  toString(root, selector) {
    return root ? `${root}${PATH_DELIMITER}${hash(selector)}` : hash(selector);
  },
};