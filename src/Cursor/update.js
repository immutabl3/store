import StoreError from '../StoreError';
import {
  dynamicGet,
  clone,
  mergeDeep,
} from '../utils';
import {
  isArray,
  isObject,
  isPrimitive,
  isMapLike,
} from '../types';
import {
  $MAPMUTATE,
  $MAPDELETE,
} from '../consts';

const operations = {
  set(target, key, value) {
    if (isMapLike(target)) {
      const val = isObject(value) 
        ? mergeDeep(target.get(key) || {}, clone(value))
        : value;
      target[$MAPMUTATE] = [key, val];
      target.set(key, val);
      return;
    }
    if (isObject(value)) {
      mergeDeep(target, { [key]: clone(value) });
      return;
    }
    target[key] = value;
  },

  push(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`push`, { path });
    target[key].push(value);
  },

  unshift(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`unshift`, { path });
    target[key].unshift(value);
  },

  concat(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`concat`, { path });
    target[key].push(...value);
  },

  splice(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`splice`, { path });
    target[key].splice(...value);
  },

  pop(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`pop`, { path });  
    target[key].pop();
  },

  shift(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`shift`, { path });
    target[key].shift();
  },

  unset(target, key) {
    if (isArray(target)) {
      target.splice(key, 1);
      return;
    }
    if (isMapLike(target)) {
      target[$MAPDELETE] = [key];
      target.delete(key);
      return;
    }
    delete target[key];
  },

  merge(target, key, value, path) {
    if (isMapLike(target)) {
      const obj = target.get(key);
      if (!isObject(obj)) throw new StoreError(`merge`, { path });
      
      const object = mergeDeep(obj, clone(value));
      target[$MAPMUTATE] = [key, object];
      target.set(key, object);
      return;
    }
    
    const obj = isArray(target) ? dynamicGet(target, [key]) : target[key];
    if (!isObject(obj)) throw new StoreError(`merge`, { path });
    mergeDeep(obj, clone(value));
  },
};

export default function update(data, path, type, value) {
  // dummy root, so we can shift and alter the root
  const dummy = { root: data };
  const dummyPath = ['root', ...path];

  // walking the path
  let current = dummy;
  let key;

  const { length } = dummyPath;
  for (let idx = 0; idx < length; idx++) {
    // Current item's reference is therefore p[s]
    // The reason why we don't create a variable here for convenience
    // is because we actually need to mutate the reference.
    key = dummyPath[idx];

    // if we reached the end of the path, we apply the operation
    if (idx === length - 1) {
      return operations[type](current, key, value, path);
    }
    
    // if we reached a leaf, we override by setting an empty object
    if (isPrimitive(current[key])) {
      current[key] = {};
    }

    if (isMapLike(current)) {
      current = current.get(key);
      continue;
    }
    
    current = current[key];
  }
};