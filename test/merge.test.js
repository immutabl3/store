import test from 'tape';
import Store from '../src';

test('merge: array-edge-case', async assert => {
  assert.plan(2);

  const dataInitial = {
    arr: [{ order: 1, foo: 'bar' }],
  };

  const dataFinal = {
    arr: [{ order: 1, foo: 'baz' }],
  };

  const store = Store(dataInitial);
  const selector = store.select(['arr', { order: 1 }]);

  assert.doesNotThrow(() => {
    selector.merge({ foo: 'baz' });
  });

  assert.same(dataFinal, store.data);

  assert.end();
});