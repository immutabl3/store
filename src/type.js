export const isArray = target => Array.isArray(target);

export const isObject = target => (
  target &&
  typeof target === 'object' &&
  !Array.isArray(target) &&
  !(target instanceof Date) &&
  !(target instanceof RegExp) &&
  !(typeof Map === 'function' && target instanceof Map) &&
  !(typeof Set === 'function' && target instanceof Set)
);

export const isFunction = target => typeof target === 'function';