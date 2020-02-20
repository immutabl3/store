// TODO: refactor lodash
import _ from 'lodash';
import test from 'tape';
import watch from '../src/proxyWatcher';
import {
  $GET_RECORD_START,
  $GET_RECORD_STOP
} from '../src/proxyWatcher/consts';

const makeData = function(object) {
  let callsNr = 0;
  let paths = [];

  const [proxy, dispose] = watch(object, changedPaths => {
    callsNr++;
    paths = paths.concat(changedPaths);
  });

  return {
    object,
    proxy,
    dispose,
    get nr() {
      return callsNr;
    },
    get paths() {
      const result = paths;
      // resetting
      paths = [];
      return result;
    },
  };
};

test(`get invariants are respected`, assert => {
  assert.plan(3);

  const obj = {};

  Object.defineProperty(obj, 'nonWritable', {
    configurable: false,
    writable: false,
    value: { a: true },
  });

  Object.defineProperty(obj, 'nonReadable', {
    configurable: false,
    set: () => {},
  });

  const data = makeData(obj);

  assert.is(data.proxy.nonWritable, obj.nonWritable);
  assert.is(data.proxy.nonReadable, undefined);
  assert.is(data.nr, 0);

  assert.end();
});

test(`trap errors don't break things`, assert => {
  assert.plan(5);

  const obj = {
    foo: true,
    frozen: Object.freeze({}),
  };

  Object.defineProperty(obj, 'nonWritable', {
    configurable: false,
    writable: false,
    value: { a: true },
  });

  const data = makeData(obj);

  try {
    data.proxy.nonWritable = 123;
  } catch (err) {
    assert.true(err instanceof Error);
  }

  try {
    delete data.proxy.nonWritable;
  } catch (err) {
    assert.true(err instanceof Error);
  }

  try {
    data.proxy.frozen.foo = {};
  } catch (err) {
    assert.true(err instanceof Error);
  }

  assert.is(data.nr, 0);

  data.proxy.foo = false;

  assert.is(data.nr, 1);

  assert.end();
});

test(`watching immutable primitives doesn't throw an error`, assert => {
  const values = [
    null,
    undefined,
    123,
    123n,
    true,
    false,
    'string',
    Symbol(),
    /foo/g,
    new ArrayBuffer (123),
    new Number(123),
    new Boolean(true),
    new String('string'),
  ];

  assert.plan(values.length + 1);

  values.forEach(value => assert.is(value, watch(value)[0]));
  
  // NaN !== NaN, have to use isNaN
  const nan = NaN;
  assert.ok(Number.isNaN(watch(nan)[0]));

  assert.end();
});

test(`watching mutations nested inside symbols aren't detected`, assert => {
  assert.plan(3);

  const symbol = Symbol();
  const data = makeData({ [symbol]: { unreachable: true } });

  assert.true(data.proxy[symbol].unreachable);

  data.proxy[symbol].unreachable = false;

  assert.false(data.proxy[symbol].unreachable);

  assert.is(data.nr, 0);
  
  assert.end();
});

test(`assignment are also checked for equality`, assert => {
  assert.plan(1);

  const obj = {
    deep: {
      deeper: true,
    },
  };

  const data = makeData(obj);

  data.proxy.deep = { deeper: true };
  data.proxy.deep = { deeper: true };
  Object.defineProperty(data.proxy, 'deep', Object.getOwnPropertyDescriptor(data.proxy, 'deep'));
  Object.defineProperty(data.proxy, 'deep2', { configurable: true, value: { deeper: true } });
  Object.defineProperty(data.proxy, 'deep2', { configurable: true, value: { deeper: true } });

  assert.is(data.nr, 1);

  assert.end();
});

