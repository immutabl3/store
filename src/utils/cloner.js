import {
  isArray,
  isObject,
  isTypedArray,
} from '../types';

/**
 * Function cloning the given regular expression. Supports `y` and `u` flags
 * already.
 *
 * @param  {RegExp} re - The target regular expression.
 * @return {RegExp}    - The cloned regular expression.
 */
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
  set.forEach(value => {
    // eslint-disable-next-line no-use-before-define
    result.add(clone(value));
  });
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

/**
 * Function cloning the given variable.
 *
 * @todo: implement a faster way to clone an array.
 *
 * @param  {boolean} deep - Should we deep clone the variable.
 * @param  {mixed}   item - The variable to clone
 * @return {mixed}        - The cloned variable.
 */
// TODO: does this need to be constantly accessing $TARGET?
// TODO: simplify - this never needs to be deep - debug can use lodash (tree shaken)
const cloner = function(deep, item) {
  // TODO: is-primive or isBuiltinWithoutMutableMethods check?
  if (
    !item ||
    typeof item !== 'object' ||
    item instanceof Error ||
    // TODO: better
    ('ArrayBuffer' in global && item instanceof ArrayBuffer)
  ) {
    return item;
  }

  // Array
  if (isArray(item)) {
    if (deep) {
      const a = new Array(item.length);

      for (let i = 0, l = item.length; i < l; i++) {
        a[i] = cloner(true, item[i]);
      }
      return a;
    }

    return item.slice();
  }

  if (isTypedArray(item)) {
    return item.slice();
  }

  // Date
  if (item instanceof Date) {
    return new Date(item.getTime());
  }

  // RegExp
  if (item instanceof RegExp) {
    return cloneRegexp(item);
  }

  // Set
  if (item instanceof Set) {
    return cloneSet(item);
  }

  // Map
  if (item instanceof Map) {
    return cloneMap(item);
  }

  // Object
  if (isObject(item)) {
    const o = {};

    // NOTE: could be possible to erase computed properties through `null`.
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
          o[name] = deep ? cloner(true, item[name]) : item[name];
        }
      } else if (k.enumerable === false) {
        Object.defineProperty(o, name, {
          value: deep ? cloner(true, k.value) : k.value,
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

export const clone = cloner.bind(null, false);

export const cloneDeep = cloner.bind(null, true);