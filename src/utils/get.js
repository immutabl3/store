import {
  isArray,
  isFunction,
  isObjectLike,
} from '../types';
import {
  indexOf,
  indexOfCompare,
} from './indexOf';

export default function get(object, path) {
  let current = object;
  let idx;
  let i = 0;
  const len = path.length;

  for (; i < len; i++) {
    if (!current) return;

    if (isFunction(path[i])) {
      if (!isArray(current)) return;

      idx = indexOf(current, path[i]);
      if (!~idx) return;

      current = current[idx];
      continue;
    }
    
    if (isObjectLike(path[i])) {
      if (!isArray(current)) return;

      idx = indexOfCompare(current, path[i]);
      if (!~idx) return;

      current = current[idx];
      continue;
    }
    
    current = current[path[i]];
  }

  return current;
};