import {
  isTypedArray,
} from '../../src/types';
import cloneWith from 'lodash/cloneWith';
import isPrimitive from 'is-primitive';
import {
  $TARGET,
} from '../../src/consts';

export default function(obj) {
  return cloneWith(obj, value => {
    // to support BigInt64Array and BigUint64Array
    if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
  });
};