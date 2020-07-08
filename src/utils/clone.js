import {
  isArray,
  isObject,
  isTypedArray,
} from '../types';

const cloneRegexp = re => {
  const pattern = re.source;

  let flags = '';

  if (re.global) flags += 'g';
  if (re.multiline) flags += 'm';
  if (re.ignoreCase) flags += 'i';
  if (re.sticky) flags += 'y';
  if (re.unicode) flags += 'u';

  return new RegExp(pattern, flags);
};

const cloneSet = set => {
  const result = new Set();
  for (const value of set.values()) {
    // eslint-disable-next-line no-use-before-define
    result.add(clone(value));
  }
  return result;
};

const cloneMap = map => {
  const result = new Map();
  map.forEach((value, key) => {
    // eslint-disable-next-line no-use-before-define
    result.set(clone(key), clone(value));
  });
  return result;
};

export default function clone(item) {
  if (
    !item ||
    typeof item !== 'object' ||
    item instanceof Error ||
    item instanceof ArrayBuffer
  ) {
    return item;
  }

  // Array and TypedArray
  if (isArray(item) || isTypedArray(item)) return item.slice();

  // Date
  if (item instanceof Date) return new Date(item.getTime());

  // RegExp
  if (item instanceof RegExp) return cloneRegexp(item);

  // Set
  if (item instanceof Set) return cloneSet(item);

  // Map
  if (item instanceof Map) return cloneMap(item);

  // Object
  if (isObject(item)) {
    const obj = {};
    const props = Object.getOwnPropertyNames(item);
    for (let idx = 0; idx < props.length; idx++) {
      const name = props[idx];
      const descriptor = Object.getOwnPropertyDescriptor(item, name);
      if (descriptor.enumerable === true) {
        if (descriptor.get && descriptor.get.isLazyGetter) {
          Object.defineProperty(obj, name, {
            get: descriptor.get,
            enumerable: true,
            configurable: true
          });
        } else {
          obj[name] = item[name];
        }
      } else if (descriptor.enumerable === false) {
        Object.defineProperty(obj, name, {
          value: descriptor.value,
          enumerable: false,
          writable: true,
          configurable: true
        });
      }
    }
    return obj;
  }

  return item;
};