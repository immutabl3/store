export default (arr, fn) => {
  let idx = 0;
  const len = arr.length;
  for (; idx < len; idx++) {
    if (fn(arr[idx])) return idx;
  }
  return -1;
};