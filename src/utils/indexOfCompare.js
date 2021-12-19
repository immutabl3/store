import compare from './compare.js';

export default (arr, item) => {
  let idx = 0;
  const len = arr.length;
  for (; idx < len; idx++) {
    if (compare(arr[idx], item)) return idx;
  }
  return -1;
};