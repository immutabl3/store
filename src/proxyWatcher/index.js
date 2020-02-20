import constant from 'lodash/constant';
import makeProxy from './makeProxy';
import {
  isBuiltinWithoutMutableMethods,
} from './utils';
import {
  $STOP,
} from './consts';

export default function proxyWatcher(object, callback) {
  if (isBuiltinWithoutMutableMethods(object)) return [object, constant(object)];
  
  const proxy = makeProxy(object, callback);
  const disposer = () => proxy[$STOP] || object;
  return [proxy, disposer];
};
