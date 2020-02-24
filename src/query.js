import {
  isArray,
  isString,
  isNumber,
  isFunction,
  isObject,
  isObjectLike,
} from './types';
import {
  index,
  compare,
} from './utils';
import {
  PATH_DELIMITER as DELIMITER,
} from './consts';

// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
// however, we have a check to see if the path is dynamic 
// (and to solve) before hashing, so it's simplified
const hash = path => path.length ? path.join(DELIMITER) : '';

// TODO: optimize
const isDynamicPath = function(path) {
  return path.some(step => isFunction(step) || isObject(step));
};

const solvePath = (object, path) => {
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

export default {
  isProjection(value) {
    return !isArray(value) && !isString(value) && !isNumber(value);
  },
  resolve(proxy, value) {
    const selector = isString(value) || isNumber(value) ? [value] : value;
    if (!isArray(selector)) throw new Error(`store: invalid selector: "${value}"`);
    return isDynamicPath(selector) ? solvePath(proxy, selector) : selector;
  },
  toString(root, selector) {
    return root ? `${root}${DELIMITER}${hash(selector)}` : hash(selector);
  },
};