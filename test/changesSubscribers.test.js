import test from 'tape';
import { store } from '../src';
import changesSubscriber from '../src/changesSubscriber';
import changesSubscribers from '../src/changesSubscribers';

test('changesSubscribers: retrieves the ChangeSubscriber for each store', assert => {
  assert.plan(1);

  const proxy = store({});
  const changes = changesSubscribers.get(proxy);

  assert.true(changes instanceof changesSubscriber);

  assert.end();
});

test('changesSubscribers: throws if no ChangeSubscriber has been found ', assert => {
  assert.plan(1);
  
  assert.throws(() => changesSubscribers.get({}), /garbage-collected/i);
  
  assert.end();
});