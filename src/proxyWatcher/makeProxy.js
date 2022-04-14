export default function makeProxy(object, cache, traps) {
  if (cache.has(object)) return cache.get(object);
  
  const proxy = new Proxy(object, traps);
  cache.set(object, proxy);
  return proxy;
};