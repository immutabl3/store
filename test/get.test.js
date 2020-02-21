import test from 'tape';
import Store from '../src';
import { delay } from '../src/utils';

test('get: selector', async assert => {
  assert.plan(2);

  const store = Store({
    bar: {
      deep: [1, 2, 3],
    },
  });

  const pre = store.get(['bar', 'deep', 0]);
  assert.is(pre, 1, `initial data is retrieved`);

  store.data.bar.deep[0] = 0;

  await delay(10);

  const post = store.get(['bar', 'deep', 0]);
  assert.is(post, 0, `mutated data is retrieved`);

  assert.end();
});

test('get: complex path', async assert => {
  assert.plan(1);

  const store = Store({
    arr: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
    ],
  });

  const result = store.get(['arr', { foo: 1 }]);

  assert.deepEqual(result, { foo: 1 }, `retrieved correct object from array`);

  assert.end();
});

test('get: invalid path', async assert => {
  assert.plan(1);

  const store = Store({});

  const result = store.get(['bar', 'deep', 0]);

  assert.is(result, undefined);

  assert.end();
});