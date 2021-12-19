import StoreError from '../StoreError.js';
import update from './update.js';
import {
  coerce,
  solve,
} from '../query.js';

const resolvePathAndValue = function(arity) {
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
    
    return { path, value };
  };
};

export default function makeMethod(prototype, name, arity, check) {
  const pathAndValue = resolvePathAndValue(arity);
  prototype[name] = function(first, second) {
    const { path, value } = pathAndValue(first, second);

    const { root, basePath, isRoot } = this;

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
      if (!this.exists(solvedPath)) return;
    }

    // applying the update
    update(root, basePath.concat(solvedPath), name, value);
  };
};