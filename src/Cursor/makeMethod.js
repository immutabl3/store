import StoreError from '../StoreError';
import query from '../query';
import update from './update';

const resolvePathAndValue = function(arity, fn) {
  return function(first, second) {
    const length = arguments.length;

    let path = first;
    let value = second;

    // we should warn the user if he applies to many arguments to the function
    if (length > arity) throw new StoreError(`${name}: too many arguments`);

    // handling arities
    if (arity === 2 && length === 1) {
      value = path;
      path = [];
    }

    // coerce path
    path = path === undefined ? [] : query.coerce(path);
    
    return fn(path, value);
  };
};

export default function makeMethod(api, root, basePath, isRoot, name, arity, check) {
  api[name] = resolvePathAndValue(arity, function(path, value) {
    if (!check(value)) throw new StoreError(`${name}: invalid value`, { path, value });

    const solvedPath = path.length ? query.solve(api.data, path) : path;
    if (path.length !== solvedPath.length) throw new StoreError(`${name}: invalid path`, { path, value });

    if (name === 'unset') {
      // unsetting the cursor
      if (!solvedPath.length) {
        if (isRoot) throw new StoreError(`cannot unset store`);
        return (api.data = update(
          root,
          basePath,
          name,
          value
        ));
      }

      // don't unset irrelevant paths
      if (!api.exists(solvedPath)) return;
    }
    
    if (name === 'set' && !solvedPath.length) {
      if (isRoot) throw new StoreError(`cannot set store`);
      // setting the cursor
      return (api.data = update(
        root,
        basePath,
        name,
        value
      ));
    }

    // applying the update
    return update(api.data, solvedPath, name, value);
  });
};