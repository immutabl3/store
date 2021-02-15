import { isMapLike } from '../types';

export default function get(object, path) {
  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    if (current === null || current === undefined) return current;
    current = isMapLike(current) ? current.get(path[idx]) : current[path[idx]];
  }

  return current;
};