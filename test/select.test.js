import test from 'tape';
import Store from '../src';
import { delay } from '../src/utils';

test('select', async assert => {
  assert.plan(11);

  const store = Store({
    foo: 123,
    bar: {
      deep: {
        baz: 1,
        biz: {
          deepest: 1,
        },
      },
    },
  });

  const calls = [];

  store.watch(['noop'], () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.on('change', () => calls.push('main'));
  
  const selection = store.select(['bar', 'deep']);
  selection.on('change', e => {
    assert.deepEqual(e.data, store.data.bar.deep, `selection change`);
    calls.push('sub');
  });
  selection.watch(['baz'], e => {
    assert.deepEqual(e.data, store.data.bar.deep.baz, `selection watch`);
    calls.push('watch');
  });

  const preProjection = selection.projection({ foo: 'baz' });
  assert.is(preProjection.foo, 1, `pre mutation projection`);

  const preGet = selection.get(['baz']);
  assert.is(preGet, 1, `pre mutation get`);

  store.data.foo = 1234;

  await delay(10);

  assert.deepEqual(calls, [
    'main'
  ], `changing top-level data does not affect selector`);

  calls.length = 0;

  store.data.bar.deep.baz = -1;

  await delay(10);
  
  assert.deepEqual(calls, [
    'main',
    'sub',
    'watch',
  ], `selector caught change with onChange and watch events`);

  const postProjection = selection.projection({ foo: 'baz' });
  assert.is(postProjection.foo, -1, `post mutation projection`);

  const postGet = selection.get(['baz']);
  assert.is(postGet, -1, `post mutation get`);

  const subSelection = selection.select(['biz']);
  subSelection.on('change', e => {
    assert.deepEqual(e.data, store.data.bar.deep.biz, `sub selection change`);
    calls.push('subsub');
  });

  calls.length = 0;

  store.data.bar.deep.biz.deepest = -1;

  await delay(10);

  assert.deepEqual(calls, [
    'main',
    'sub',
    'subsub',
  ], `sub selector caught change with onChange event`);

  assert.end();
});
