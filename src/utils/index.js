import get from './get';
import permute from './permute';
import isEqual from './isEqual';
import compare from './compare';
import {
  clone,
} from './cloner';
import {
  indexOf,
  indexOfCompare,
} from './indexOf';

const defer = fn => setTimeout(fn, 0);

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