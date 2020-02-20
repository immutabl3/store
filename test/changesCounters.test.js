import test from 'tape';
import { store } from '../src';
import changesCounters from '../src/changesCounters';

test('changesCounters: stores the number of times a store changed', assert => {
  assert.plan(3);

  const data = {
    foo: true,
    bar: [1, 2, { baz: true }],
  };

  const proxy = store(data);

  assert.is(changesCounters.get(proxy), 0);

  proxy.foo = true;

  assert.is(changesCounters.get(proxy), 0);

  proxy.foo = false;
  proxy.foo = true;
  proxy.foo = false;

  // changes listened-for this way aren't coaleshed nor coalesced
  assert.is(changesCounters.get(proxy), 3);

  assert.end();
});