import test from 'tape';
import delay from './delay';
import { onChange, store } from '../src';

test('onChange: schedules a call to the listener when a mutation is made to the object', async assert => {
  assert.plan(62);

  const tests = [
    // no mutation
    [proxy => (proxy.foo = 123), false],
    [proxy => (proxy.bar = { deep: true }), false],
    [proxy => (proxy.arr = [1, 2, '3']), false],
    [proxy => (proxy.arr[0] = 1), false],
    [proxy => (proxy.arr.length = 3), false],
    [proxy => (proxy.nan = NaN), false],
    [proxy => delete proxy.qux, false],
    // mutation
    [proxy => (proxy.foo = 1234), true],
    [proxy => (proxy.bar = { deep: false }), true],
    [proxy => (proxy.bar = { deep: undefined }), true],
    [proxy => (proxy.bar = { deep: null }), true],
    [proxy => (proxy.bar = { deep: NaN }), true],
    [proxy => (proxy.bar = { deep2: '123' }), true],
    [proxy => (proxy.bar = { deep2: undefined }), true],
    [proxy => (proxy.bar = { deep2: null }), true],
    [proxy => (proxy.bar = { deep2: NaN }), true],
    [proxy => (proxy.arr = [1]), true],
    [proxy => (proxy.arr[0] = 2), true],
    [proxy => (proxy.arr.push(4)), true],
    [proxy => (proxy.arr.length = 4), true],
    [proxy => (proxy.nan = Infinity), true],
    [proxy => (proxy.qux = undefined), true],
    [proxy => delete proxy.foo, true]
  ];

  for (const [fn, shouldMutate] of tests) {
    let callsNr = 0;

    const proxy = store({
      foo: 123,
      bar: { deep: true },
      arr: [1, 2, '3'],
      nan: NaN,
    });

    // eslint-disable-next-line no-loop-func
    onChange(proxy, data => {
      assert.deepEqual(data, proxy);
      callsNr++;
    });

    fn(proxy);

    assert.is(callsNr, 0);

    await delay(10);

    assert.is(!!callsNr, shouldMutate);
  }

  assert.end();
});

test('onChange: supports an optional selector', async assert => {
  assert.plan(4);

  const proxy = store ({ foo: 123, bar: { deep: [1, 2, 3] } });
  const calls = [];

  onChange(proxy, () => Math.random (), data => {
    assert.true(typeof data === 'number');
    calls.push(1);
  });
  onChange(proxy, data => data.foo, data => {
    assert.is(data, proxy.foo);
    calls.push(2);
  });
  onChange(proxy, data => data.bar, data => {
    assert.deepEqual(data, proxy.bar);
    calls.push(3);
  });

  proxy.baz = true;
  proxy.foo = 1234;
  proxy.bar.foo = true;

  await delay(10);

  assert.deepEqual(calls, [1, 2, 3]);

  assert.end();
});

test(`onChange: doesn't schedule a call to the listener if the return value of the selector didn't actually change`, async assert => {
  assert.plan(5);

  const proxy = store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  onChange(proxy, () => calls.push(0));
  onChange(proxy, state => state.foo, () => calls.push(1));
  onChange(proxy, state => state.bar, () => calls.push(2));
  onChange(proxy, state => state.bar.deep[0], () => calls.push(3));

  proxy.foo = 123;
  proxy.bar = proxy.bar;
  proxy.bar = { deep: [1, 2, 3] };
  proxy.bar.deep[0] = 1;

  await delay(10);

  assert.deepEqual(calls, []);

  proxy.foo = 1234;

  await delay(10);

  assert.deepEqual(calls, [0, 1]);

  proxy.bar.foo = true;

  await delay(10);

  // the last `3` here is called unoptimally for performance reasons
  assert.deepEqual(calls, [0, 1, 0, 2, 3]);

  proxy.bar.deep.push(4);

  await delay(10);

  // the last `3` here is called unoptimally for performance reasons
  assert.deepEqual(calls, [0, 1, 0, 2, 3, 0, 2, 3]);

  proxy.bar.deep[0] = 2;

  await delay(10);

  assert.deepEqual(calls, [0, 1, 0, 2, 3, 0, 2, 3, 0, 2, 3]);

  assert.end();
});

test('onChange: returns a disposer', async assert => {
  assert.plan(1);

  const proxy = store({ foo: 123 });

  let callsNr = 0;

  const listener = () => callsNr++;

  onChange(proxy, listener)();
  onChange(proxy, () => Math.random(), listener)();

  proxy.foo = 1234;

  await delay(10);

  assert.is(callsNr, 0);

  assert.end();
});