import {
  isArray,
  isMapLike,
} from '../types.js';
import indexOf from './indexOf.js';
import indexOfCompare from './indexOfCompare.js';

export default function dynamicGet(object, path) {
  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    if (current === null || current === undefined) return current;
    
    const chunk = path[idx];
    const type = typeof chunk;

    if (isMapLike(current)) {
      current = current.get(chunk);
    } else if (type === 'function') {
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