test(`can record get root paths`, assert => {
  assert.plan(2);

  const data = makeData({
    deep: {
      arr: [
        1,
        2,
        { foo: true },
        { zzz: true },
      ],
    },
  });

  assert.is(data.proxy[$GET_RECORD_START], true);

  data.proxy.deep.arr[0] = 1;
  data.proxy.deep.arr[1] = 2;
  data.proxy.deep.arr[2].foo = true;
  data.proxy.deep.arr[2].bar;

  assert.deepEqual(data.proxy[$GET_RECORD_STOP], [
    'deep',
    'deep',
    'deep',
    'deep',
  ]);

  assert.end();
});

test(`returns a disposer`, assert => {
  assert.plan(3);

  const obj = {
    deep: {
      deeper: true,
    },
  };

  const data = makeData(obj);

  data.proxy.deep.deeper = false; // In order to deeply proxy

  assert.is(data.nr, 1);

  const target = data.dispose();

  assert.is(target, obj);

  data.proxy.foo = true;
  data.proxy.deep.foo = true;
  data.proxy.deep.deeper = { foo: true };
  delete data.proxy.deep;

  assert.is(data.nr, 1);

  assert.end();
});

test('structures: basics', assert => {
  assert.plan(16);

  const data = makeData({ foo: true });

  data.proxy.foo;
  data.proxy.bar;
  data.proxy.foo = true;

  assert.is(data.nr, 0);

  data.proxy.bar = undefined;

  assert.is(data.nr, 1);
  assert.deepEqual(data.paths, ['bar']);

  data.proxy.foo = false;
  data.proxy.foo = false;

  assert.is(data.nr, 2);
  assert.deepEqual(data.paths, ['foo']);

  data.proxy.bar = { deep: true };
  data.proxy.bar = { deep: true };
  data.proxy.bar = { deep: true };

  assert.is(data.nr, 3);
  assert.deepEqual(data.paths, ['bar']);

  data.proxy.bar.deep = undefined;
  data.proxy.baz = undefined;
  delete data.proxy.bar.deep;
  delete data.proxy.bar.deep;
  delete data.proxy.bar;

  assert.is(data.nr, 7);
  assert.deepEqual(data.paths, ['bar.deep', 'baz', 'bar.deep', 'bar']);

  Object.defineProperty (data.proxy, 'bar', { value: 2 });
  Object.defineProperty (data.proxy, 'bar', { value: 2 });

  assert.is(data.nr, 8);
  assert.deepEqual(data.paths, ['bar']);

  assert.true(data.proxy.hasOwnProperty('foo'));
  assert.true('foo' in data.proxy);
  assert.false(data.proxy.hasOwnProperty('qux'));
  assert.false('qux' in data.proxy);

  assert.is(data.nr, 8);

  assert.end();
});

test('structures: accessors', assert => {
  assert.plan(3);

  const obj = {};

  const key = Symbol('accessor');
  Object.defineProperty(obj, 'accessor', {
    set(val) {
      this[key] = val;
    },
    get() {
      return this[key];
    },
  });

  const data = makeData(obj);

  data.proxy.accessor = 10;
  data.proxy.accessor = 10;

  assert.is(data.proxy.accessor, 10);
  assert.is(data.nr, 1);
  assert.deepEqual(data.paths, ['accessor']);

  assert.end();
});

test('structures: deep', assert => {
  assert.plan(3);

  const data = makeData({
    deep: {
      arr: [1, 2, { foo: true }, { zzz: true }],
      map: new Map ([['1', {}], ['2', {}]]),
      set: new Set ([{}, {}]),
    },
  });

  data.proxy.deep.arr[0] = 1;
  data.proxy.deep.arr[1] = 2;
  data.proxy.deep.arr[2].foo = true;

  assert.is(data.nr, 0);

  data.proxy.deep.arr[0] = -1;
  data.proxy.deep.arr[1] = -2;
  data.proxy.deep.arr[2].foo = false;
  data.proxy.deep.arr[2].bar = 123;
  data.proxy.deep.arr[4] = { other: true };
  data.proxy.deep.arr[4] = { other: false };
  data.proxy.deep.arr.forEach (x => x.zzz && (x.mod = true));
  data.proxy.deep.map.forEach(x => (x.mod = true));
  data.proxy.deep.set.forEach(x => (x.mod = true));

  _.merge(data.proxy, {
    root: true,
    deep: {
      deeper: {
        bottom: true,
      },
    },
  });

  _.merge(data.proxy, {
    root: false,
    deep: {
      deeper: {
        bottom: false,
      },
    },
  });

  assert.is(data.nr, 13);
  assert.deepEqual(data.paths, [
    'deep.arr.0',
    'deep.arr.1',
    'deep.arr.2.foo',
    'deep.arr.2.bar',
    'deep.arr.4',
    'deep.arr.4',
    'deep.arr.3.mod',
    'deep.map',
    'deep.set',
    'root',
    'deep.deeper',
    'root',
    'deep.deeper.bottom'
  ]);

  assert.end();
});

