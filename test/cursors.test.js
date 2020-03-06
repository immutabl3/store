import test from 'tape';
import Store from '../src';

// NOTE: the store itself is a cursor instance

const createStore = (data = {}) => Store(data, { asynchronous: false });

test('cursors: get', assert => {
  const store = createStore({
    bar: {
      deep: [1, 2, 3],
    },
    arr: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
    ],
  });

  assert.same(store.get(), store.data, `can retrieve initial data with empty selector`);
  assert.same(store.get(['bar']), store.data.bar, `can retrieve initial data with basic selector`);
  assert.is(store.get(['bar', 'deep', 0]), 1, `can retrieve initial data with numeric selector`);

  store.data.bar.deep[0] = 0;

  assert.same(store.get(), store.data, `can retrieve mutated data with empty selector`);
  assert.same(store.get(['bar']), store.data.bar, `can retrieve mutated data with basic selector`);
  assert.is(store.get(['bar', 'deep', 0]), 0, `can retrieve mutated data with numeric selector`);

  assert.deepEqual(store.get(['arr', { foo: 1 }]), { foo: 1 }, `can retrieve data with a complex selector`);
  assert.doesNotThrow(() => store.get(['arr', () => -1, 'bar', 'baz']), `does not throw on an invalid selector`);
  assert.is(store.get(['arr', () => -1, 'bar', 'baz']), undefined, `won't retrieve if no target for selector`);

  assert.is(
    store.get(['foo', 'bar', 'baz', 0]), 
    undefined, 
    `getting invalid path returns undefined - matches lodash/get access`
  );

  assert.end();
});

test('cursors: getters: clone', assert => {
  const store = createStore();
  const colorCursor = store.select(['one', 'subtwo', 'colors']);
  const clonedData = colorCursor.clone();

  assert.deepEquals(clonedData, colorCursor.get());
  assert.deepEquals(clonedData, colorCursor.clone());
  assert.deepEquals(store.clone().one, store.data.one);

  assert.end();
});

test('cursors: existance', assert => {
  const store = createStore({
    deep: { one: 1 },
    nullValue: null,
    undefinedValue: undefined,
  });

  assert.is(store.exists(), true);
  assert.is(store.exists(), true);
  assert.is(store.select('deep').exists(), true);
  assert.is(store.exists('nullValue'), true);
  assert.is(store.exists('undefinedValue'), true);

  assert.is(store.exists('hey'), false);
  assert.is(store.select('hey').exists(), false);

  assert.end();
});

test('cursors: setters', assert => {
  const store = createStore({
    list: [{ id: 10, hello: 'world' }],
    items: [{ id: 1 }],
    hello: 'world',
    falsypath: { list: ['hey'], dict: {} },
  });

  store.set(['list', { id: 10 }, 'one', 'two'], 'monde');
  assert.deepLooseEqual(
    store.data.list[0].one.two,
    'monde',
    `should be able to set`
  );

  store.set(['two', 'age'], 34);
  assert.is(
    store.data.two.age,
    34,
    `should be possible to set a key using a path rather than a key`
  );

  store.set(['nonexistent', 'key'], 'hello');
  assert.is(
    store.data.nonexistent.key,
    'hello',
    `should be possible to set a key at an nonexistent path`
  );

  store.set(['items', { id: 1 }, 'user', 'age'], 34);
  assert.is(
    store.data.items[0].user.age,
    34,
    `should be possible to set a key using a dynamic path`
  );

  assert.throws(
    () => store.set(['items', { id: 'four' }, 'user', 'age'], 34),
    `should fail when setting a nonexistent dynamic path`
  );

  assert.throws(
    () => store.set(/test/, '45'),
    `should throw an error when the provided path is incorrect`
  );

  assert.throws(
    () => store.select(['items', { id: 2 }]).set('id', 3),
    `should fail consistently across possibilities when setting a nonexistent dynamic path`
  );

  store.set('hello', '');
  assert.is(
    store.data.hello,
    '',
    `should be possible to set a falsy value (string)`
  );

  store.set('hello', false);
  assert.strictEqual(
    store.data.hello,
    false,
    `should be possible to set a falsy value (boolean)`
  );

  const falsyCursor = store.select('falsypath');

  falsyCursor.select('dict').set('', 'hello');
  falsyCursor.select('list').set(0, 'ho');

  assert.deepEqual(
    falsyCursor.data,
    { list: ['ho'], dict: { '': 'hello' } },
    `should be possible to set values using a falsy path`
  );

  assert.end();
});

