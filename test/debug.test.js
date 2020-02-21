import test from 'tape';
import delay from './delay';
import Store from '../src';

test('debug: logs details', async assert => {
  assert.plan(3);

  const messages = [];

  const store = Store({
    foo: 'bar',
  }, {
    debug: true,
    debugOptions: {
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
    },
  });

  store.data.foo = 'baz';

  await delay(10);

  assert.deepEqual(messages, [
    ['updated', { foo: 'baz' }]
  ]);
  
  assert.end();
});