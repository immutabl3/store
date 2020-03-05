export default function permute(arr) {
  if (!arr || arr.length <= 1) return [];

  const result = [];
  let idx = 0;
  while (idx < arr.length - 1) {
    result.push(arr.slice(0, idx + 1));
    idx++;
  }
  return result;
};