test('structures: primitives - tricky', assert => {
  assert.plan(3);

  const data = makeData({
    minInf: -Infinity,
    inf: Infinity,
    minZero: -0,
    zero: 0,
    nan: NaN,
    bigint: 1n,
  });

  data.proxy.minInf = -Infinity;
  data.proxy.inf = Infinity;
  data.proxy.minZero = -0;
  data.proxy.zero = 0;
  data.proxy.nan = NaN;
  data.proxy.bigint = 1n;

  assert.is(data.nr, 0);

  data.proxy.minInf = Infinity;
  data.proxy.inf = -Infinity;
  data.proxy.minZero = 0;
  data.proxy.zero = -0;
  data.proxy.nan = 0;
  data.proxy.bigint = 2n;

  assert.is(data.nr, 6);
  assert.deepEqual(data.paths, [
    'minInf',
    'inf',
    'minZero',
    'zero',
    'nan',
    'bigint'
  ]);

  assert.end();
});

test('structures: primitives - constructors', assert => {
  assert.plan(9);

  const data = makeData({
    fn: {
      symbol: Symbol(),
      bool: Boolean(true),
      str: String('string'),
      nr: Number(123),
    },
    new: {
      bool: new Boolean(true),
      str: new String('string'),
      nr: new Number(123),
    },
  });

  data.proxy.fn.symbol;
  data.proxy.fn.bool;
  data.proxy.fn.str;
  data.proxy.fn.nr;
  data.proxy.new.bool;
  data.proxy.new.str;
  data.proxy.new.nr;

  assert.is(data.nr, 0);

  data.proxy.fn.bool = true;
  data.proxy.fn.str = 'string';
  data.proxy.fn.nr = 123;

  assert.is(data.nr, 0);

  data.proxy.fn.symbol = Symbol();
  data.proxy.fn.bool = new Boolean(true);
  data.proxy.fn.str = new String('string');
  data.proxy.fn.nr = new Number(123);

  assert.is(data.nr, 4);
  assert.deepEqual(data.paths, ['fn.symbol', 'fn.bool', 'fn.str', 'fn.nr']);

  data.proxy.new.bool = new Boolean(true);
  data.proxy.new.str = new String('string');
  data.proxy.new.nr = new Number(123);

  assert.is(data.nr, 4);

  data.proxy.new.bool = true;
  data.proxy.new.str = 'string';
  data.proxy.new.nr = 123;

  assert.is(data.nr, 7);
  assert.deepEqual(data.paths, [
    'new.bool',
    'new.str',
    'new.nr',
  ]);

  delete data.proxy.fn.bool;
  delete data.proxy.fn.str;
  delete data.proxy.fn.nr;
  delete data.proxy.new.bool;
  delete data.proxy.new.str;
  delete data.proxy.new.nr;

  assert.is(data.nr, 13);
  assert.deepEqual(data.paths, [
    'fn.bool',
    'fn.str',
    'fn.nr',
    'new.bool',
    'new.str',
    'new.nr',
  ]);

  assert.end();
});

