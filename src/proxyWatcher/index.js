import makeProxy from './makeProxy';
import { isBuiltinWithoutMutableMethods } from './utils';

export default function proxyWatcher(object, callback) {
  if (isBuiltinWithoutMutableMethods(object)) return object;
  return makeProxy(object, callback);
};
