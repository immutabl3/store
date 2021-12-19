import cloneDeepWith from 'lodash.clonedeepwith';
import {
  isPrimitive,
  isTypedArray,
} from '../types.js';
import {
  $TARGET,
} from '../consts.js';

export default function(obj) {
  return cloneDeepWith(obj, value => {
    // to support BigInt64Array and BigUint64Array
    if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
  });
};