import test from 'tape';
import Store from '../src';
import { delay } from '../src/utils';

test('store: wraps an object', async assert => {
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
  assert.deepEqual(dataInitial, store.data);

  store.data.baz = true;
  store.data.bar.push(3);
  store.data.bar[2].qux = 'str';

  await delay(10);

  assert.deepEqual(dataFinal, store.data);

  assert.end();
});