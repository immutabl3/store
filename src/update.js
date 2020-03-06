import StoreError from './StoreError';
import {
  isArray,
  isObject,
  isPrimitive,
} from './types';

const operations = new Map([
  ['set', (target, key, value) => (target[key] = value)],

  ['push', (target, key, value, path) => {
    if (!isArray(target[key])) throw new StoreError(`push`, { path });
    return target[key].push(value);
  }],

  ['unshift', (target, key, value, path) => {
    if (!isArray(target[key])) throw new StoreError(`unshift`, { path });
    return target[key].unshift(value);
  }],

  ['concat', (target, key, value, path) => {
    if (!isArray(target[key])) throw new StoreError(`concat`, { path });
    return target[key].push(...value);
  }],

  ['splice', (target, key, value, path) => {
    if (!isArray(target[key])) throw new StoreError(`splice`, { path });
    return target[key].splice(...value);
  }],

  ['pop', (target, key, value, path) => {
    if (!isArray(target[key])) throw new StoreError(`pop`, { path });  
    return target[key].pop();
  }],

  ['shift', (target, key, value, path) => {
    if (!isArray(target[key])) throw new StoreError(`shift`, { path });
    return target[key].shift();
  }],

  ['unset', (target, key) => {
    if (isArray(target)) return target.splice(key, 1);
    delete target[key];
  }],

  ['merge', (target, key, value, path) => {
    if (!isObject(target[key])) throw new StoreError(`merge`, { path });
    return (target[key] = Object.assign(target[key], value));
  }],
]);

export default function update(data, path, type, value) {
  // dummy root, so we can shift and alter the root
  const dummy = { root: data };
  const dummyPath = ['root', ...path];

  // walking the path
  let current = dummy;
  let key;

  let idx = 0;
  const { length } = dummyPath;
  for (; idx < length; idx++) {
    // Current item's reference is therefore p[s]
    // The reason why we don't create a variable here for convenience
    // is because we actually need to mutate the reference.
    key = dummyPath[idx];

    // if we reached the end of the path, we apply the operation
    if (idx === length - 1) {
      return operations.get(type)(current, key, value, path);
    }
    
    // if we reached a leaf, we override by setting an empty object
    if (isPrimitive(current[key])) {
      current[key] = {};
    }

    current = current[key];
  }

  // returning new data object
  return current[key];
};