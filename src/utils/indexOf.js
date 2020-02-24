import compare from './compare';

export const indexOf = (arr, fn) => {
  let idx = 0;
  const len = arr.length;
  for (; idx < len; idx++) {
    if (fn(arr[idx])) return idx;
  }
  return -1;
};

export const indexOfCompare = (arr, item) => {
  let idx = 0;
  const len = arr.length;
  for (; idx < len; idx++) {
    if (compare(arr[idx], item)) return idx;
  }
  return -1;
};