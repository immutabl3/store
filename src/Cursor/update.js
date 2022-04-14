import StoreError from '../StoreError.js';
import {
  dynamicGet,
  clone,
  mergeDeep,
} from '../utils/index.js';
import {
  isArray,
  isProxy,
  isObject,
  isPrimitive,
  isMapLike,
} from '../types.js';
import {
  $PROXY,
  $MAPMUTATE,
  $MAPDELETE,
} from '../consts.js';

const operations = {
  set(target, key, value, path, capture) {
    if (isMapLike(target)) {
      const val = isObject(value) 
        ? mergeDeep(target.get(key) || {}, clone(value))
        : value;
      target[$MAPMUTATE] = [key, val];
      target.set(key, val);
      return;
    }
    if (isProxy(value)) {
      target[key] = value[$PROXY](capture);
      return;
    }
    if (isObject(value)) {
      mergeDeep(target, { [key]: clone(value) });
      return;
    }
    target[key] = value;
  },

  push(target, key, value, path, capture) {
    if (!isArray(target[key])) throw new StoreError(`push`, { path });
    target[key].push(
      isProxy(value) ? value[$PROXY](capture) : value
    );
  },

  unshift(target, key, value, path) {
    if (!isArray(target[key])) throw new StoreError(`unshift`, { path });
    target[key].unshift(value);
  },

  concat(target, key, value, path, capture) {
    if (!isArray(target[key])) throw new StoreError(`concat`, { path });
    target[key].push(...(
      value.map(val => isProxy(val) ? val[$PROXY](capture) : val)
    ));
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
    if (isProxy(value)) throw new StoreError(`merge: cannot merge observable objects`, { path });

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

export default function update(data, path, type, value, capture) {
  const length = path.length;

  // altering the root
  if (!length) {
    return operations[type]({ root: data }, 'root', value, ['root'], capture);
  }

  // walking the path
  let current = data;

  for (let idx = 0; idx < length; idx++) {
    // Current item's reference is therefore p[s]
    // The reason why we don't create a variable here for convenience
    // is because we actually need to mutate the reference.
    const key = path[idx];

    // if we reached the end of the path, we apply the operation
    if (idx === length - 1) {
      return operations[type](current, key, value, path, capture);
    }
    
    // if we reached a leaf, we override by setting an empty object
    if (isPrimitive(current[key])) {
      current = current[key] = {};
      continue;
    }

    if (isMapLike(current)) {
      current = current.get(key);
      continue;
    }
    
    current = current[key];
  }
};