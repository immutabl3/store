import test from 'tape';
import Store from '../src/index.js';
import debug from '../src/debug/index.js';
import { delay } from './utils';

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

  await delay();

  assert.same(messages, [
    ['updated', { foo: 'baz' }]
  ]);
  
  assert.end();
});