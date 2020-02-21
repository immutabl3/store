import uniqueId from './uniqueId';
import {
  isFunction,
  isObject,
} from '../types';

// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
const hashPathIterator = step => (
  isFunction(step) || isObject(step) ? `#${uniqueId()}#` : step
);
export default function hashPath(path) {
  return path && path.length ? `λ${path.map(hashPathIterator).join('λ')}` : '';
};
