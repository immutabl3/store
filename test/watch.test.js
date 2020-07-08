import test from 'tape';
import isFunction from 'lodash/isFunction';
import Store from '../src';
import { delay } from './utils';

// TODO: this is a recorder

export const Data = function(object) {
  let changes = 0;
  let paths = [];

  const store = Store(object);

  const fixture = {
    err(fn) {
      store.watch(['noop'], () => {
        fn(`watching an invalid value shouldn't trigger`);
      });
      return this;
    },
    watch(path = []) {
      store.watch(path, ({ transactions }) => {
        changes++;
        paths = [
          ...paths,
          ...transactions.map(({ path }) => path)
        ];
      });
      return this;
    },
    get changes() {
      return changes;
    },
    get paths() {
      const result = paths;
      // resetting
      paths = [];
      return result;
    },
    ready() {
      return [
        store,
        fixture,
      ];
    },
  };

  return fixture;
};

test('watch: event data', async assert => {
  assert.plan(4);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  store.watch(['foo'], e => {
    assert.same(e.data, store.data.foo, `foo: data passed`);
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['foo'],
        value: 1234,
      }
    ], `foo: transaction passed`);
  });
  store.watch(['bar'], e => {
    assert.same(e.data, store.data.bar, `bar: data passed`);
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['bar', 'foo'],
        value: true,
      }
    ], `bar: transaction passed`);
  });

  store.data.foo = 1234;
  store.data.bar.foo = true;

  await delay();

  assert.end();
});

test('watch: selector types', async assert => {
  assert.plan(2);

  const [store, fixture] = Data({
    foo: 123,
    arr: [0],
  })
    .err(err => assert.fail(err))
    .watch('foo')
    .watch(['foo'])
    .watch(['arr', 0])
    .ready();

  store.data.foo = 1234;
  store.data.arr[0] = 1;

  await delay();

  assert.is(fixture.changes, 3);
  assert.same(fixture.paths, [
    ['foo'],
    ['foo'],
    ['arr', 0],
  ]);

  assert.end();
});

test('watch: static selector', async assert => {
  assert.plan(3);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });
  const calls = [];

  store.watch(['noop'], () => {
    assert.fail(`watching an invalid value shouldn't trigger`);
  });
  store.watch(['foo'], e => {
    assert.is(e.data, store.data.foo);
    calls.push(1);
  });
  store.watch(['bar'], e => {
    assert.same(e.data, store.data.bar);
    calls.push(2);
  });

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.foo = true;

  await delay();

  assert.same(calls, [1, 2]);

  assert.end();
});

test('watch: deep static selector', async assert => {
  assert.plan(6);

  const [store, fixture] = Data({
    arr: [1, 2, '3', { foo: 'bar' }],
  })
    .err(err => assert.fail(err))
    .watch(['arr', 3, 'foo'])
    .ready();

  await delay();

  store.data.arr[3].foo = 0;

  await delay();

  assert.is(fixture.changes, 1);
  assert.same(fixture.paths, [
    ['arr', 3, 'foo'],
  ]);
  
  store.data.arr[3].foo = 1;

  await delay();

  assert.is(fixture.changes, 2);
  assert.same(fixture.paths, [
    ['arr', 3, 'foo'],
  ]);

  store.data.arr[3].foo = 2;

  await delay();

  assert.is(fixture.changes, 3);
  assert.same(fixture.paths, [
    ['arr', 3, 'foo'],
  ]);

  assert.end();
});

test('watch: complex selector', async assert => {
  assert.plan(4);

  const [store, fixture] = Data({
    arr: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
    ],
  })
    .err(err => assert.fail(err))
    .watch(['arr', { foo: 2 }])
    .ready();

  store.data.arr[1].bar = 'baz';

  await delay();

  assert.is(fixture.changes, 1);
  assert.same(fixture.paths, [
    ['arr', 1, 'bar'],
  ], `bar: call made, selected object changed`);

  store.data.arr[1].foo = 0;

  await delay();

  assert.is(fixture.changes, 1);
  assert.same(fixture.paths, [], `foo: call made, not watching this object`);

  assert.end();
});

