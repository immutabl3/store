// hashing the path similar to
// https://github.com/Yomguithereal/baobab/blob/master/src/helpers.js#L474
// however, we have a check to see if the path is dynamic 
// (and to solve) before hashing, so it's simplified
export default function hashPath(path) {
  return path.length ? path.join('λ') : '';
};