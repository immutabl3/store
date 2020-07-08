export default function get(object, path) {
  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    if (current === null || current === undefined) return current;
    current = current[path[idx]];
  }

  return current;
};