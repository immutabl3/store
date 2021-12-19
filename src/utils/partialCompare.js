import {
  isArray,
} from '../types.js';

export default function partialCompare(arr1, arr2, arr3) {
  const isArrayValue = isArray(arr3);
  const combinedLength = arr2.length + (isArrayValue ? arr3.length : 0);
  
  if (arr1.length > combinedLength) return false;

  for (let idx = 0; idx < arr1.length; idx++) {
    if (isArrayValue && idx >= arr2.length) {
      if (arr1[idx] !== arr3[idx - arr2.length]) return false;
      continue;
    }
    if (arr1[idx] !== arr2[idx]) return false;
  }

  return true;
};