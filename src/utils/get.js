export default function get(object, path) {
  let current = object;

  for (let idx = 0; idx < path.length; idx++) {
    // eslint-disable-next-line eqeqeq
    if (current == null) return current;
    current = current[path[idx]];
  }

  return current;
};