test('structures: Date', assert => {
  assert.plan(5);

  const data = makeData({ date: new Date() });

  data.proxy.date.getTime();
  data.proxy.date.getDate();
  data.proxy.date.getDay();
  data.proxy.date.getFullYear();
  data.proxy.date.getHours();
  data.proxy.date.getMilliseconds();
  data.proxy.date.getMinutes();
  data.proxy.date.getMonth();
  data.proxy.date.getSeconds();
  data.proxy.date.getTime();
  data.proxy.date.getTimezoneOffset();
  data.proxy.date.getUTCDate();
  data.proxy.date.getUTCDay();
  data.proxy.date.getUTCFullYear();
  data.proxy.date.getUTCHours();
  data.proxy.date.getUTCMilliseconds();
  data.proxy.date.getUTCMinutes();
  data.proxy.date.getUTCMonth();
  data.proxy.date.getUTCSeconds();
  data.proxy.date.getYear();

  assert.is(data.nr, 0);

  data.proxy.date.toDateString();
  data.proxy.date.toISOString();
  data.proxy.date.toJSON();
  data.proxy.date.toGMTString();
  data.proxy.date.toLocaleDateString();
  data.proxy.date.toLocaleString();
  data.proxy.date.toLocaleTimeString();
  data.proxy.date.toString();
  data.proxy.date.toTimeString();
  data.proxy.date.toUTCString();
  data.proxy.date.valueOf();

  assert.is(data.nr, 0);

  data.proxy.date.setDate(data.proxy.date.getDate());
  data.proxy.date.setFullYear(data.proxy.date.getFullYear());
  data.proxy.date.setHours(data.proxy.date.getHours());
  data.proxy.date.setMilliseconds(data.proxy.date.getMilliseconds());
  data.proxy.date.setMinutes(data.proxy.date.getMinutes());
  data.proxy.date.setMonth(data.proxy.date.getMonth());
  data.proxy.date.setSeconds(data.proxy.date.getSeconds());
  data.proxy.date.setTime(data.proxy.date.getTime());
  data.proxy.date.setUTCDate(data.proxy.date.getUTCDate());
  data.proxy.date.setUTCFullYear(data.proxy.date.getUTCFullYear());
  data.proxy.date.setUTCHours(data.proxy.date.getUTCHours());
  data.proxy.date.setUTCMilliseconds(data.proxy.date.getUTCMilliseconds());
  data.proxy.date.setUTCMinutes(data.proxy.date.getUTCMinutes());
  data.proxy.date.setUTCMonth(data.proxy.date.getUTCMonth());
  data.proxy.date.setUTCSeconds(data.proxy.date.getUTCSeconds());

  assert.is(data.nr, 0);

  // computing an always different valid value
  const increment = x => x % 2 + 1;

  data.proxy.date.setDate(increment(data.proxy.date.getDate()));
  data.proxy.date.setFullYear(increment(data.proxy.date.getFullYear()));
  data.proxy.date.setHours(increment(data.proxy.date.getHours()));
  data.proxy.date.setMilliseconds(increment(data.proxy.date.getMilliseconds()));
  data.proxy.date.setMinutes(increment(data.proxy.date.getMinutes()));
  data.proxy.date.setMonth(increment(data.proxy.date.getMonth()));
  data.proxy.date.setSeconds(increment(data.proxy.date.getSeconds()));
  data.proxy.date.setTime(increment(data.proxy.date.getTime()));
  data.proxy.date.setUTCDate(increment(data.proxy.date.getUTCDate()));
  data.proxy.date.setUTCFullYear(increment(data.proxy.date.getUTCFullYear()));
  data.proxy.date.setUTCHours(increment(data.proxy.date.getUTCHours()));
  data.proxy.date.setUTCMilliseconds(increment(data.proxy.date.getUTCMilliseconds()));
  data.proxy.date.setUTCMinutes(increment(data.proxy.date.getUTCMinutes()));
  data.proxy.date.setUTCMonth(increment(data.proxy.date.getUTCMonth()));
  data.proxy.date.setUTCSeconds(increment(data.proxy.date.getUTCSeconds()));

  assert.is(data.nr, 15);
  assert.deepEqual(data.paths, [
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
    'date',
  ]);

  assert.end();
});

