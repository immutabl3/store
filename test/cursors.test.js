import test from 'tape';
import Store from '../src';
import { delay } from './utils';

test('cursors: get', async assert => {
  assert.plan(2);

  const store = Store({
    bar: {
      deep: [1, 2, 3],
    },
  });

  const pre = store.get();
  assert.is(pre, store.data, `initial data is retrieved`);

  store.data.bar.deep[0] = 0;

  await delay();

  const post = store.get();
  assert.is(post, store.data, `mutated data is retrieved`);

  assert.end();
});

test('cursors: get: selector', async assert => {
  assert.plan(2);

  const store = Store({
    bar: {
      deep: [1, 2, 3],
    },
  });

  const pre = store.get(['bar', 'deep', 0]);
  assert.is(pre, 1, `initial data is retrieved`);

  store.data.bar.deep[0] = 0;

  await delay();

  const post = store.get(['bar', 'deep', 0]);
  assert.is(post, 0, `mutated data is retrieved`);

  assert.end();
});

test('cursors: get: complex path', assert => {
  assert.plan(2);

  const store = Store({
    arr: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
    ],
  });

  const result = store.get(['arr', { foo: 1 }]);

  assert.deepEqual(result, { foo: 1 }, `retrieved correct object from array`);

  const empty = store.get(['arr', () => -1, 'bar', 'baz']);

  assert.is(empty, undefined, `won't retrieve if no target for selector`);

  assert.end();
});

test('cursors: get: invalid path', assert => {
  assert.plan(1);

  const store = Store({});

  const result = store.get(['bar', 'deep', 0]);

  assert.is(result, undefined, `invalid path returns undefined`);

  assert.end();
});

test('cursors: methods', assert => {
  const tests = {
    set() {
      
    },
    unset() {},
    push() {},
    concat() {},
    pop() {},
    shift() {},
    splice() {},
    merge() {},
  };

  Object.values(tests).forEach(fn => fn());

  assert.end();
});