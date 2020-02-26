import get from './get';
import permute from './permute';
import isEqual2 from './isEqual2';
// import isEqual2 from 'lodash.isequal';
import isPrimitive from 'is-primitive';
import compare from './compare';
import {
  clone,
} from './cloner';
import {
  indexOf,
  indexOfCompare,
} from './indexOf';

const defer = fn => setTimeout(fn, 0);

const isEqual = (x, y) => {
  if (isPrimitive(x) || isPrimitive(y)) return Object.is(x, y);
  return isEqual2(x, y);
};

export {
  defer,
  get,
  isEqual,
  permute,
  clone,
  compare,
  indexOf,
  indexOfCompare,
};