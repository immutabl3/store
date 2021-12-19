import test from 'tape';
import Store from '../src/index.js';
import { wait } from '@immutabl3/utils';

test('project: object selector', async assert => {
  assert.plan(4);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  const pre = store.project({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  });
  assert.is(pre.hello, store.data.foo, `initial data is retrieved`);
  assert.is(pre.world, store.data.bar.deep[0], `initial data is retrieved`);

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.deep[0] = 0;

  await wait();

  const post = store.project({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  });
  assert.is(post.hello, store.data.foo, `mutated data is retrieved`);
  assert.is(post.world, store.data.bar.deep[0], `mutated data is retrieved`);

  assert.end();
});

test('project: can project on an array', async assert => {
  assert.plan(2);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  const pre = store.project(['bar', 'deep', 0]);
  assert.is(pre, store.data.bar.deep[0], `initial data is retrieved`);

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.deep[0] = 0;

  await wait();

  const post = store.project(['bar', 'deep', 0]);
  assert.is(post, store.data.bar.deep[0], `mutated data is retrieved`);

  assert.end();
});

test('project: project on invalid paths', async assert => {
  assert.plan(2);

  const store = Store({});

  const result = store.project({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  });

  assert.is(result.hello, undefined);
  assert.is(result.world, undefined);

  assert.end();
});