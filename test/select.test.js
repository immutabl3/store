import test from 'tape';
import Store from '../src';
import { delay } from './utils';

const Changes = () => {
  let arr = [];
  return {
    push(path) {
      arr.push(path);
    },
    get paths() {
      const saved = arr;
      arr = [];
      return saved;
    },
  };
};

test('select: basics', async assert => {
  assert.plan(9);

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

  const changes = Changes();

  store.onChange(() => changes.push('main'));
  
  const selection = store.select(['bar', 'deep']);
  const bazChange = e => {
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['bar', 'deep', 'baz'],
        value: -1,
      }
    ], `selection: onChange: transactions`);
    changes.push('sub');
  };
  const bizChange = e => {
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['bar', 'deep', 'biz', 'deepest'],
        value: -1,
      }
    ], `selection: onChange: transactions`);
    changes.push('sub');
  };
  const disposer = selection.onChange(bazChange);
  selection.watch(['baz'], () => {
    changes.push('watch');
  });

  const preProjection = selection.projection({ foo: 'baz' });
  assert.is(preProjection.foo, 1, `pre mutation projection`);

  const preGet = selection.get(['baz']);
  assert.is(preGet, 1, `pre mutation get`);

  store.data.foo = 1234;

  await delay();

  assert.same(changes.paths, [
    'main'
  ], `changing top-level data does not affect selector`);

  store.data.bar.deep.baz = -1;

  await delay();
  
  assert.same(changes.paths, [
    'main',
    'sub',
    'watch',
  ], `selector caught change with onChange and watch events`);

  const postProjection = selection.projection({ foo: 'baz' });
  assert.is(postProjection.foo, -1, `post mutation projection`);

  const postGet = selection.get(['baz']);
  assert.is(postGet, -1, `post mutation get`);

  disposer();
  selection.onChange(bizChange);

  const subSelection = selection.select(['biz']);
  subSelection.onChange(() => {
    changes.push('subsub');
  });

  store.data.bar.deep.biz.deepest = -1;

  await delay();

  assert.same(changes.paths, [
    'main',
    'sub',
    'subsub',
  ], `sub selector caught change with onChange event`);

  assert.end();
});

test('select: dynamic paths', async assert => {
  assert.plan(2);

  const store = Store({
    foo: [
      { bar: 123 },
    ],
  });

  assert.throws(
    () => store.select(['foo', () => {}]),
    `cannot generate a selection with function in path`
  );
  assert.throws(
    () => store.select(['foo', { bar: 123 }]),
    `cannot generate a selection with object in path`
  );

  assert.end();
});
