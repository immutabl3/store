import {
  isPrimitive,
  isTypedArray,
} from '../../src/types.js';
import cloneWith from 'lodash/cloneWith.js';
import {
  $TARGET,
} from '../../src/consts.js';

export default function clone(obj) {
  return cloneWith(obj, value => {
    // to support BigInt64Array and BigUint64Array
    if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
  });
};