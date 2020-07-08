import { isObject } from '../types';

export default function mergeDeep(obj, target) {
  for (const key in target) {
    if (isObject(target[key])) {
      obj[key] = {};
      mergeDeep(obj[key], target[key]);
    } else {
      obj[key] = target[key];
    }
  }

  return obj;
};