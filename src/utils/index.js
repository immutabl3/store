import get from './get';
import permute from './permute';
import isEqual from './isEqual';
import isEmpty from './isEmpty';
import compare from './compare';
import {
  clone,
  cloneDeep,
} from './clone';
import {
  indexOf,
  indexOfCompare,
} from './indexOf';

const defer = fn => setTimeout(fn, 0);

export {
  defer,
  get,
  isEqual,
  isEmpty,
  permute,
  clone,
  cloneDeep,
  compare,
  indexOf,
  indexOfCompare,
};