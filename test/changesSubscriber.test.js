import test from 'tape';
import { store } from '../src';
import delay from './delay';
import changesSubscribers from '../src/changesSubscribers';

test('changesSubscribers: it passes a cleaned-up array of changed root paths to the trigger', async assert => {
  assert.plan(3);

  const proxy = store({
    1: 1,
    2: {},
    foo: true,
    a: [1, 2, { baz: true }],
    o: {
      deep: {
        a: [1, 2, 3],
        deeper: true,
      },
    },
  });

  const changes = changesSubscribers.get(proxy);

  let paths = [];
  changes.subscribe(pths => {
    paths = pths;
  });

  proxy['1'] = 2;
  proxy['2'].foo = true;
  proxy.foo = false;
  proxy.foo = true;
  proxy.foo = true;
  proxy.a.push(3);
  proxy.a.push(4);
  proxy.a[2].baz = false;
  proxy.o.deep.foo = false;
  proxy.o.deep.a.push(4);
  proxy.o.deep.deeper = false;

  await delay(10);

  assert.deepEqual(paths, ['1', '2', 'foo', 'a', 'o']);
  assert.deepEqual(changes.paths, []);
  assert.deepEqual(changes.args, [[]]);

  assert.end();
});