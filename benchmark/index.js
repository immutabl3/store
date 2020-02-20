import noop from 'lodash/noop';
import { store, onChange } from '../src';
import Scheduler from '../src/scheduler';
import benchmark from 'benchloop';
import { obj, selector } from './fixtures';

Scheduler.schedule = Scheduler.trigger;

benchmark.defaultOptions = {
  ...benchmark.defaultOptions,
  iterations: 5000,
  log: 'compact',
};

benchmark({
  name: 'store',
  fn() {
    store(obj());
  },
});

benchmark({
  name: 'onChange:register:all',
  beforeEach(ctx) {
    ctx.proxy = store(obj());
  },
  fn(ctx) {
    onChange(ctx.proxy, noop);
  },
});

benchmark({
  name: 'onChange:register:selector',
  beforeEach(ctx) {
    ctx.proxy = store(obj());
  },
  fn(ctx) {
    onChange(ctx.proxy, selector, noop);
  },
});

benchmark({
  name: 'onChange:trigger:all:no',
  beforeEach(ctx) {
    ctx.proxy = store(obj());
    onChange(ctx.proxy, noop);
  },
  fn(ctx) {
    ctx.proxy.foo = 123;
  },
});

benchmark({
  name: 'onChange:trigger:all:yes',
  beforeEach(ctx) {
    ctx.proxy = store(obj());
    onChange(ctx.proxy, noop);
  },
  fn(ctx) {
    ctx.proxy.foo = 1234;
  },
});

benchmark({
  name: 'onChange:trigger:selector:no',
  beforeEach(ctx) {
    ctx.proxy = store(obj());
    onChange(ctx.proxy, selector, noop);
  },
  fn(ctx) {
    ctx.proxy.bar.deep = true;
  },
});

benchmark({
  name: 'onChange:trigger:selector:yes',
  beforeEach(ctx) {
    ctx.proxy = store(obj());
    onChange(ctx.proxy, selector, noop);
  },
  fn(ctx) {
    ctx.proxy.bar.deep = false;
  },
});

benchmark.summary();
