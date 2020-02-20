import test from 'tape';
import delay from './delay';
import Store from '../src';

test('onChange: schedules a call to the listener when a mutation is made to the object', async assert => {
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

test('onChange: supports an optional selector', async assert => {
  assert.plan(3);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.watch(() => Math.random(), () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.watch(['foo'], e => {
    assert.is(e.data, store.data.foo);
    calls.push(1);
  });
  store.watch(['bar'], e => {
    assert.deepEqual(e.data, store.data.bar);
    calls.push(2);
  });

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.foo = true;

  await delay(10);

  assert.deepEqual(calls, [1, 2]);

  assert.end();
});

test(`onChange: doesn't schedule a call to the listener if the return value of the selector didn't actually change`, async assert => {
  assert.plan(5);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.on('change', () => calls.push(0));
  store.watch(['foo'], () => calls.push(1));
  store.watch(['bar'], () => calls.push(2));
  store.watch(['bar', 'deep', 0], () => calls.push(3));

  store.data.foo = 123;
  store.data.bar = store.data.bar;
  store.data.bar = { deep: [1, 2, 3] };
  store.data.bar.deep[0] = 1;

  await delay(10);

  assert.deepEqual(calls, []);

  store.data.foo = 1234;

  await delay(10);

  assert.deepEqual(calls, [0, 1]);

  calls.length = 0;

  store.data.bar.foo = true;

  await delay(10);

  assert.deepEqual(calls, [0, 2]);

  calls.length = 0;

  store.data.bar.deep.push(4);

  await delay(10);

  assert.deepEqual(calls, [0, 2]);

  calls.length = 0;

  store.data.bar.deep[0] = 2;

  await delay(10);

  assert.deepEqual(calls, [0, 2, 3]);

  assert.end();
});