import StoreError from '../StoreError';
import update from './update';
import {
  coerce,
  solve,
} from '../query';

const resolvePathAndValue = function(arity, fn) {
  return function(first, second) {
    let path = first;
    let value = second;

    // handling arities
    if (arity === 2 && second === undefined) {
      value = path;
      path = [];
    }

    // coerce path
    path = path === undefined ? [] : coerce(path);
    
    return fn(path, value);
  };
};

export default function makeMethod(api, root, basePath, isRoot, name, arity, check) {
  api[name] = resolvePathAndValue(arity, function(path, value) {
    if (!check(value)) throw new StoreError(`${name}: invalid value`, { path, value });

    const solvedPath = path.length ? solve(root, path) : path;

    if (name === 'set' && !solvedPath.length) {
      if (isRoot) throw new StoreError(`cannot set store`);
      // setting the cursor
      update(
        root,
        basePath,
        name,
        value
      );
      return;
    }

    if (name === 'unset') {
      // unsetting the cursor
      if (!solvedPath.length) {
        if (isRoot) throw new StoreError(`cannot unset store`);
        update(
          root,
          basePath,
          name,
          value
        );
        return;
      }

      // don't unset irrelevant paths
      if (!api.exists(solvedPath)) return;
    }

    // applying the update
    update(root, basePath.concat(solvedPath), name, value);
  });
};