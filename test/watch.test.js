import test from 'tape';
import Store from '../src';
import { delay } from '../src/utils';

test('watch: supports a selector function', async assert => {
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
  store.watch(() => ['foo'], e => {
    assert.is(e.data, store.data.foo);
    calls.push(1);
  });
  store.watch(() => ['bar'], e => {
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

test('watch: supports a static selector', async assert => {
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

test('watch: supports a deep static selector', async assert => {
  assert.plan(3);

  const store = Store({
    arr: [1, 2, '3', { foo: 'bar' }],
  });
  const calls = [];

  store.watch(() => Math.random(), () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.watch(['arr', 3, 'foo'], () => calls.push(1));

  store.data.arr[3].foo = 0;

  await delay(10);

  // TODO: use makeData fixture
  assert.deepEqual(calls, [1]);
  
  store.data.arr[3].foo = 1;

  await delay(10);

  assert.deepEqual(calls, [1, 1]);

  store.data.arr[3].foo = 2;

  await delay(10);

  assert.deepEqual(calls, [1, 1, 1]);

  assert.end();
});

test(`watch: doesn't schedule a call to the listener if the return value of the selector didn't actually change`, async assert => {
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
  // TODO: use makeData fixture
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