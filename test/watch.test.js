import test from 'tape';
import isFunction from 'lodash/isFunction';
import noop from 'lodash/noop';
import Store from '../src';
import { delay } from '../src/utils';

test('watch: selector function', async assert => {
  assert.plan(3);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.watch(['noop'], () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.watch(() => 'foo', e => {
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

test('watch: static selector', async assert => {
  assert.plan(3);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.watch(['noop'], () => {
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

test('watch: deep static selector', async assert => {
  assert.plan(3);

  const store = Store({
    arr: [1, 2, '3', { foo: 'bar' }],
  });
  const calls = [];

  store.watch(['noop'], () => {
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

test('watch: complex selector', async assert => {
  assert.plan(2);

  const store = Store({
    arr: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
    ],
  });
  const calls = [];

  store.watch(['noop'], () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.watch(['arr', { foo: 2 }], () => calls.push(1));

  store.data.arr[1].bar = 'baz';

  await delay(10);

  // TODO: use makeData fixture
  assert.deepEqual(calls, [1], `call made, selected object changed`);

  calls.length = 0;

  store.data.arr[1].foo = 0;

  await delay(10);

  // TODO: use makeData fixture
  assert.deepEqual(calls, [], `no call made, selector changed`);

  assert.end();
});

test(`watch: same data assignments don't emit changes`, async assert => {
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

test('watch: is disposable', async assert => {
  assert.plan(3);

  const store = Store({
    arr: [1, 2, '3', { foo: 'bar' }],
  });
  
  const calls = [];

  const watcher = store.watch(['arr', 3, 'foo'], () => calls.push(1));

  assert.ok(isFunction(watcher), `watch returned disposer function`);

  store.data.arr[3].foo = 0;

  await delay(10);

  // TODO: use makeData fixture
  assert.deepEqual(calls, [1], `made a call on data change`);

  // dispose
  watcher();

  store.data.arr[3].foo = 1;

  assert.deepEqual(calls, [1], `did not make a call after disposed`);

  assert.end();
});

test('watch: is getable', async assert => {
  assert.plan(2);

  const store = Store({
    arr: [1, 2, '3', { foo: 'bar' }],
  });
  
  const watcher = store.watch(['arr', 3, 'foo'], noop);

  assert.ok(isFunction(watcher.get), `watch returned a getter`);

  store.data.arr[3].foo = 0;

  await delay(10);

  assert.is(watcher.get(), 0, `getting data from watcher matches expected data`);

  assert.end();
});

test('watch: basic projection', async assert => {
  assert.plan(2);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  store.watch({
    hello: ['foo'],
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

test(`watch: deep projection`, async assert => {
  assert.plan(5);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.on('change', () => calls.push(0));
  store.watch({ helloworld: ['foo'] }, () => calls.push(1));
  store.watch({ helloworld: ['bar'] }, () => calls.push(2));
  store.watch({ helloworld: ['bar', 'deep', 0] }, () => calls.push(3));

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

test('watch: project on invalid paths', async assert => {
  const store = Store({});

  store.watch({
    hello: ['foo'],
  }, () => {
    assert.fail(`path doesn't exist`);
  });

  store.data.biz = true;

  await delay(10);

  assert.pass(`no change event fired`);

  assert.end();
});