test('structures: RegExp', assert => {
  assert.plan(3);

  const data = makeData({ re: /foo/gi });

  data.proxy.re.lastIndex;
  data.proxy.re.source;

  assert.is(data.nr, 0);

  data.proxy.re.lastIndex = data.proxy.re.lastIndex;

  assert.is(data.nr, 0);

  data.proxy.re.exec('foo');
  data.proxy.re.test('foo');
  'foo'.match(data.proxy.re);
  'foo'.matchAll(data.proxy.re);
  'foo'.replace(data.proxy.re, '');
  'foo'.search(data.proxy.re);
  'foo'.split(data.proxy.re);

  assert.is(data.nr, 0);

  // TODO: FIXME: https://github.com/lodash/lodash/issues/4645
  // data.proxy.re.lastIndex = -10;

  // t.is(data.nr, 1);
  // t.deepEqual(data.paths, ['re.lastIndex']);

  assert.end();
});

test('structures: function', assert => {
  assert.plan(3);

  const data = makeData({ fn() {} });

  data.proxy.fn.length;
  data.proxy.fn.name;
  data.proxy.fn.displayName;

  assert.is(data.nr, 0);

  data.proxy.fn.displayName = 'Name';

  assert.is(data.nr, 1);
  assert.deepEqual(data.paths, ['fn.displayName']);

  assert.end();
});

test('structures: Array', assert => {
  assert.plan(8);

  const data = makeData({ arr: [2, 1, 3] });

  data.proxy.arr.constructor;
  assert.is(data.proxy.arr.length, 3);

  assert.is(data.nr, 0);

  data.proxy.arr.concat(4);
  data.proxy.arr.entries();
  data.proxy.arr.every(() => false);
  data.proxy.arr.filter(() => false);
  data.proxy.arr.find(() => false);
  data.proxy.arr.findIndex(() => false);
  data.proxy.arr.forEach(() => {});
  data.proxy.arr.includes(1);
  data.proxy.arr.indexOf(1);
  data.proxy.arr.join();
  data.proxy.arr.keys();
  data.proxy.arr.lastIndexOf(1);
  data.proxy.arr.map(() => false);
  data.proxy.arr.reduce(() => ({}));
  data.proxy.arr.reduceRight(() => ({}));
  data.proxy.arr.slice();
  data.proxy.arr.some(() => false);
  data.proxy.arr.toLocaleString();
  data.proxy.arr.toString();
  data.proxy.arr.values();

  assert.is(data.nr, 0);

  data.proxy.arr.length = 10;

  assert.is(data.nr, 1);
  assert.deepEqual(data.paths, ['arr.length']);

  data.proxy.arr.copyWithin(0, 0, 0);
  data.proxy.arr.push();
  data.proxy.arr.splice(0, 0);

  assert.is(data.nr, 1);

  data.proxy.arr.copyWithin(0, 1, 2);
  data.proxy.arr.fill(0);
  data.proxy.arr.pop();
  data.proxy.arr.push(-1, -2, -3);
  data.proxy.arr.reverse();
  data.proxy.arr.shift();
  data.proxy.arr.sort();
  data.proxy.arr.splice(0, 1, 2);
  data.proxy.arr.unshift(5);

  assert.is(data.nr, 44);
  assert.deepEqual(data.paths, [
    'arr.0',
    'arr',
    'arr.0',
    'arr.1',
    'arr.2',
    'arr.3',
    'arr.4',
    'arr.5',
    'arr.6',
    'arr.7',
    'arr.8',
    'arr.9',
    'arr',
    'arr.9',
    'arr.length',
    'arr',
    'arr.9',
    'arr.10',
    'arr.11',
    'arr',
    'arr.0',
    'arr.11',
    'arr.1',
    'arr.10',
    'arr.2',
    'arr.9',
    'arr',
    'arr.0',
    'arr.1',
    'arr.2',
    'arr.11',
    'arr.length',
    'arr',
    'arr.0',
    'arr.1',
    'arr',
    'arr.0',
    'arr',
    'arr.11',
    'arr.2',
    'arr.1',
    'arr.0',
    'arr',
  ]);

  assert.end();
});