test('cursors: merge', assert => {
  assert.plan(2);
  
  const store = createStore({
    o: { hello: 'world' },
  });

  const cursor = store.select('o');

  store.onChange(() => {
    assert.deepEqual(
      store.data.o,
      { hello: 'jarl' },
      `should be possible to shallow merge two objects`
    );
  });

  cursor.merge({ hello: 'jarl' });

  assert.throws(
    () => cursor.merge('John'),
    `should throw errors when updating with wrong values`
  );

  assert.end();
});

test('cursors: unset', assert => {
  const store = createStore({
    unset: {},
    empty: {},
    deep: {
      one: 1, 
      two: 2,
    },
    list: [1, 2, 3],
    nullValue: null,
    undefinedValue: undefined,
  });

  const deepCursor = store.select('deep');
  deepCursor.unset('two');
  assert.deepEqual(
    deepCursor.data,
    { one: 1 },
    `should be possible to remove keys from a cursor`
  );
  
  const unsetCursor = store.select('two');
  unsetCursor.unset();
  assert.is(
    unsetCursor.data,
    undefined,
    `should be possible to remove data at cursor`
  );
  
  const listCursor = store.select('list');
  listCursor.unset(1);
  assert.deepEqual(
    listCursor.data,
    [1, 3],
    `should be possible to unset an array's item`
  );
  assert.is(
    listCursor.data.length,
    2,
    `unsetting an array's item should not make the array shallow`
  );

  store.unset(['empty', 'one', 'two']);
  assert.deepEqual(
    store.data.empty,
    {},
    `should do nothing to unset an inexistant key`
  );

  store.unset('nullValue');
  assert.is(
    store.exists('nullValue'),
    false,
    `should be possible to unset null`
  );

  store.unset('undefinedValue');
  assert.is(
    store.exists('undefinedValue'),
    false,
    `should be possible to unset undefined`
  );

  assert.end();
});

test('cursors: push', assert => {
  const store = createStore({ arr: [1] }).select('arr');

  store.push(2);

  assert.deepEqual(
    store.data,
    [1, 2],
    `should be able to push an array`
  );

  assert.end();
});

test('cursors: unshift', assert => {
  const store = createStore({ arr: [2] }).select('arr');

  store.unshift(1);
  
  assert.deepEqual(
    store.data,
    [1, 2],
    `should be able to unshift an array`
  );

  assert.end();
});

test('cursors: concat', assert => {
  const store = createStore({ arr: [] }).select('arr');

  store.concat([3, 4]);

  assert.deepEqual(
    store.data,
    [3, 4],
    `should be able to concat an array`
  );

  assert.end();
});

test('cursors: splice', assert => {
  const store = createStore({ list: [1, 2, 3] }).select('list');

  store.splice([0, 1]);
  store.splice([1, 1, 4]);

  assert.deepEqual(
    store.data,
    [2, 4],
    `should be possible to splice an array`
  );

  assert.throws(
    () => store.splice('John'),
    `should throw errors when updating with wrong values`
  );

  assert.end();
});

test('cursors: pop', assert => {
  const store = createStore({ list: [1, 2, 3] });
  
  store.pop('list');

  assert.deepEqual(
    store.get('list'),
    [1, 2],
    `should be possible to pop an array`
  );

  assert.end();
});

test(`cursors: shift`, assert => {
  const store = createStore({ list: [1, 2, 3] });

  store.shift('list');

  assert.deepEqual(
    store.get('list'),
    [2, 3],
    `should be possible to shift an array`
  );

  assert.end();
});
  
test('cursors: setter: upper reference resolution', assert => {
  assert.plan(1);

  const store = createStore({
    hello: { color: 'blue' }
  });

  store.onChange(() => {
    assert.is(
      store.data.hello,
      'purple',
      `should reflect the change`
    );
  });

  store.select(['hello', 'color']).set('yellow');
  store.set('hello', 'purple');

  assert.end();
});