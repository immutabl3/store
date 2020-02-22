import {
  isArray,
  isString,
  isNumber,
  // TODO: move into query
  isDynamicPath,
} from './types';
import {
  // TODO: move into query
  solvePath,
} from './utils';

// TODO: make the symbol a constant
const DELIMITER = 'λ';

// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
// however, we have a check to see if the path is dynamic 
// (and to solve) before hashing, so it's simplified
const hash = path => path.length ? path.join(DELIMITER) : '';

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