import merge from 'lodash/merge';
import test from 'tape';
import watch from '../src/proxyWatcher';

const Watcher = function(object) {
  let changes = 0;
  let paths = [];

  const proxy = watch(object, changedPath => {
    changes++;
    paths = [...paths, changedPath];
  });

  return [
    proxy,
    {
      get changes() {
        return changes;
      },
      get paths() {
        const result = paths;
        // resetting
        paths = [];
        return result;
      },
    },
  ];
};

test(`proxyWatcher: get invariants are respected`, assert => {
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

  const [proxy, watcher] = Watcher(obj);

  assert.is(proxy.nonWritable, obj.nonWritable);
  assert.is(proxy.nonReadable, undefined);
  assert.is(watcher.changes, 0);

  assert.end();
});

test(`proxyWatcher: trap errors don't break things`, assert => {
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

  const [proxy, watcher] = Watcher(obj);

  try {
    proxy.nonWritable = 123;
  } catch (err) {
    assert.true(err instanceof Error);
  }

  try {
    delete proxy.nonWritable;
  } catch (err) {
    assert.true(err instanceof Error);
  }

  try {
    proxy.frozen.foo = {};
  } catch (err) {
    assert.true(err instanceof Error);
  }

  assert.is(watcher.changes, 0);

  proxy.foo = false;

  assert.is(watcher.changes, 1);

  assert.end();
});

test(`proxyWatcher: watching immutable primitives doesn't throw an error`, assert => {
  assert.plan(14);

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
    new ArrayBuffer(123),
    new Number(123),
    new Boolean(true),
    new String('string'),
  ];

  values.forEach(value => assert.is(value, watch(value)));
  
  // NaN !== NaN, have to use isNaN
  assert.ok(Number.isNaN(watch(NaN)));

  assert.end();
});

test(`proxyWatcher: watching mutations nested inside symbols aren't detected`, assert => {
  assert.plan(3);

  const symbol = Symbol();
  const [proxy, watcher] = Watcher({
    [symbol]: {
      unreachable: true,
    },
  });

  assert.true(proxy[symbol].unreachable);

  proxy[symbol].unreachable = false;

  assert.false(proxy[symbol].unreachable);

  assert.is(watcher.changes, 0);
  
  assert.end();
});

test(`proxyWatcher: assignment are also checked for equality`, assert => {
  assert.plan(1);

  const [proxy, watcher] = Watcher({
    deep: {
      deeper: true,
    },
  });

  proxy.deep = { deeper: true };
  proxy.deep = { deeper: true };
  Object.defineProperty(proxy, 'deep', Object.getOwnPropertyDescriptor(proxy, 'deep'));
  Object.defineProperty(proxy, 'deep2', { configurable: true, value: { deeper: true } });
  Object.defineProperty(proxy, 'deep2', { configurable: true, value: { deeper: true } });

  assert.is(watcher.changes, 1);

  assert.end();
});

test('proxyWatcher: structures: basics', assert => {
  assert.plan(16);

  const [proxy, watcher] = Watcher({ foo: true });

  proxy.foo;
  proxy.bar;
  proxy.foo = true;

  assert.is(watcher.changes, 0);

  proxy.bar = undefined;

  assert.is(watcher.changes, 1);
  assert.deepEqual(watcher.paths, [
    ['bar'],
  ]);

  proxy.foo = false;
  proxy.foo = false;

  assert.is(watcher.changes, 2);
  assert.deepEqual(watcher.paths, [
    ['foo'],
  ]);

  proxy.bar = { deep: true };
  proxy.bar = { deep: true };
  proxy.bar = { deep: true };

  assert.is(watcher.changes, 3);
  assert.deepEqual(watcher.paths, [
    ['bar'],
  ]);

  proxy.bar.deep = undefined;
  proxy.baz = undefined;
  delete proxy.bar.deep;
  delete proxy.bar.deep;
  delete proxy.bar;

  assert.is(watcher.changes, 7);
  assert.deepEqual(watcher.paths, [
    ['bar', 'deep'],
    ['baz'],
    ['bar', 'deep'],
    ['bar'],
  ]);

  Object.defineProperty(proxy, 'bar', { value: 2 });
  Object.defineProperty(proxy, 'bar', { value: 2 });

  assert.is(watcher.changes, 8);
  assert.deepEqual(watcher.paths, [
    ['bar'],
  ]);

  assert.true(proxy.hasOwnProperty('foo'));
  assert.true('foo' in proxy);
  assert.false(proxy.hasOwnProperty('qux'));
  assert.false('qux' in proxy);

  assert.is(watcher.changes, 8);

  assert.end();
});

