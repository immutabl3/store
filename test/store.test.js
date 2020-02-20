import test from 'tape';
import { store } from '../src';

test('wraps an object in a transparent proxy', assert => {
  assert.plan(4);

  const dataInitial = {
    foo: true,
    bar: [1, 2, { baz: true }],
  };

  const dataFinal = {
    foo: true,
    bar: [1, 2, { baz: true, qux: 'str' }, 3],
    baz: true
  };

  const proxy = store(dataInitial);

  assert.false(dataInitial === proxy);
  assert.deepEqual(dataInitial, proxy);

  proxy.baz = true;
  proxy.bar.push(3);
  proxy.bar[2].qux = 'str';

  assert.deepEqual(dataInitial, proxy);
  assert.deepEqual(dataFinal, proxy);

  assert.end();
});