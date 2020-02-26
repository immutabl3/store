import Benchmark from 'benchmark';
import { clone as lodashClone } from './legacy/clone';
import { isEqual as lodashIsEqual } from './legacy/isEqual';
import {
  clone as storeClone,
  isEqual as storeIsEqual,
} from '../src/utils';
import {
  small as obj,
  large as OBJ,
} from './fixtures';

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
  const target = OBJ();
  suite('clone', resolve, reject)
    .add('lodash', () => lodashClone(target))
    .add('store', () => storeClone(target))
    .run({ async: true });
});

const isEqual = () => new Promise((resolve, reject) => {
  const source = obj();
  const target = OBJ();
  suite('isEqual', resolve, reject)
    .add('lodash', () => lodashIsEqual(source, target))
    .add('store', () => storeIsEqual(source, target))
    .run({ async: true });
});

(async function() {
  await clone();
  await isEqual();

  console.log('done');
}());