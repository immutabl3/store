import {
  isPrimitive,
  isTypedArray,
} from '../types';
// TODO: use npm package
import cloneDeepWith from 'lodash/cloneDeepWith';
import {
  $TARGET,
} from '../consts';

export default function(obj) {
  return cloneDeepWith(obj, value => {
    // to support BigInt64Array and BigUint64Array
    if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
  });
};