import test from 'tape';
import delay from './delay';
import { debug, store } from '../src';

// TODO: relies on globals

test('debug: defines the STORE global', assert => {
  assert.plan(4);

  // TODO: FIXME: For some reason the used globals are different

  delete global.STORE;

  assert.is(global.STORE, undefined);

  const STORE = debug();

  assert.true(STORE.stores instanceof Array);
  assert.is(typeof STORE.log, 'function');
  assert.deepEqual(global.STORE, STORE);

  assert.end();
});

// TODO: re-enable test, but don't overwrite console.log
test.skip('debug: it called multiple times it will just return the global again', async assert => {
  assert.plan(2);

  delete global.STORE;

  let callsNr = 0;

  console.groupEnd = () => callsNr++;
  // TODO: this is bad
  // console.log = () => {}; // silencing it

  const STORE1 = debug({ logStoresNew: true });
  const STORE2 = debug({ logStoresNew: true });

  assert.deepEqual(STORE1, STORE2);

  store({});

  await delay(100);

  assert.is(callsNr, 1);
  
  assert.end();
});