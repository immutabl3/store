import test from 'tape';
import Store from '../src';
import { delay } from '../src/utils';

test('projection: object selector', async assert => {
  assert.plan(4);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  const pre = store.projection({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  });
  assert.is(pre.hello, store.data.foo, `initial data is retrieved`);
  assert.is(pre.world, store.data.bar.deep[0], `initial data is retrieved`);

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.deep[0] = 0;

  await delay(10);

  const post = store.projection({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  });
  assert.is(post.hello, store.data.foo, `mutated data is retrieved`);
  assert.is(post.world, store.data.bar.deep[0], `mutated data is retrieved`);

  assert.end();
});

test('projection: project on invalid paths', async assert => {
  assert.plan(2);

  const store = Store({});

  const result = store.projection({
    hello: 'foo',
    world: ['bar', 'deep', 0],
  });

  assert.is(result.hello, undefined);
  assert.is(result.world, undefined);

  assert.end();
});