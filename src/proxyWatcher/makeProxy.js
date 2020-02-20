import makeTraps from './makeTraps';
import { PROXY_CACHE } from './consts';

// TODO: Maybe use revocable Proxies, will the target object remain usable?
export default function makeProxy(object, callback, $PROXY, passedTraps) {
  if ($PROXY) {
    const proxy = PROXY_CACHE[$PROXY].get(object);
    if (proxy) return proxy;
  } else {
    // TODO: no param reassign
    // TODO: move symbol to constants
    // eslint-disable-next-line no-param-reassign
    $PROXY = Symbol('Target -> Proxy');
    PROXY_CACHE[$PROXY] = new WeakMap();
  }

  const traps = passedTraps || makeTraps(callback, $PROXY);
  const proxy = new Proxy(object, traps);
  PROXY_CACHE[$PROXY].set(object, proxy);
  return proxy;
};