test('proxyWatcher: structures: accessors', assert => {
  assert.plan(3);

  const [proxy, watcher] = Watcher((function() {
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

    return obj;
  }()));

  proxy.accessor = 10;
  proxy.accessor = 10;

  assert.is(proxy.accessor, 10);
  assert.is(watcher.changes, 1);
  assert.deepEqual(watcher.paths, [
    ['accessor'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: deep', assert => {
  assert.plan(3);

  const [proxy, watcher] = Watcher({
    deep: {
      arr: [1, 2, { foo: true }, { zzz: true }],
      map: new Map ([['1', {}], ['2', {}]]),
      set: new Set ([{}, {}]),
    },
  });

  proxy.deep.arr[0] = 1;
  proxy.deep.arr[1] = 2;
  proxy.deep.arr[2].foo = true;

  assert.is(watcher.changes, 0);

  proxy.deep.arr[0] = -1;
  proxy.deep.arr[1] = -2;
  proxy.deep.arr[2].foo = false;
  proxy.deep.arr[2].bar = 123;
  proxy.deep.arr[4] = { other: true };
  proxy.deep.arr[4] = { other: false };
  proxy.deep.arr.forEach (x => x.zzz && (x.mod = true));
  proxy.deep.map.forEach(x => (x.mod = true));
  proxy.deep.set.forEach(x => (x.mod = true));

  merge(proxy, {
    root: true,
    deep: {
      deeper: {
        bottom: true,
      },
    },
  });

  merge(proxy, {
    root: false,
    deep: {
      deeper: {
        bottom: false,
      },
    },
  });

  assert.is(watcher.changes, 13);
  assert.deepEqual(watcher.paths, [
    ['deep', 'arr', 0],
    ['deep', 'arr', 1],
    ['deep', 'arr', 2, 'foo'],
    ['deep', 'arr', 2, 'bar'],
    ['deep', 'arr', 4],
    ['deep', 'arr', 4],
    ['deep', 'arr', 3, 'mod'],
    ['deep', 'map'],
    ['deep', 'set'],
    ['root'],
    ['deep', 'deeper'],
    ['root'],
    ['deep', 'deeper', 'bottom'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: primitives - tricky', assert => {
  assert.plan(3);

  const [proxy, watcher] = Watcher({
    minInf: -Infinity,
    inf: Infinity,
    minZero: -0,
    zero: 0,
    nan: NaN,
    bigint: 1n,
  });

  proxy.minInf = -Infinity;
  proxy.inf = Infinity;
  proxy.minZero = -0;
  proxy.zero = 0;
  proxy.nan = NaN;
  proxy.bigint = 1n;

  assert.is(watcher.changes, 0);

  proxy.minInf = Infinity;
  proxy.inf = -Infinity;
  proxy.minZero = 0;
  proxy.zero = -0;
  proxy.nan = 0;
  proxy.bigint = 2n;

  assert.is(watcher.changes, 6);
  assert.deepEqual(watcher.paths, [
    ['minInf'],
    ['inf'],
    ['minZero'],
    ['zero'],
    ['nan'],
    ['bigint'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: primitives - constructors', assert => {
  assert.plan(9);

  const [proxy, watcher] = Watcher({
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

  proxy.fn.symbol;
  proxy.fn.bool;
  proxy.fn.str;
  proxy.fn.nr;
  proxy.new.bool;
  proxy.new.str;
  proxy.new.nr;

  assert.is(watcher.changes, 0);

  proxy.fn.bool = true;
  proxy.fn.str = 'string';
  proxy.fn.nr = 123;

  assert.is(watcher.changes, 0);

  proxy.fn.symbol = Symbol();
  proxy.fn.bool = new Boolean(true);
  proxy.fn.str = new String('string');
  proxy.fn.nr = new Number(123);

  assert.is(watcher.changes, 4);
  assert.deepEqual(watcher.paths, [
    ['fn', 'symbol'],
    ['fn', 'bool'],
    ['fn', 'str'],
    ['fn', 'nr'],
  ]);

  proxy.new.bool = new Boolean(true);
  proxy.new.str = new String('string');
  proxy.new.nr = new Number(123);

  assert.is(watcher.changes, 4);

  proxy.new.bool = true;
  proxy.new.str = 'string';
  proxy.new.nr = 123;

  assert.is(watcher.changes, 7);
  assert.deepEqual(watcher.paths, [
    ['new', 'bool'],
    ['new', 'str'],
    ['new', 'nr'],
  ]);

  delete proxy.fn.bool;
  delete proxy.fn.str;
  delete proxy.fn.nr;
  delete proxy.new.bool;
  delete proxy.new.str;
  delete proxy.new.nr;

  assert.is(watcher.changes, 13);
  assert.deepEqual(watcher.paths, [
    ['fn', 'bool'],
    ['fn', 'str'],
    ['fn', 'nr'],
    ['new', 'bool'],
    ['new', 'str'],
    ['new', 'nr'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: Date', assert => {
  assert.plan(5);

  const [proxy, watcher] = Watcher({ date: new Date() });

  proxy.date.getTime();
  proxy.date.getDate();
  proxy.date.getDay();
  proxy.date.getFullYear();
  proxy.date.getHours();
  proxy.date.getMilliseconds();
  proxy.date.getMinutes();
  proxy.date.getMonth();
  proxy.date.getSeconds();
  proxy.date.getTime();
  proxy.date.getTimezoneOffset();
  proxy.date.getUTCDate();
  proxy.date.getUTCDay();
  proxy.date.getUTCFullYear();
  proxy.date.getUTCHours();
  proxy.date.getUTCMilliseconds();
  proxy.date.getUTCMinutes();
  proxy.date.getUTCMonth();
  proxy.date.getUTCSeconds();
  proxy.date.getYear();

  assert.is(watcher.changes, 0);

  proxy.date.toDateString();
  proxy.date.toISOString();
  proxy.date.toJSON();
  proxy.date.toGMTString();
  proxy.date.toLocaleDateString();
  proxy.date.toLocaleString();
  proxy.date.toLocaleTimeString();
  proxy.date.toString();
  proxy.date.toTimeString();
  proxy.date.toUTCString();
  proxy.date.valueOf();

  assert.is(watcher.changes, 0);

  proxy.date.setDate(proxy.date.getDate());
  proxy.date.setFullYear(proxy.date.getFullYear());
  proxy.date.setHours(proxy.date.getHours());
  proxy.date.setMilliseconds(proxy.date.getMilliseconds());
  proxy.date.setMinutes(proxy.date.getMinutes());
  proxy.date.setMonth(proxy.date.getMonth());
  proxy.date.setSeconds(proxy.date.getSeconds());
  proxy.date.setTime(proxy.date.getTime());
  proxy.date.setUTCDate(proxy.date.getUTCDate());
  proxy.date.setUTCFullYear(proxy.date.getUTCFullYear());
  proxy.date.setUTCHours(proxy.date.getUTCHours());
  proxy.date.setUTCMilliseconds(proxy.date.getUTCMilliseconds());
  proxy.date.setUTCMinutes(proxy.date.getUTCMinutes());
  proxy.date.setUTCMonth(proxy.date.getUTCMonth());
  proxy.date.setUTCSeconds(proxy.date.getUTCSeconds());

  assert.is(watcher.changes, 0);

  // computing an always different valid value
  const increment = x => x % 2 + 1;

  proxy.date.setDate(increment(proxy.date.getDate()));
  proxy.date.setFullYear(increment(proxy.date.getFullYear()));
  proxy.date.setHours(increment(proxy.date.getHours()));
  proxy.date.setMilliseconds(increment(proxy.date.getMilliseconds()));
  proxy.date.setMinutes(increment(proxy.date.getMinutes()));
  proxy.date.setMonth(increment(proxy.date.getMonth()));
  proxy.date.setSeconds(increment(proxy.date.getSeconds()));
  proxy.date.setTime(increment(proxy.date.getTime()));
  proxy.date.setUTCDate(increment(proxy.date.getUTCDate()));
  proxy.date.setUTCFullYear(increment(proxy.date.getUTCFullYear()));
  proxy.date.setUTCHours(increment(proxy.date.getUTCHours()));
  proxy.date.setUTCMilliseconds(increment(proxy.date.getUTCMilliseconds()));
  proxy.date.setUTCMinutes(increment(proxy.date.getUTCMinutes()));
  proxy.date.setUTCMonth(increment(proxy.date.getUTCMonth()));
  proxy.date.setUTCSeconds(increment(proxy.date.getUTCSeconds()));

  assert.is(watcher.changes, 15);
  assert.deepEqual(watcher.paths, [
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
    ['date'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: RegExp', assert => {
  assert.plan(3);

  const [proxy, watcher] = Watcher({ re: /foo/gi });

  proxy.re.lastIndex;
  proxy.re.source;

  assert.is(watcher.changes, 0);

  proxy.re.lastIndex = proxy.re.lastIndex;

  assert.is(watcher.changes, 0);

  proxy.re.exec('foo');
  proxy.re.test('foo');
  'foo'.match(proxy.re);
  'foo'.matchAll(proxy.re);
  'foo'.replace(proxy.re, '');
  'foo'.search(proxy.re);
  'foo'.split(proxy.re);

  assert.is(watcher.changes, 0);

  // TODO: FIXME: https://github.com/lodash/lodash/issues/4645
  // proxy.re.lastIndex = -10;

  // assert.is(data.changes, 1);
  // assert.deepEqual(data.paths, ['re.lastIndex']);

  assert.end();
});

test('proxyWatcher: structures: function', assert => {
  assert.plan(3);

  const [proxy, watcher] = Watcher({ fn() {} });

  proxy.fn.length;
  proxy.fn.name;
  proxy.fn.displayName;

  assert.is(watcher.changes, 0);

  proxy.fn.displayName = 'Name';

  assert.is(watcher.changes, 1);
  assert.deepEqual(watcher.paths, [
    ['fn', 'displayName'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: Array', assert => {
  assert.plan(8);

  const [proxy, watcher] = Watcher({
    arr: [2, 1, 3],
  });

  proxy.arr.constructor;
  assert.is(proxy.arr.length, 3);

  assert.is(watcher.changes, 0);

  proxy.arr.concat(4);
  proxy.arr.entries();
  proxy.arr.every(() => false);
  proxy.arr.filter(() => false);
  proxy.arr.find(() => false);
  proxy.arr.findIndex(() => false);
  proxy.arr.forEach(() => {});
  proxy.arr.includes(1);
  proxy.arr.indexOf(1);
  proxy.arr.join();
  proxy.arr.keys();
  proxy.arr.lastIndexOf(1);
  proxy.arr.map(() => false);
  proxy.arr.reduce(() => ({}));
  proxy.arr.reduceRight(() => ({}));
  proxy.arr.slice();
  proxy.arr.some(() => false);
  proxy.arr.toLocaleString();
  proxy.arr.toString();
  proxy.arr.values();

  assert.is(watcher.changes, 0);

  proxy.arr.length = 10;

  assert.is(watcher.changes, 1);
  assert.deepEqual(watcher.paths, [
    ['arr', 'length'],
  ]);

  proxy.arr.copyWithin(0, 0, 0);
  proxy.arr.push();
  proxy.arr.splice(0, 0);

  assert.is(watcher.changes, 1);

  proxy.arr.copyWithin(0, 1, 2);
  proxy.arr.fill(0);
  proxy.arr.pop();
  proxy.arr.push(-1, -2, -3);
  proxy.arr.reverse();
  proxy.arr.shift();
  proxy.arr.sort();
  proxy.arr.splice(0, 1, 2);
  proxy.arr.unshift(5);

  assert.is(watcher.changes, 44);
  assert.deepEqual(watcher.paths, [
    ['arr', 0],
    ['arr'],
    ['arr', 0],
    ['arr', 1],
    ['arr', 2],
    ['arr', 3],
    ['arr', 4],
    ['arr', 5],
    ['arr', 6],
    ['arr', 7],
    ['arr', 8],
    ['arr', 9],
    ['arr'],
    ['arr', 9],
    ['arr', 'length'],
    ['arr'],
    ['arr', 9],
    ['arr', 10],
    ['arr', 11],
    ['arr'],
    ['arr', 0],
    ['arr', 11],
    ['arr', 1],
    ['arr', 10],
    ['arr', 2],
    ['arr', 9],
    ['arr'],
    ['arr', 0],
    ['arr', 1],
    ['arr', 2],
    ['arr', 11],
    ['arr', 'length'],
    ['arr'],
    ['arr', 0],
    ['arr', 1],
    ['arr'],
    ['arr', 0],
    ['arr'],
    ['arr', 11],
    ['arr', 2],
    ['arr', 1],
    ['arr', 0],
    ['arr'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: ArrayBuffer', assert => {
  assert.plan(2);

  const [proxy, watcher] = Watcher({
    arr: new ArrayBuffer(12),
  });

  proxy.arr.constructor;
  proxy.arr.byteLength;

  assert.is(watcher.changes, 0);

  proxy.arr.slice(0, 8);

  assert.is(watcher.changes, 0);

  assert.end();
});

test('proxyWatcher: structures: typed arrays', assert => {
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
    BigInt64Array,
    BigUint64Array,
  ];

  assert.plan(Constructors.length * 5);

  Constructors.forEach(Constructor => {
    const [proxy, watcher] = Watcher({
      arr: new Constructor(new ArrayBuffer(24)),
    });

    proxy.arr.constructor;
    proxy.arr.constructor.name;
    proxy.arr.BYTES_PER_ELEMENT;
    proxy.arr.byteLength;
    proxy.arr.byteOffset;
    proxy.arr.buffer;

    assert.is(watcher.changes, 0);

    proxy.arr.entries();
    proxy.arr.every(() => false);
    proxy.arr.filter(() => false);
    proxy.arr.find(() => false);
    proxy.arr.findIndex(() => false);
    proxy.arr.forEach(() => {});
    proxy.arr.includes(1);
    proxy.arr.indexOf(1);
    proxy.arr.join();
    proxy.arr.keys();
    proxy.arr.lastIndexOf (1);
    proxy.arr.map(() => false);
    proxy.arr.reduce(() => ({}));
    proxy.arr.reduceRight(() => ({}));
    proxy.arr.slice();
    proxy.arr.some(() => false);
    proxy.arr.subarray();
    proxy.arr.toLocaleString();
    proxy.arr.toString();
    proxy.arr.values();

    assert.is(watcher.changes, 0);

    proxy.arr.copyWithin(0, 0, 0);

    assert.is(watcher.changes, 0);

    const sampleDigit = proxy.arr.constructor.name.startsWith('Big') ? 1n : 1;

    proxy.arr.set([sampleDigit]);
    proxy.arr.copyWithin(1, 0, 1);
    proxy.arr.reverse();
    proxy.arr.fill(sampleDigit);

    assert.is(watcher.changes, 4);
    assert.deepEqual(watcher.paths, [
      ['arr'],
      ['arr'],
      ['arr'],
      ['arr'],
    ]);
  });

  assert.end();
});

test('proxyWatcher: structures: Map', assert => {
  assert.plan(6);

  const [proxy, watcher] = Watcher({
    map: new Map([
      ['1', 1],
      ['2', 2],
    ])
  });

  proxy.map.constructor;
  proxy.map.length;
  assert.is(proxy.map.size, 2);

  assert.is(watcher.changes, 0);

  proxy.map.entries();
  proxy.map.forEach(() => {});
  proxy.map.has('1');
  proxy.map.keys();
  proxy.map.values();
  proxy.map.get('1');

  assert.is(watcher.changes, 0);

  proxy.map.delete('none');
  proxy.map.set('1', 1);

  assert.is(watcher.changes, 0);

  proxy.map.delete('1');
  proxy.map.clear();
  proxy.map.set('4', 4);

  assert.is(watcher.changes, 3);
  assert.deepEqual(watcher.paths, [
    ['map'],
    ['map'],
    ['map'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: WeakMap', assert => {
  assert.plan(4);

  const [proxy, watcher] = Watcher({
    weakmap: new WeakMap(),
  });

  assert.is(proxy.weakmap.constructor.name, 'WeakMap');

  proxy.weakmap.has('foo');

  assert.is(watcher.changes, 0);

  proxy.weakmap = proxy.weakmap;

  assert.is(watcher.changes, 0);

  proxy.weakmap = new WeakMap();

  assert.is(watcher.changes, 1);

  assert.end();
});

test('proxyWatcher: structures: Set', assert => {
  assert.plan(6);

  const [proxy, watcher] = Watcher({
    set: new Set([1, 2]),
  });

  proxy.set.constructor;
  assert.is(proxy.set.size, 2);

  assert.is(watcher.changes, 0);

  proxy.set.entries();
  proxy.set.forEach(() => {});
  proxy.set.has(1);
  proxy.set.keys();
  proxy.set.values();

  assert.is(watcher.changes, 0);

  proxy.set.delete('none');
  proxy.set.add(1);

  assert.is(watcher.changes, 0);

  proxy.set.add(3);
  proxy.set.delete(1);
  proxy.set.clear();

  assert.is(watcher.changes, 3);
  assert.deepEqual(watcher.paths, [
    ['set'],
    ['set'],
    ['set'],
  ]);

  assert.end();
});

test('proxyWatcher: structures: WeakSet', assert => {
  assert.plan(4);

  const [proxy, watcher] = Watcher({
    weakset: new WeakSet(),
  });

  assert.is(proxy.weakset.constructor.name, 'WeakSet');

  proxy.weakset.has('foo');

  assert.is(watcher.changes, 0);

  proxy.weakset = proxy.weakset;

  assert.is(watcher.changes, 0);

  proxy.weakset = new WeakSet();

  assert.is(watcher.changes, 1);

  assert.end();
});

test('proxyWatcher: structures: Promise', async assert => {
  assert.plan(10);

  const [proxy, watcher] = Watcher({
    string: Promise.resolve('string'),
    number: Promise.resolve(123),
    arr: Promise.resolve([1, 2, 3]),
    obj: Promise.resolve({ foo: true }),
    set: Promise.resolve(new Set([1, 2, 3])),
    deep: Promise.resolve(Promise.resolve({ deep: true })),
  });

  assert.is(await proxy.string, 'string');
  assert.is(await proxy.number, 123);
  assert.deepEqual(await proxy.arr, [1, 2, 3]);
  assert.deepEqual(await proxy.obj, { foo: true });
  assert.deepEqual(await proxy.set, new Set([1, 2, 3]));
  assert.deepEqual(await proxy.deep, { deep: true });
  assert.is(watcher.changes, 0);

  proxy.string = proxy.string;
  proxy.number = proxy.number;
  proxy.arr = proxy.arr;
  proxy.obj = proxy.obj;
  proxy.set = proxy.set;
  proxy.deep = proxy.deep;
  assert.is(watcher.changes, 0);

  await proxy.arr.then(arr => (arr[0] = 1));
  await proxy.obj.then(obj => (obj.foo = true));
  await proxy.set.then(set => set.delete(4));
  await proxy.set.then(set => set.has(4));
  await proxy.deep.then(obj => (obj.deep = true));
  assert.is(watcher.changes, 0);

  proxy.string = Promise.resolve('string');
  proxy.number = Promise.resolve(123);
  proxy.arr = Promise.resolve([1, 2, 3]);
  proxy.obj = Promise.resolve({ foo: true });
  proxy.set = Promise.resolve(new Set([1, 2, 3]));
  proxy.deep = Promise.resolve(Promise.resolve({ deep: true }));
  assert.is(watcher.changes, 6);

  assert.end();
});