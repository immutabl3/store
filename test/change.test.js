import test from 'tape';
import delay from './delay';
import Store from '../src';

test('change: schedules a call to the listener when a mutation is made to the object', async assert => {
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

    store.on('change', () => assert.fail(`detected a mutation`));

    fn(store.data);

    await delay(10);

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
    store.on('change', e => {
      assert.deepEqual(e.data, store.data, `data passed`);
      calls++;
    });

    fn(store.data);

    await delay(10);

    assert.is(calls, 1, `one mutation made`);
  }

  assert.end();
});