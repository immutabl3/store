import test from 'tape';
import delay from './delay';
import Subscriber from '../src/subscriber';

test(`subscriber: can add a listener, avoiding duplicates`, assert => {
  assert.plan(1);

  const subscriber = new Subscriber();
  const calls = [];

  const listener = () => calls.push(1);

  subscriber.subscribe(listener);
  subscriber.subscribe(listener);
  subscriber.trigger();

  assert.deepEqual(calls, [1]);

  assert.end();
});

test(`subscriber: can remove a listener`, assert => {
  assert.plan(1);

  const subscriber = new Subscriber();
  const calls = [];

  const listener = () => calls.push(1);

  subscriber.subscribe(listener)();
  subscriber.subscribe(listener)();
  subscriber.trigger();

  assert.deepEqual(calls, []);

  assert.end();
});

test(`subscriber: can trigger the listeners`, assert => {
  assert.plan(1);

  const subscriber = new Subscriber();
  const calls = [];

  subscriber.trigger();
  subscriber.subscribe(() => calls.push(1));
  subscriber.trigger();
  subscriber.trigger();

  assert.deepEqual(calls, [1, 1]);

  assert.end();
});

test(`subscriber: is not susceptible to race conditions`, assert => {
  assert.plan(3);

  const subscriber = new Subscriber();
  const calls = [];

  const listenerAddDisposer = () => subscriber.subscribe(function listenerAdd() {
    subscriber.subscribe(() => calls.push(3));
    calls.push(2);
  });

  subscriber.subscribe(function() {
    listenerAddDisposer();
    calls.push(1);
  });

  subscriber.trigger();

  assert.deepEqual(calls, [1]);

  subscriber.trigger();

  assert.deepEqual(calls, [1, 1, 2]);
  
  subscriber.trigger();

  assert.deepEqual(calls, [1, 1, 2, 1, 2, 2, 3]);

  assert.end();
});

test(`subscriber: can schedule execution`, async assert => {
  assert.plan(2);

  const subscriber = new Subscriber();
  const calls = [];

  subscriber.subscribe(() => calls.push(1));

  await delay(10);

  assert.deepEqual(calls, []);

  subscriber.schedule();

  await delay(10);

  assert.deepEqual(calls, [1]);

  assert.end();
});

test(`subscriber: will pass to the listeners either the trigger arguments or the instance arguments`, assert => {
  assert.plan(10);

  const subscriber = new Subscriber();
  const calls = [];
  const args = [];

  subscriber.subscribe(arg => {
    calls.push(1);
    arg !== undefined && args.push(arg);
  });

  assert.deepEqual(calls, [], `starts empty`);
  assert.deepEqual(args, [], `starts empty`);

  subscriber.trigger();

  assert.deepEqual(calls, [1], `blank trigger`);
  assert.deepEqual(args, [], `blank trigger`);

  subscriber.trigger('a');

  assert.deepEqual(calls, [1, 1], `'a' trigger`);
  assert.deepEqual(args, ['a'], `'a' trigger`);

  subscriber.args = ['i'];
  subscriber.trigger('b');

  assert.deepEqual(calls, [1, 1, 1], `'b' trigger`);
  assert.deepEqual(args, ['a', 'b'], `'b' trigger`);

  subscriber.trigger();

  assert.deepEqual(calls, [1, 1, 1, 1], `last trigger`);
  assert.deepEqual(args, ['a', 'b', 'i'], `last trigger`);

  assert.end();
});