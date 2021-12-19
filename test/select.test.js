import test from 'tape';
import Store from '../src/index.js';
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

  store.watch(() => changes.push('main'));
  
  const selection = store.select(['bar', 'deep']);
  const bazChange = e => {
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['bar', 'deep', 'baz'],
        value: -1,
      }
    ], `selection: watch: transactions`);
    changes.push('sub');
  };
  const bizChange = e => {
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['bar', 'deep', 'biz', 'deepest'],
        value: -1,
      }
    ], `selection: watch: transactions`);
    changes.push('sub');
  };
  const disposer = selection.watch(bazChange);
  selection.watch(['baz'], () => {
    changes.push('watch');
  });

  const preProjection = selection.project({ foo: 'baz' });
  assert.is(preProjection.foo, 1, `pre mutation project`);

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
  ], `selector caught change with watch event`);

  const postProjection = selection.project({ foo: 'baz' });
  assert.is(postProjection.foo, -1, `post mutation project`);

  const postGet = selection.get(['baz']);
  assert.is(postGet, -1, `post mutation get`);

  disposer();
  selection.watch(bizChange);

  const subSelection = selection.select(['biz']);
  subSelection.watch(() => {
    changes.push('subsub');
  });

  store.data.bar.deep.biz.deepest = -1;

  await delay();

  assert.same(changes.paths, [
    'main',
    'sub',
    'subsub',
  ], `sub selector caught change with watch event`);

  assert.end();
});

test('select: dynamic paths', assert => {
  assert.plan(3);

  const store = Store({
    hello: [
      { foo: 1 },
      { bar: 2 },
      { baz: 3 },
    ],
  }, { asynchronous: false });

  const cursor = store.select(['hello', { bar: 2 }]);

  assert.same(cursor.get(), { bar: 2 }, `cursor contains object at dynamic path`);

  cursor.watch(() => {
    assert.is(
      cursor.data.world,
      true,
      `cursor should reflect the change`
    );
  });

  store.data.hello[1].world = true;

  assert.same(cursor.get(), { bar: 2, world: true }, `cursor contains the change`);

  assert.end();
});