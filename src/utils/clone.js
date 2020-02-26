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
    const o = {};
    const props = Object.getOwnPropertyNames(item);
    for (let i = 0, l = props.length; i < l; i++) {
      const name = props[i];
      const k = Object.getOwnPropertyDescriptor(item, name);
      if (k.enumerable === true) {
        if (k.get && k.get.isLazyGetter) {
          Object.defineProperty(o, name, {
            get: k.get,
            enumerable: true,
            configurable: true
          });
        } else {
          o[name] = item[name];
        }
      } else if (k.enumerable === false) {
        Object.defineProperty(o, name, {
          value: k.value,
          enumerable: false,
          writable: true,
          configurable: true
        });
      }
    }
    return o;
  }

  return item;
};