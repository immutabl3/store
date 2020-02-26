// `Object#toString` result references
export const argsTag = '[object Arguments]';
export const arrayTag = '[object Array]';
export const objectTag = '[object Object]';
export const boolTag = '[object Boolean]';
export const dateTag = '[object Date]';
export const errorTag = '[object Error]';
export const mapTag = '[object Map]';
export const numberTag = '[object Number]';
export const regexpTag = '[object RegExp]';
export const setTag = '[object Set]';
export const stringTag = '[object String]';
export const symbolTag = '[object Symbol]';
export const arrayBufferTag = '[object ArrayBuffer]';
export const dataViewTag = '[object DataView]';
// TODO: use these
// const int8Tag = '[object Int8Array]';
// const uint8Tag = '[object Uint8Array]';
// const uint8ClampedTag = '[object Uint8ClampedArray]';
// const int16Tag = '[object Int16Array]';
// const uint16Tag = '[object Uint16Array]';
// const int32Tag = '[object Int32Array]';
// const uint32Tag = '[object Uint32Array]';
// const float32Tag = '[object Float32Array]';
// const float64Tag = '[object Float64Array]';
// const bigint64Tag = '[object BigInt64Array]';
// const biguint64Tag = '[object BigUint64Array]';

export const arraySome = function(array, predicate) {
  let index = -1;
  const length = array ? array.length : 0;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
};

// used to check objects for own properties
export const hasOwnProperty = Object.prototype.hasOwnProperty;

// built-in value references
export const splice = Array.prototype.splice;

// Used to convert symbols to primitives and strings
export const symbolValueOf = Symbol.prototype.valueOf;

const objectToString = Object.prototype.toString;
export const getTag = value => objectToString.call(value);

export const isKeyable = value => {
  const type = typeof value;
  return (type === 'string' || type === 'number' || type === 'symbol' || type === 'boolean')
    ? (value !== '__proto__')
    : (value === null);
};

export const eq = (value, other) => {
  return value === other || (value !== value && other !== other);
};

export const assocIndexOf = (array, key) => {
  let length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
};