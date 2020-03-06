import {
  isArray,
} from '../types';
import indexOf from './indexOf';
import indexOfCompare from './indexOfCompare';

export default function exists(object, path) {
  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    if (!current) return false;

    const chunk = path[idx];
    const type = typeof chunk;

    if (type === 'function') {
      if (!isArray(current)) return false;

      const index = indexOf(current, chunk);
      if (!~index) return false;

      current = current[index];
    } else if (type === 'object') {
      if (!isArray(current)) return false;

      const index = indexOfCompare(current, chunk);
      if (!~index) return false;

      current = current[index];
    } else {
      if (typeof current !== 'object' || !(chunk in current)) return false;
      current = current[chunk];
    }
  }

  return true;
};