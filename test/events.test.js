import test from 'tape';
import Store from '../src';
import { delay } from './utils';

test('events: call order', async assert => {
  assert.plan(1);

  const order = [];

  const store = Store({
    arr: [0, 1, 2],
  });

  store.onChange(() => order.push(1));

  store.watch(['arr', 0], () => order.push(2));

  store.watch(['arr'], () => order.push(3));

  store.data.arr[0] = 1;

  await delay();

  assert.same(order, [1, 2, 3], `events are called in subscription order`);

  assert.end();
});

test('events: change', async assert => {
  assert.plan(1);

  const store = Store({
    foo: 'bar',
    hello: 'world',
  });

  store.onChange(e => {
    assert.is(e.transactions.length, 1);
  });

  store.data.foo = 1;

  await delay();

  assert.end();
});

test('events: project', async assert => {
  assert.plan(2);

  const store = Store({
    foo: 'bar',
    hello: 'world',
  });

  store.watch({
    baz: ['foo'],
    goodbye: ['hello'],
  }, e => {
    assert.same(e.transactions, [
      {
        type: 'set',
        path: ['foo'],
        value: 1,
      }
    ]);
    assert.same(e.data, {
      baz: 1,
      goodbye: 'world',
    });
  });

  store.data.foo = 1;

  await delay();

  assert.end();
});

test('events: watch', async assert => {
  const tests = {
    async set() {
      const store = Store({ foo: 'bar' });
      
      store.watch(['foo'], ({ data, transactions }) => {
        assert.is(data, store.data.foo, `set: data`);
        assert.same(transactions, [
          {
            type: 'set',
            path: ['foo'],
            value: 'baz',
          }
        ], `set: transactions`);
      });

      store.data.foo = 'baz';
      await delay();
    },
    async delete() {
      const store = Store({ foo: 'bar' });
      
      store.watch(['foo'], ({ data, transactions }) => {
        assert.is(data, store.data.foo, `delete: data`);
        assert.same(transactions, [
          {
            type: 'delete',
            path: ['foo'],
            value: undefined,
          }
        ], `delete: transactions`);
      });

      delete store.data.foo;
      await delay();
    },
    async defineNew() {
      const store = Store({});
      
      store.watch(['foo'], ({ data, transactions }) => {
        assert.is(data, store.data.foo, `defineNew: data`);
        assert.same(transactions, [
          {
            type: 'define',
            path: ['foo'],
            value: {
              value: true,
              configurable: true,
            },
          }
        ], `defineNew: transactions`);
      });

      Object.defineProperty(store.data, 'foo', {
        configurable: true,
        value: true,
      });
    },
    async defineExisting() {
      const store = Store({ foo: 'bar' });
      
      store.watch(['foo'], ({ data, transactions }) => {
        assert.is(data, store.data.foo, `defineExisting: data`);
        assert.same(transactions, [
          {
            type: 'define',
            path: ['foo'],
            value: {
              configurable: true,
              value: 'baz',
            },
          }
        ], `defineExisting: transactions`);
      });

      Object.defineProperty(store.data, 'foo', {
        configurable: true,
        value: 'baz',
      });
    },
    async pop() {
      const store = Store({ foo: [1] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'pop',
            path: ['foo'],
            value: [],
          }
        ], `pop: transactions`);
      });

      store.data.foo.pop();
      await delay();
    },
    async shift() {
      const store = Store({ foo: [1] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'shift',
            path: ['foo'],
            value: [],
          }
        ], `shift: transactions`);
      });

      store.data.foo.shift();
      await delay();
    },
    async sort() {
      const store = Store({ foo: [3, 5, 1] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'sort',
            path: ['foo'],
            value: [],
          }
        ], `sort: transactions`);
      });

      store.data.foo.sort();
      await delay();
    },
    async reverse() {
      const store = Store({ foo: [1, 2, 3] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'reverse',
            path: ['foo'],
            value: [],
          }
        ], `reverse: transactions`);
      });

      store.data.foo.reverse();
      await delay();
    },
    async splice() {
      const store = Store({ foo: [1, 2, 3] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'splice',
            path: ['foo'],
            value: [0, 1, 2],
          }
        ], `splice: transactions`);
      });

      store.data.foo.splice(0, 1, 2);
      await delay();
    },
    async unshift() {
      const store = Store({ foo: [1] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'unshift',
            path: ['foo'],
            value: [5],
          }
        ], `unshift: transactions`);
      });

      store.data.foo.unshift(5);
      await delay();
    },
    async pushSingle() {
      const store = Store({ foo: [1] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'push',
            path: ['foo'],
            value: [5],
          }
        ], `pushSingle: transactions`);
      });

      store.data.foo.push(5);
      await delay();
    },
    async pushMultiple() {
      const store = Store({ foo: [1] });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'push',
            path: ['foo'],
            value: [-1, -2, -3],
          }
        ], `pushMultiple: transactions`);
      });

      store.data.foo.push(-1, -2, -3);
      await delay();
    },
    async add() {
      const store = Store({ foo: new Set([1]) });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'add',
            path: ['foo'],
            value: [2],
          }
        ], `add: transactions`);
      });

      store.data.foo.add(2);
      await delay();
    },
    async clear() {
      const store = Store({ foo: new Map([['1', 1]]) });
      
      store.watch(['foo'], ({ transactions }) => {
        assert.same(transactions, [
          {
            type: 'clear',
            path: ['foo'],
            value: [],
          }
        ], `clear: transactions`);
      });

      store.data.foo.clear();
      await delay();
    },
  };

  for (const fn of Object.values(tests)) await fn();

  assert.end();
});

test('events: transaction order', async assert => {
  assert.plan(3);

  const store = Store({
    one: 1,
    foo: {
      two: 2,
      bar: {
        three: 3,
      },
    },
  });

  store.onChange(e => {
    assert.same(
      e.transactions,
      [
        {
          type: 'set',
          path: ['one'],
          value: [1],
        },
        {
          type: 'set',
          path: ['foo', 'two'],
          value: [2],
        },
        {
          type: 'set',
          path: ['foo', 'bar', 'three'],
          value: [3],
        },
      ],
      `store transactions`
    );
  });
  
  store.watch(['foo', 'bar'], e => {
    assert.same(
      e.transactions, 
      [
        {
          type: 'set',
          path: ['foo', 'bar', 'three'],
          value: [3],
        },
      ],
      `watch transactions`  
    );
  });

  store.select(['foo', 'bar']).onChange(e => {
    assert.same(
      e.transactions,
      [
        {
          type: 'set',
          path: ['foo', 'bar', 'three'],
          value: [3],
        },
      ],
      `selection transactions`
    );
  });

  store.data.one = [1];
  store.data.foo.two = [2];
  store.data.foo.bar.three = [3];

  await delay();

  assert.end();
});