test(`watch: same data assignments don't emit changes`, async assert => {
  assert.plan(10);

  const [store, fixture] = Data({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  })
    .err(err => assert.fail(err))
    .watch(['foo'])
    .watch(['bar'])
    .watch(['bar', 'deep', 0])
    .ready();

  store.data.foo = 123;
  store.data.bar = store.data.bar;
  store.data.bar = { deep: [1, 2, 3] };
  store.data.bar.deep[0] = 1;

  await delay();

  assert.is(fixture.changes, 0);
  assert.same(fixture.paths, []);

  store.data.foo = 1234;

  await delay();

  assert.is(fixture.changes, 1);
  assert.same(fixture.paths, [
    ['foo'],
  ]);

  store.data.bar.foo = true;

  await delay();

  assert.is(fixture.changes, 2);
  assert.same(fixture.paths, [
    ['bar', 'foo'],
  ]);

  store.data.bar.deep.push(4);

  await delay();

  assert.is(fixture.changes, 3);
  assert.same(fixture.paths, [
    ['bar', 'deep'],
  ]);

  store.data.bar.deep[0] = 2;

  await delay();

  assert.is(fixture.changes, 5, `2 watchers counts 2 changes`);
  assert.same(fixture.paths, [
    ['bar', 'deep', 0],
    ['bar', 'deep', 0],
  ], `found changes for both watchers`);

  assert.end();
});

test('watch: is disposable', async assert => {
  assert.plan(3);

  const store = Store({
    arr: [1, 2, '3', { foo: 'bar' }],
  });
  
  const calls = [];

  const watcher = store.watch(['arr', 3, 'foo'], () => calls.push(1));

  assert.ok(isFunction(watcher), `watch returned disposer function`);

  store.data.arr[3].foo = 0;

  await delay();

  assert.same(calls, [1], `made a call on data change`);

  // dispose
  watcher();

  store.data.arr[3].foo = 1;

  assert.same(calls, [1], `did not make a call after disposed`);

  assert.end();
});

test('watch: basic project', async assert => {
  assert.plan(2);

  const store = Store({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  });

  store.watch({
    hello: ['foo'],
    world: ['bar', 'deep', 0],
  }, e => {
    assert.is(e.data.hello, store.data.foo);
    assert.is(e.data.world, store.data.bar.deep[0]);
  });

  store.data.baz = true;
  store.data.foo = 1234;
  store.data.bar.deep[0] = 0;

  await delay();

  assert.end();
});

test(`watch: deep project`, async assert => {
  assert.plan(10);

  const [store, fixture] = Data({
    foo: 123,
    bar: {
      deep: [1, 2, 3],
    },
  })
    .err(err => assert.fail(err))
    .watch({ helloworld: ['foo'] })
    .watch({ helloworld: ['bar'] })
    .watch({ helloworld: ['bar', 'deep', 0] })
    .ready();
  
  store.data.foo = 123;
  store.data.bar = store.data.bar;
  store.data.bar = { deep: [1, 2, 3] };
  store.data.bar.deep[0] = 1;

  await delay();

  assert.is(fixture.changes, 0);
  assert.same(fixture.paths, []);

  store.data.foo = 1234;

  await delay();

  assert.is(fixture.changes, 1);
  assert.same(fixture.paths, [
    ['foo'],
  ]);

  store.data.bar.foo = true;

  await delay();

  assert.is(fixture.changes, 2);
  assert.same(fixture.paths, [
    ['bar', 'foo'],
  ]);

  store.data.bar.deep.push(4);

  await delay();

  assert.is(fixture.changes, 3);
  assert.same(fixture.paths, [
    ['bar', 'deep'],
  ]);

  store.data.bar.deep[0] = 2;

  await delay();

  assert.is(fixture.changes, 5);
  assert.same(fixture.paths, [
    ['bar', 'deep', 0],
    ['bar', 'deep', 0],
  ]);

  assert.end();
});

test('watch: project on invalid paths', async assert => {
  const store = Store({});

  store.watch({
    hello: ['foo'],
  }, () => {
    assert.fail(`path doesn't exist`);
  });

  store.data.biz = true;

  await delay();

  assert.pass(`no change event fired`);

  assert.end();
});

test('watch: passive values', async assert => {
  const store = Store({
    arr: [1],
  });

  store.watch(['arr', 'length'], () => {
    assert.fail(`cannot watch a passively changing value`);
  });

  store.data.arr.push(2);

  await delay();
  
  assert.pass(`a passive value does not trigger a change event`);

  assert.end();
});