export default function partialCompare(arr1, arr2) {
  if (arr1.length > arr2.length) return false;

  for (let idx = 0; idx < arr1.length; idx++) {
    if (arr1[idx] !== arr2[idx]) return false;
  }

  return true;
};