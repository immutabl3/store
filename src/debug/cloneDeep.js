import {
  isTypedArray,
} from '../types';
import cloneDeepWith from 'lodash/cloneDeepWith';
import isPrimitive from 'is-primitive';
import {
  $TARGET,
} from '../consts';

export default function(obj) {
  return cloneDeepWith(obj, value => {
    // to support BigInt64Array and BigUint64Array
    if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
  });
};