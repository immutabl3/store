import test from 'tape';
import Store, { observe } from '../src/index.js';
import { wait } from '@immutabl3/utils';

test('observe: track standard mutations', async assert => {
  assert.plan(6);

  const store = Store({
    pojo: {},
    ticker: {},
  });

  const pojo = observe({
    count: 0,
  });

  class Ticker {
    constructor(value = 0) {
      this.count = value;
    }
  }
  const ticker = observe(new Ticker());

  store.set(['pojo'], pojo);
  store.set(['ticker'], ticker);

  store.watch(['pojo', 'count'], () => {
    assert.pass('can watch pojo from store level');
  });

  store.watch(['ticker', 'count'], () => {
    assert.pass('can watch observed class from store level');
  });

  store.select(['pojo']).watch(['count'], () => {
    assert.pass('can watch pojo change at count level');
  });

  store.select(['ticker']).watch(['count'], () => {
    assert.pass('can watch ticker change at count level');
  });

  pojo.count = 1;
  ticker.count = 1;

  await wait(16);

  assert.is(store.get(['pojo', 'count']), 1);
  assert.is(store.get(['ticker', 'count']), 1);

  assert.end();
});

test('observe: track "this" mutations', async assert => {
  assert.plan(6);

  const store = Store({
    pojo: {},
    ticker: {},
  });

  const pojo = observe({
    count: 0,
    add(value = 1) {
      this.count += value;
    },
  });

  class Ticker {
    constructor(value = 0) {
      this.count = value;
    }
    add(value = 1) {
      this.count += value;
    }
  }
  const ticker = observe(new Ticker());

  store.set(['pojo'], pojo);
  store.set(['ticker'], ticker);

  store.watch(['pojo', 'count'], () => {
    assert.pass('can watch pojo from store level');
  });

  store.watch(['ticker', 'count'], () => {
    assert.pass('can watch observed class from store level');
  });

  store.select(['pojo']).watch(['count'], () => {
    assert.pass('can watch pojo change at count level');
  });

  store.select(['ticker']).watch(['count'], () => {
    assert.pass('can watch ticker change at count level');
  });

  pojo.add(1);
  ticker.add(1);

  await wait(16);

  assert.is(store.get(['pojo', 'count']), 1);
  assert.is(store.get(['ticker', 'count']), 1);

  assert.end();
});

test('observe: noop calls', async assert => {
  assert.plan(2);

  const store = Store({
    pojo: {},
    ticker: {},
  });

  const pojo = observe({
    count: 0,
    noop() {
      this.count += this.count;
    },
  });

  class Ticker {
    constructor(value = 0) {
      this.count = value;
    }
    noop() {
      this.count += this.count;
    }
  }
  const ticker = observe(new Ticker());

  store.set(['pojo'], pojo);
  store.set(['ticker'], ticker);

  store.watch(['pojo', 'count'], () => {
    assert.fail('no change should trigger at pojo count level');
  });

  store.select(['pojo']).watch(['count'], () => {
    assert.fail('no change should trigger at pojo level');
  });

  store.watch(['ticker', 'count'], () => {
    assert.fail('no change should trigger at ticker count level');
  });

  store.select(['ticker']).watch(['count'], () => {
    assert.fail('no change should trigger at ticker level');
  });

  pojo.noop(1);
  ticker.noop(1);

  await wait(16);

  assert.is(store.get(['pojo', 'count']), 0);
  assert.is(store.get(['ticker', 'count']), 0);

  assert.end();
});

test('observe: track nested mutations', async assert => {
  assert.plan(3);

  const store = Store({
    pojo: {},
  });

  const pojo = observe({
    arr: [],
    add(value) {
      this.arr.push(value);
    },
  });

  store.set(['pojo'], pojo);

  store.watch(['pojo', 'arr'], () => {
    assert.pass('can watch pojo from store level');
  });

  store.select(['pojo']).watch(['arr'], () => {
    assert.pass('can watch pojo change at arr level');
  });

  pojo.add(1);

  await wait(16);

  assert.same(store.get(['pojo', 'arr']), [1]);

  assert.end();
});

test('observe: set over observes', async assert => {
  assert.plan(1);

  const store = Store({
    pojo: {},
  });

  const pojo = observe({
    arr: [],
    add(value) {
      this.arr.push(value);
    },
  });

  store.set(['pojo', 'foo'], pojo);
  store.set(['pojo', 'foo'], pojo);

  assert.pass('should not throw');

  assert.end();
});