import {
  isTypedArray,
} from '../types';
import cloneWith from 'lodash/cloneWith';
import cloneDeepWith from 'lodash/cloneDeepWith';
import isPrimitive from 'is-primitive';
import {
  $TARGET,
} from '../consts';

const cloneCustomizer = value => {
  // to support BigInt64Array and BigUint64Array
  if (!isPrimitive(value) && isTypedArray(value)) return (value[$TARGET] || value).slice();
};

export const clone = x => cloneWith(x, cloneCustomizer);

export const cloneDeep = x => cloneDeepWith(x, cloneCustomizer);