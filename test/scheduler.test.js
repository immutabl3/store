import test from 'tape';
import delay from './delay';
import scheduler from '../src/scheduler';

// TODO: refactor
const reset = () => {
  clearTimeout(scheduler.triggerTimeoutId);

  scheduler.queue = new Set();
  scheduler.triggering = false;
  scheduler.triggerTimeoutId = -1;
};

test('can schedule a function for execution, avoiding duplicates', async assert => {
  reset();

  assert.plan(2);

  const calls = [];

  const fn = () => calls.push(1);

  scheduler.schedule(fn);
  scheduler.schedule(fn);

  assert.deepEqual(calls, []);

  await delay(10);

  assert.deepEqual(calls, [1]);

  assert.end();
});

test('can unschedule a function for execution', assert => {
  reset();

  assert.plan(1);

  const calls = [];

  const fn = () => calls.push(1);

  scheduler.schedule(fn);
  scheduler.unschedule(fn);
  scheduler.trigger();

  assert.deepEqual(calls, []);

  assert.end();
});

test('can schedule the current queue', async assert => {
  reset();

  assert.plan(1);

  const calls = [];

  const fn = () => calls.push(1);

  scheduler.schedule(fn);
  scheduler.unschedule();
  scheduler.schedule();

  await delay(10);

  assert.deepEqual(calls, [1]);

  assert.end();
});

test('can unschedule the current queue', async assert => {
  reset();

  assert.plan(2);

  const calls = [];

  scheduler.schedule(() => calls.push(1));
  scheduler.unschedule();

  await delay(10);

  assert.deepEqual(calls, []);

  scheduler.trigger ();

  assert.deepEqual(calls, [1]);
  
  assert.end();
});

test('can trigger execution', assert => {
  reset();

  assert.plan(1);

  const calls = [];

  scheduler.schedule(() => calls.push(1));
  scheduler.unschedule();
  scheduler.trigger();

  assert.deepEqual(calls, [1]);

  assert.end();
});

test('is not susceptible to race conditions', async assert => {
  reset();

  assert.plan(2);

  const calls = [];

  const add = () => {
    scheduler.schedule(() => {
      calls.push(3);
    });
    calls.push(2);
  };

  const remove = () => {
    scheduler.unschedule(add);
    calls.push(1);
  };

  scheduler.schedule(remove);
  scheduler.schedule(add);
  scheduler.trigger();

  assert.deepEqual(calls, [1, 2]);

  await delay(10);

  assert.deepEqual(calls, [1, 2, 3]);

  assert.end();
});