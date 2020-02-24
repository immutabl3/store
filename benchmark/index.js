import benchmark from 'benchloop';
import noop from 'lodash/noop';
import uniqueId from 'lodash/uniqueId';
import Store from '../src';
import { obj } from './fixtures';

benchmark.defaultOptions = {
  ...benchmark.defaultOptions,
  iterations: 5000,
  log: 'compact',
};

benchmark({
  name: 'creation',
  fn() {
    Store(obj());
  },
});

benchmark({
  name: 'gets',
  beforeEach(ctx) {
    ctx.store = Store(obj(), { async: false });
  },
  fn({ store }) {
    const foo = store.data.arr[3].foo;
    return foo;
  },
});

benchmark({
  name: 'sets',
  beforeEach(ctx) {
    ctx.store = Store(obj(), { async: false });
  },
  fn({ store }) {
    store.data.arr[3].foo = uniqueId();
  },
});

benchmark({
  name: 'onChange',
  beforeEach(ctx) {
    const store = ctx.store = Store(obj(), { async: false });
    store.on('change', noop);
  },
  fn({ store }) {
    store.data.arr[3].foo = uniqueId();
  },
});

benchmark({
  name: 'watch',
  beforeEach(ctx) {
    const store = ctx.store = Store(obj(), { async: false });
    store.watch(['arr', 3, 'foo'], noop);
  },
  fn({ store }) {
    store.data.arr[3].foo = uniqueId();
  },
});

benchmark({
  name: 'projection',
  beforeEach(ctx) {
    ctx.store = Store(obj(), { async: false });
  },
  fn({ store }) {
    store.projection({ foo: ['arr', 3, 'foo'] });
  },
});

benchmark({
  name: 'select',
  beforeEach(ctx) {
    ctx.store = Store(obj(), { async: false });
  },
  fn({ store }) {
    store.select(['bar', 'deep']);
  },
});

benchmark.summary();
