import test from 'tape';
import Store from '../src';
import debug from '../src/debug';
import { delay } from '../src/utils';

test('debug: logs details', async assert => {
  assert.plan(3);

  const messages = [];

  const store = Store({
    foo: 'bar',
  }, {
    debug: debug({
      log: {
        groupCollapsed() {
          assert.ok(true, 'group collapsed called');
        },
        log(...args) {
          messages.push(args);
        },
        groupEnd() {
          assert.ok(true, 'groupEnd called');
        },
      },
    }),
  });

  store.data.foo = 'baz';

  await delay(10);

  assert.deepEqual(messages, [
    ['updated', { foo: 'baz' }]
  ]);
  
  assert.end();
});