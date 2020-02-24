export const $TARGET = Symbol('proxy->target');
export const $PAUSE = Symbol('pause');
export const $RESUME = Symbol('resume');

export const PATH_DELIMITER = 'λ';

// We are assuming the following immutable methods don't get 
// messed up with, and custom methods with the same name that 
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
