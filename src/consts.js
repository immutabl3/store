// private proxy symbols
export const $TARGET = Symbol('proxy->target');
export const $PAUSE = Symbol('pause');
export const $RESUME = Symbol('resume');

// used to check array/object lengths
export const MAX_SAFE_INTEGER = 9007199254740991;

// private data key
export const DATA = Symbol('_data');

// used to stand-in for `undefined` hash values
export const HASH_UNDEFINED = Symbol('_hash_undefined');

// used to hash paths
export const PATH_DELIMITER = 'λ';

// used to compose bitmasks for comparisons
export const UNORDERED_COMPARE_FLAG = 1;
export const PARTIAL_COMPARE_FLAG = 2;

// we are assuming the following immutable methods don't get 
// messed with, and custom methods with the same name that 
// are mutating are not defined
export const STRICTLY_IMMUTABLE_METHODS = new Set([
  // OBJECT
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
    
  // ARRAY
  'includes',
  'indexOf',
  'join',
  'lastIndexOf',
  'toLocaleString',
  'toString',

  // MAP & SET
  'has',

  // DATE
  'getDate',
  'getDay',
  'getFullYear',
  'getHours',
  'getMilliseconds',
  'getMinutes',
  'getMonth',
  'getSeconds',
  'getTime',
  'getTime',
  'getTimezoneOffset',
  'getUTCDate',
  'getUTCDay',
  'getUTCFullYear',
  'getUTCHours',
  'getUTCMilliseconds',
  'getUTCMinutes',
  'getUTCMonth',
  'getUTCSeconds',
  'getYear',

  // REGEX
  'exec',
  'test',

  // TYPED ARRAY
  'subarray',
]);

export const LOOSELY_IMMUTABLE_ARRAY_METHODS = new Set([
  'concat',
  'entries',
  'every',
  'filter',
  'find',
  'findIndex',
  'forEach',
  'keys',
  'map',
  'reduce',
  'reduceRight',
  'slice',
  'some',
  'values',
]);
