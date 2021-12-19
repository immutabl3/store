import {
  isArray,
  isFunction,
  isNumber,
  isObject,
} from '../types.js';

const valid = () => true;

export default [
  ['set', 2, valid],
  ['unset', 1, valid],
  ['push', 2, valid],
  ['concat', 2, isArray],
  ['unshift', 2, valid],
  ['pop', 1, valid],
  ['shift', 1, valid],
  ['splice', 2, function(target) {
    if (!isArray(target) || target.length < 1) return false;
    if (target.length > 1 && isNaN(+target[1])) return false;
    return isNumber(target[0]) || isFunction(target[0]) || isObject(target[0]);
  }],
  ['merge', 2, isObject],
];