test('structures: ArrayBuffer', assert => {
  assert.plan(2);

  const data = makeData({ arr: new ArrayBuffer(12) });

  data.proxy.arr.constructor;
  data.proxy.arr.byteLength;

  assert.is(data.nr, 0);

  data.proxy.arr.slice (0, 8);

  assert.is(data.nr, 0);

  assert.end();
});

test('structures: typed arrays', assert => {
  const Constructors = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    global.BigInt64Array,
    global.BigUint64Array,
  ];

  assert.plan(Constructors.length * 5);

  Constructors.forEach(Constructor => {
    const data = makeData({
      arr: new Constructor(new ArrayBuffer(24)),
    });

    data.proxy.arr.constructor;
    data.proxy.arr.constructor.name;
    data.proxy.arr.BYTES_PER_ELEMENT;
    data.proxy.arr.byteLength;
    data.proxy.arr.byteOffset;
    data.proxy.arr.buffer;

    assert.is(data.nr, 0);

    data.proxy.arr.entries();
    data.proxy.arr.every (() => false);
    data.proxy.arr.filter (() => false);
    data.proxy.arr.find (() => false);
    data.proxy.arr.findIndex (() => false);
    data.proxy.arr.forEach (() => {});
    data.proxy.arr.includes (1);
    data.proxy.arr.indexOf (1);
    data.proxy.arr.join();
    data.proxy.arr.keys();
    data.proxy.arr.lastIndexOf (1);
    data.proxy.arr.map (() => false);
    data.proxy.arr.reduce (() => ({}));
    data.proxy.arr.reduceRight (() => ({}));
    data.proxy.arr.slice();
    data.proxy.arr.some (() => false);
    data.proxy.arr.subarray();
    data.proxy.arr.toLocaleString();
    data.proxy.arr.toString();
    data.proxy.arr.values();

    assert.is(data.nr, 0);

    data.proxy.arr.copyWithin (0, 0, 0);

    assert.is(data.nr, 0);

    const sampleDigit = data.proxy.arr.constructor.name.startsWith ('Big') ? 1n : 1;

    data.proxy.arr.set ([sampleDigit]);
    data.proxy.arr.copyWithin (1, 0, 1);
    data.proxy.arr.reverse();
    data.proxy.arr.fill (sampleDigit);

    assert.is(data.nr, 4);
    assert.deepEqual(data.paths, ['arr', 'arr', 'arr', 'arr']);
  });

  assert.end();
});

test('structures: Map', assert => {
  assert.plan(6);

  // TODO: test with reversal of keys to values
  const data = makeData({
    map: new Map([
      ['1', 1],
      ['2', 2],
    ])
  });

  data.proxy.map.constructor;
  data.proxy.map.length;
  assert.is(data.proxy.map.size, 2);

  assert.is(data.nr, 0);

  data.proxy.map.entries();
  data.proxy.map.forEach(() => {});
  data.proxy.map.has('1');
  data.proxy.map.keys();
  data.proxy.map.values();
  data.proxy.map.get('1');

  assert.is(data.nr, 0);

  data.proxy.map.delete('none');
  data.proxy.map.set('1', 1);

  assert.is(data.nr, 0);

  data.proxy.map.delete('1');
  data.proxy.map.clear();
  data.proxy.map.set('4', 4);

  assert.is(data.nr, 3);
  assert.deepEqual(data.paths, ['map', 'map', 'map']);

  assert.end();
});

