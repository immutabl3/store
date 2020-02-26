import {
  isArray,
} from '../types';
import indexOf from './indexOf';
import indexOfCompare from './indexOfCompare';

export default function get(object, path) {
  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    if (!current) return;
    
    const chunk = path[idx];
    const type = typeof chunk;

    if (type === 'function') {
      if (!isArray(current)) return;

      const index = indexOf(current, chunk);
      if (!~index) return;

      current = current[index];
    } else if (type === 'object') {
      if (!isArray(current)) return;

      const index = indexOfCompare(current, chunk);
      if (!~index) return;

      current = current[index];
    } else {
      current = current[chunk];
    }
  }

  return current;
};