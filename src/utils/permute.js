// TODO:  unit test
export default function permute(arr) {
  if (!arr) debugger;
  if (!arr.length) return arr;
  if (arr.length === 1) return [arr];

  const result = [];
  let idx = 0;
  while (idx < arr.length) {
    result.push(arr.slice(0, idx + 1));
    idx++;
  }
  return result;
};