import test from 'tape';
import delay from './delay';
import Store from '../src';

test('project: supports an object selector', async assert => {
  assert.plan(2);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  store.watch(() => Math.random(), () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.project({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  }, e => {
    assert.is(e.data.hello, store.data.foo);
    assert.is(e.data.world, store.data.bar.deep[0]);
  });

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.deep[0] = 0;

  await delay(10);

  assert.end();
});

test(`project: doesn't schedule a call to the listener if the return value of the selector didn't actually change`, async assert => {
  assert.plan(5);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.on('change', () => calls.push(0));
  store.project({ foo: ['foo'] }, () => calls.push(1));
  store.project({ foo: ['bar'] }, () => calls.push(2));
  store.project({ foo: ['bar', 'deep', 0] }, () => calls.push(3));

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