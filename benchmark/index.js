import benchmark from 'benchloop';
import Store from '../src';
import { obj } from './fixtures';
import { noop, uniqueId } from '../src/utils';

benchmark.defaultOptions = {
  ...benchmark.defaultOptions,
  iterations: 5000,
  log: 'compact',
};

benchmark({
  name: 'store',
  fn() {
    Store(obj());
  },
});

benchmark({
  name: 'gets',
  beforeEach(ctx) {
    ctx.store = Store(obj());
  },
  fn({ store }) {
    const foo = store.data.arr[3].foo;
    return foo;
  },
});

benchmark({
  name: 'sets',
  beforeEach(ctx) {
    ctx.store = Store(obj());
  },
  fn({ store }) {
    store.data.arr[3].foo = uniqueId();
  },
});

benchmark({
  name: 'onChange',
  beforeEach(ctx) {
    const store = ctx.store = Store(obj());
    store.on('change', noop);
  },
  fn({ store }) {
    store.data.arr[3].foo = uniqueId();
  },
});

benchmark({
  name: 'watch',
  beforeEach(ctx) {
    const store = ctx.store = Store(obj());
    store.watch(['arr', 3, 'foo'], noop);
  },
  fn({ store }) {
    store.data.arr[3].foo = uniqueId();
  },
});

// TODO: additional checking

benchmark.summary();
