import test from 'tape';
import Store from '../src/index.js';
import debug from '../src/debug/index.js';
import { delay } from './utils';

test('store: initialization', async assert => {
  assert.plan(3);

  const dataInitial = {
    foo: true,
    bar: [1, 2, { baz: true }],
  };

  const dataFinal = {
    foo: true,
    bar: [1, 2, { baz: true, qux: 'str' }, 3],
    baz: true
  };

  const store = Store(dataInitial);

  assert.false(dataInitial === store.data);
  assert.same(dataInitial, store.data);

  store.data.baz = true;
  store.data.bar.push(3);
  store.data.bar[2].qux = 'str';

  await delay();

  assert.same(dataFinal, store.data);

  assert.end();
});

test(`store: asynchronous`, assert => {
  assert.plan(2);

  assert.doesNotThrow(
    () => Store({}, { asynchronous: false }),
    `should be able to create a store that's synchronous`
  );

  const store = Store({
    hello: 'world',
  }, { asynchronous: false });

  store.watch(() => {
    assert.ok(true, `should autoCommit changes synchronously`);
  });

  store.data.hello = 'goodbye';

  assert.end();
});

test(`store: autoCommit`, assert => {
  assert.plan(2);

  assert.doesNotThrow(
    () => Store({}, { autoCommit: false }),
    `should be able to create a store without autoComit`
  );

  const store = Store({
    hello: 'world',
  }, { autoCommit: false, asynchronous: false });

  const disposer = store.watch(() => {
    assert.fail(`should not autoCommit changes`);
  });

  store.data.hello = 'goodbye';

  disposer();

  store.watch(() => {
    assert.ok(true, `should be able to manually commit changes`);
  });

  store.data.hello = 1;
  store.commit();

  assert.end();
});

test(`store: debug`, assert => {
  assert.doesNotThrow(
    () => Store({}, { debug }),
    `should be able to create a store with a debug`
  );

  // for more debug tests, see debug.test.js
  
  assert.end();
});