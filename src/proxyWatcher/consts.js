// TODO: FIXME: This looks like a potential memory leak source, symbols 
// and associated maps are never garbage collected if the watched objects 
// get garbage collected without being disposed of first
export const PROXY_CACHE = {};

export const $TARGET = Symbol('Proxy -> Target');
export const $STOP = Symbol('Stop proxying');
export const $GET_RECORD_START = Symbol('Start recording get paths');
export const $GET_RECORD_STOP = Symbol('Stop recording get paths');

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

export const LOOSELY_IMMUTABLE_METHODS = {
  array: new Set([
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
  ]),
  others: new Set([
    // MAP & SET
    'entries',
    'forEach',
    'get',
    'keys',
    'values',
  ]),
};
