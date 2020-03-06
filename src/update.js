import StoreError from './StoreError';
import {
  isArray,
  isObject,
  isPrimitive,
} from './types';

export default function update(data, path, type, value) {
  // dummy root, so we can shift and alter the root
  const dummy = { root: data };
  const dummyPath = ['root', ...path];
  const currentPath = [];

  // Walking the path
  let p = dummy;
  let i;
  let l;
  let s;

  for (i = 0, l = dummyPath.length; i < l; i++) {
    // Current item's reference is therefore p[s]
    // The reason why we don't create a variable here for convenience
    // is because we actually need to mutate the reference.
    s = dummyPath[i];

    // If we reached the end of the path, we apply the operation
    if (i === l - 1) {
      // set
      if (type === 'set') {
        p[s] = value;
      
      // push
      } else if (type === 'push') {
        if (!isArray(p[s])) throw new StoreError(`push`, { currentPath });

        p[s].push(value);
      
      // unshift
      } else if (type === 'unshift') {
        if (!isArray(p[s])) throw new StoreError(`unshift`, { currentPath });

        p[s].unshift(value);
      
      // concat
      } else if (type === 'concat') {
        if (!isArray(p[s])) throw new StoreError(`concat`, { currentPath });
        
        p[s].push.apply(p[s], value);
      
      // splice
      } else if (type === 'splice') {
        if (!isArray(p[s])) throw new StoreError(`splice`, { currentPath });

        p[s].splice.apply(p[s], value);

      // pop
      } else if (type === 'pop') {
        if (!isArray(p[s])) throw new StoreError(`pop`, { currentPath });
        
        p[s].pop();
      
      // shift
      } else if (type === 'shift') {
        if (!isArray(p[s])) throw new StoreError(`shift`, { currentPath });

        p[s].shift();
      
      // unset
      } else if (type === 'unset') {
        if (isArray(p)) p.splice(s, 1);
        if (isObject(p)) delete p[s];
        // TODO: what's the failure if neither?
      
      // merge
      } else if (type === 'merge') {
        if (!isObject(p[s])) throw new StoreError(`merge`, { currentPath });

        p[s] = Object.assign(p[s], value);
      }

      break;
    
    // If we reached a leaf, we override by setting an empty object
    } else if (isPrimitive(p[s])) {
      p[s] = {};
    }

    p = p[s];
  }

  // returning new data object
  return p[s];
};