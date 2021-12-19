import Benchmark from 'benchmark';
import uniqueId from 'lodash/uniqueId';
import { uniqueId } from '@immutabl3/utils';
import { small as obj } from './fixtures.js';

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
  suite.add('change', () => {
    // eslint-disable-next-line no-use-before-define
    const onChange = () => dispose();
    const dispose = store.watch(onChange);
    store.data.arr[3].foo = uniqueId();
    dispose();
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('watch', () => {
    // eslint-disable-next-line no-use-before-define
    const onChange = () => dispose();
    const dispose = store.watch(['arr', 3, 'foo'], onChange);
    store.data.arr[3].foo = uniqueId();
    dispose();
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('project', () => {
    store.project({ foo: ['arr', 3, 'foo'] });
  });
}());

(function() {
  const store = Store(obj(), { asynchronous: false });
  suite.add('select', () => {
    store.select(['arr', 3, 'deep']);
  });
}());

suite.run();