test('structures: WeakMap', assert => {
  assert.plan(4);

  const data = makeData({
    weakmap: new WeakMap(),
  });

  assert.is(data.proxy.weakmap.constructor.name, 'WeakMap');

  data.proxy.weakmap.has ('foo');

  assert.is(data.nr, 0);

  data.proxy.weakmap = data.proxy.weakmap;

  assert.is(data.nr, 0);

  data.proxy.weakmap = new WeakMap();

  assert.is(data.nr, 1);

  assert.end();
});

test('structures: Set', assert => {
  assert.plan(6);

  const data = makeData({
    set: new Set([1, 2]),
  });

  data.proxy.set.constructor;
  assert.is(data.proxy.set.size, 2);

  assert.is(data.nr, 0);

  data.proxy.set.entries();
  data.proxy.set.forEach(() => {});
  data.proxy.set.has(1);
  data.proxy.set.keys();
  data.proxy.set.values();

  assert.is(data.nr, 0);

  data.proxy.set.delete('none');
  data.proxy.set.add(1);

  assert.is(data.nr, 0);

  data.proxy.set.add(3);
  data.proxy.set.delete(1);
  data.proxy.set.clear();

  assert.is(data.nr, 3);
  assert.deepEqual(data.paths, ['set', 'set', 'set']);

  assert.end();
});

test('structures: WeakSet', assert => {
  assert.plan(4);

  const data = makeData({
    weakset: new WeakSet(),
  });

  assert.is(data.proxy.weakset.constructor.name, 'WeakSet');

  data.proxy.weakset.has('foo');

  assert.is(data.nr, 0);

  data.proxy.weakset = data.proxy.weakset;

  assert.is(data.nr, 0);

  data.proxy.weakset = new WeakSet();

  assert.is(data.nr, 1);

  assert.end();
});

test('structures: Promise', async assert => {
  assert.plan(10);

  const data = makeData({
    string: Promise.resolve('string'),
    number: Promise.resolve(123),
    arr: Promise.resolve([1, 2, 3]),
    obj: Promise.resolve({ foo: true }),
    set: Promise.resolve(new Set([1, 2, 3])),
    deep: Promise.resolve(Promise.resolve({ deep: true })),
  });

  assert.is(await data.proxy.string, 'string');
  assert.is(await data.proxy.number, 123);
  assert.deepEqual(await data.proxy.arr, [1, 2, 3]);
  assert.deepEqual(await data.proxy.obj, { foo: true });
  assert.deepEqual(await data.proxy.set, new Set([1, 2, 3]));
  assert.deepEqual(await data.proxy.deep, { deep: true });
  assert.is(data.nr, 0);

  data.proxy.string = data.proxy.string;
  data.proxy.number = data.proxy.number;
  data.proxy.arr = data.proxy.arr;
  data.proxy.obj = data.proxy.obj;
  data.proxy.set = data.proxy.set;
  data.proxy.deep = data.proxy.deep;
  assert.is(data.nr, 0);

  await data.proxy.arr.then(arr => (arr[0] = 1));
  await data.proxy.obj.then(obj => (obj.foo = true));
  await data.proxy.set.then(set => set.delete(4));
  await data.proxy.set.then(set => set.has(4));
  await data.proxy.deep.then(obj => (obj.deep = true));
  assert.is(data.nr, 0);

  data.proxy.string = Promise.resolve('string');
  data.proxy.number = Promise.resolve(123);
  data.proxy.arr = Promise.resolve([1, 2, 3]);
  data.proxy.obj = Promise.resolve({ foo: true });
  data.proxy.set = Promise.resolve(new Set([1, 2, 3]));
  data.proxy.deep = Promise.resolve(Promise.resolve({ deep: true }));
  assert.is(data.nr, 6);

  // data.proxy.arr.then(arr => arr[0] = 2);
  // data.proxy.arr.then(arr => arr.push( 4 ));
  // data.proxy.obj.then(obj => obj.foo = false);
  // data.proxy.set.then(set => set.delete( 1 ));
  // data.proxy.deep.then(obj => obj.deep = false);
  // TODO: Detect changes happening inside promises
  // t.is(data.nr, 11);

  assert.end();
});