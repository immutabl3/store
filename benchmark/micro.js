import Benchmark from 'benchmark';
import {
  clone as lodashClone,
} from './legacy/clone';
import {
  clone as storeClone,
} from '../src/utils';
import { large as obj } from './fixtures';

const suite = (name, resolve, reject) => {
  return new Benchmark.Suite()
    .on('cycle', e => console.log(`${e.target}`))
    .on('start', () => console.log(name))
    .on('complete', function() {
      console.log(`${name}: fastest: ${this.filter('fastest').map('name')}\n`);
      resolve();
    })
    .on('abort', err => {
      console.error('abort', err);
      reject(err);
    })
    .on('error', err => {
      console.error('error', err);
      reject(err);
    });
};

const clone = () => new Promise((resolve, reject) => {
  const target = obj();
  suite('clone', resolve, reject)
    .add('lodash', () => lodashClone(target))
    .add('store', () => storeClone(target))
    .run({ async: true });
});

(async function() {
  await clone();

  console.log('done');
}());