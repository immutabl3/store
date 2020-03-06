import Benchmark from 'benchmark';
import noop from 'lodash/noop';
import uniqueId from 'lodash/uniqueId';
import Store from '../store';
import { small as obj } from './fixtures';

const suite = new Benchmark.Suite()
  .on('cycle', e => console.log(`${e.target}`))
  .on('abort', err => {
    console.error('abort', err);
  })
  .on('error', err => {
    console.error('error', err);
  });

(function() {
  suite.add('creation', () => Store(obj()));
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('gets: direct access', () => {
    const foo = store.data.arr[3].foo;
    return foo;
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  const path = ['arr', 3, 'foo'];
  suite.add('gets: path', () => {
    const foo = store.get(path);
    return foo;
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('sets: direct access', () => {
    store.data.arr[3].foo = uniqueId();
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  const path = ['arr', 3, 'foo'];
  suite.add('sets: path', () => {
    store.set(path, uniqueId());
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('onChange', () => {
    const dispose = store.onChange(noop);
    store.data.arr[3].foo = uniqueId();
    dispose();
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('watch', () => {
    const dispose = store.watch(['arr', 3, 'foo'], noop);
    store.data.arr[3].foo = uniqueId();
    dispose();
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('projection', () => {
    store.projection({ foo: ['arr', 3, 'foo'] });
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('select', () => {
    store.select(['arr', 3, 'deep']);
  });
}());

suite.run();
