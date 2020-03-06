import test from 'tape';
import Store from '../src';
import { delay } from './utils';

test('change: fires a change event when a mutation is made', async assert => {
  assert.plan(55);

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

    store.onChange(() => assert.fail(`detected a mutation`));

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
    store.onChange(e => {
      assert.ok(!!e.transactions.length, `transaction made`);
      assert.same(e.target, store.data, `target passed`);
      calls++;
    });

    fn(store.data);

    await delay();

    assert.is(calls, 1, `one mutation made`);
  }

  assert.end();
});

test('change: dispose', async assert => {
  assert.plan(4);

  const store = Store({ foo: 123 });

  let calls = 0;

  const disposer = store.onChange(() => calls++);
  assert.ok(!!disposer, `returned a disposer`);

  store.data.foo = 321;

  await delay();

  assert.is(calls, 1, `onChange called`);
  assert.doesNotThrow(() => disposer(), `disposer called`);

  store.data.foo = 0;

  await delay();

  assert.is(calls, 1, `onChange was not called after being disposed`);

  assert.end();
});