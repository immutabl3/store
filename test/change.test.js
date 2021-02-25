import test from 'tape';
import Store from '../src';
import { delay } from './utils';

test('change: fires a change event when a mutation is made', async assert => {
  assert.plan(39);

  const noMutation = [
    proxy => (proxy.foo = 123),
    proxy => (proxy.bar = { deep: true }),
    proxy => (proxy.arr = [1, 2, '3']),
    proxy => (proxy.arr[0] = 1),
    proxy => (proxy.arr.length = 3),
    proxy => (proxy.nan = NaN),
    proxy => delete proxy.qux,
  ];

  const mutation = [
    proxy => (proxy.foo = 1234),
    proxy => (proxy.bar = { deep: false }),
    proxy => (proxy.bar = { deep: undefined }),
    proxy => (proxy.bar = { deep: null }),
    proxy => (proxy.bar = { deep: NaN }),
    proxy => (proxy.bar = { deep2: '123' }),
    proxy => (proxy.bar = { deep2: undefined }),
    proxy => (proxy.bar = { deep2: null }),
    proxy => (proxy.bar = { deep2: NaN }),
    proxy => (proxy.arr = [1]),
    proxy => (proxy.arr[0] = 2),
    proxy => (proxy.arr.push(4)),
    proxy => (proxy.arr.length = 4),
    proxy => (proxy.nan = Infinity),
    proxy => (proxy.qux = undefined),
    proxy => delete proxy.foo,
  ];

  for (const fn of noMutation) { 
    const store = Store({
      foo: 123,
      bar: { deep: true },
      arr: [1, 2, '3'],
      nan: NaN,
    });

    store.watch(() => assert.fail(`detected a mutation`));

    fn(store.data);

    await delay();

    assert.pass(`no mutation`);
  }

  for (const fn of mutation) {
    let calls = 0;

    const store = Store({
      foo: 123,
      bar: { deep: true },
      arr: [1, 2, '3'],
      nan: NaN,
    });

    // eslint-disable-next-line no-loop-func
    store.watch(e => {
      assert.ok(!!e.transactions.length, `transaction made`);
      calls++;
    });

    fn(store.data);

    await delay();

    assert.is(calls, 1, `one mutation made`);
  }

  assert.end();
});

test('change: fires a change event when Map & Set updates', async assert => {
  assert.plan(41);

  let calls = 0;

  const store = Store({
    foo: new Map([[1, '1'], [2, '2']]),
    bar: new Set([1, 2]),
    baz: new Map([[1, '1']]),
    biz: new Map([[1, { hello: 'world' }]]),
  });

  // eslint-disable-next-line no-loop-func
  store.watch(e => {
    assert.ok(!!e.transactions.length, `transaction made`);
    calls++;
  });
  store.select(['baz', 1]).watch(e => {
    assert.ok(!!e.transactions.length, `transaction made`);
    calls++;
  });
  store.select(['biz', 1]).watch(e => {
    assert.ok(!!e.transactions.length, `transaction made`);
    calls++;
  });

  store.data.foo.delete(1);
  await delay();
  assert.is(calls, 1, `Map: mutation made`);
  assert.is(store.data.foo.size, 1, `Map: size updated`);
  assert.is(Array.from(store.data.foo.values()).length, 1, `Map: values() length is reduced`);

  store.data.foo.set(1, '2');
  await delay();
  assert.is(calls, 2, `Map: mutation made`);
  assert.is(store.data.foo.size, 2, `Map: size updated`);
  assert.is(Array.from(store.data.foo.values()).length, 2, `Map: values() exposes data`);
  assert.is(store.data.foo.get(1), '2', `Map: can get set value`);

  store.data.bar.delete(1);
  await delay();
  assert.is(calls, 3, `Set: mutation made`);
  assert.is(store.data.bar.size, 1, `Set: size updated`);
  assert.is(Array.from(store.data.bar.values()).length, 1, `Set: values() exposes data`);
  assert.is(store.data.bar.has(1), false, `Set: has() returns correct value`);

  // make sure get/set work with Map properly
  store.set(['foo', 2], '3');
  await delay();
  assert.is(calls, 4, `Map: mutation made`);
  assert.is(store.get(['foo']).size, 2, `Map: size unchanged`);
  assert.is(Array.from(store.data.foo.values()).length, 2, `Map: values() exposes data`);
  assert.is(store.get(['foo', 2]), '3', `Map: can get set value`);
  
  // make sure watch work with Map properly
  store.set(['baz', 1], '2');
  await delay();
  assert.is(calls, 6, `Map: mutation made`);
  assert.is(store.get(['baz']).size, 1, `Map: size unchanged`);
  assert.is(Array.from(store.data.baz.values()).length, 1, `Map: values() exposes data`);
  
  // make sure merge works with Map properly
  store.merge(['biz', 1], { hello: 'goodbye' });
  await delay();
  assert.is(calls, 8, `Map: mutation made`);
  assert.is(store.get(['biz']).size, 1, `Map: size unchanged`);
  assert.is(Array.from(store.data.biz.values()).length, 1, `Map: values() exposes data`);
  assert.is(store.get(['biz', 1, 'hello']), 'goodbye', `value updated`);

  // add a new object to the Map and see if we can
  // watch it for changes
  store.set(['biz', 2], { foo: 'bar' });
  store.merge(['biz', 2], { foo: 'foo' });
  await delay();
  assert.is(calls, 9, `Map: mutation made`);
  assert.is(store.get(['biz']).size, 2, `Map: size updated`);
  assert.is(Array.from(store.data.biz.values()).length, 2, `Map: values() exposes data`);
  assert.is(store.get(['biz', 2, 'foo']), 'foo', `value updated`);

  // make sure we can unset a Map
  store.unset(['biz', 1]);
  await delay();
  assert.is(calls, 11, `Map: mutation made`);
  assert.is(store.get(['biz']).size, 1, `Map: size update`);
  assert.is(Array.from(store.data.biz.values()).length, 1, `Map: values() exposes data`);
  assert.is(store.get(['biz', 1]), undefined, `value updated`);

  assert.end();
});

test('change: dispose', async assert => {
  assert.plan(4);

  const store = Store({ foo: 123 });

  let calls = 0;

  const disposer = store.watch(() => calls++);
  assert.ok(!!disposer, `returned a disposer`);

  store.data.foo = 321;

  await delay();

  assert.is(calls, 1, `watch called`);
  assert.doesNotThrow(() => disposer(), `disposer called`);

  store.data.foo = 0;

  await delay();

  assert.is(calls, 1, `watch was not called after being disposed`);

  assert.end();
});