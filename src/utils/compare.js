import {
  isArray,
  isObject,
} from '../types.js';

export default function compare(object, description) {
  // If we reached here via a recursive call, object may be undefined because
  // not all items in a collection will have the same deep nesting structure.
  if (!object) return false;

  for (const key in description) {
    const obj = object[key];
    const des = description[key];

    if (isObject(des)) {
      const ok = compare(obj, des);
      if (!ok) return false;
      continue;
    }
    
    if (isArray(des)) {
      const ok = !!~des.indexOf(obj);
      if (!ok) return false;
      continue;
    }
    
    if (obj !== des) return false;
  }

  return true;
};