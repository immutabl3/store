import {
  isArray,
} from '../types.js';

const baseValueOf = Object.prototype.valueOf;
const baseToString = Object.prototype.toString;

export default function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    if (isArray(a)) {
      const length = a.length;
      if (length !== b.length) return false;
      for (let i = length; i-- !== 0;) {
        if (!equal(a[i], b[i])) return false;
      }
      return true;
    }

    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== baseValueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== baseToString) return a.toString() === b.toString();

    const keys = Object.keys(a);
    const length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (let i = length; i-- !== 0;) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    }

    for (let i = length; i-- !== 0;) {
      const key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
};