import {
  isPrimitive,
  isTypedArray,
} from '../../src/types';
import cloneWith from 'lodash/cloneWith';
import {
  $TARGET,
} from '../../src/consts';

export default function clone(obj) {
  return cloneWith(obj, value => {
    // to support BigInt64Array and BigUint64Array
    if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
  });
};