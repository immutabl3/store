// TODO: use constant util
import constant from 'lodash/constant';
import makeProxy from './makeProxy';
import {
  isBuiltinWithoutMutableMethods,
} from './utils';

export default function proxyWatcher(object, callback) {
  if (isBuiltinWithoutMutableMethods(object)) return [object, constant(object)];
  return makeProxy(object, callback);
};
