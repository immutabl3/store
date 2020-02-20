import test from 'tape';
import { store, Hooks } from '../src';

test('hooks: can dispose of a listener', assert => {
  Hooks.store.new.subscribe(assert.fail)();

  store({});

  assert.pass();

  assert.end();
});

// TODO: some sort of leak here - enabling this test destroys the onChange tests
// this may be because the classes instantiated in new and change are treated as singletons
// with shared state
test.skip('hooks: store.new: triggers whenever a store is created', assert => {
  assert.plan(2);

  const data = {
    foo: true,
    bar: [1, 2, { baz: true }]
  };

  Hooks.store.new.subscribe(proxy => {
    assert.deepEqual(data, proxy);
  });

  const proxy = store(data);

  assert.deepEqual(data, proxy);

  assert.end();
});