import Benchmark from 'benchmark';
import baseClone from './perf/clone.js';
import baseIsEqual from './perf/isEqual.js';
import baseCloneMap from './perf/cloneMap.js';
import baseCloneSet from './perf/cloneSet.js';
import {
  isEqual as storeIsEqual,
  clone as storeClone ,
} from '../src/utils.js';
import {
  small as obj,
  large as OBJ,
} from './fixtures.js';

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
    .add('base', () => baseClone(target))
    .add('store', () => storeClone(target))
    .run({ async: true });
});

const isEqual = () => new Promise((resolve, reject) => {
  const source = obj();
  const target = OBJ();
  suite('isEqual', resolve, reject)
    .add('base', () => baseIsEqual(source, target))
    .add('store', () => storeIsEqual(source, target))
    .run({ async: true });
});

const cloneMap = () => new Promise((resolve, reject) => {
  const target = new Map([
    ['1', 1],
    ['2', 2],
    ['3', 3],
    ['4', 4],
    ['5', 5],
  ]);
  suite('cloneMap', resolve, reject)
    .add('arrayMap', () => baseCloneMap.arrayMap(target))
    .add('arrayMapExternal', () => baseCloneMap.arrayMapExternal(target))
    .add('forOf', () => baseCloneMap.forOf(target))
    .add('forEach', () => baseCloneMap.forEach(target))
    .run({ async: true });
});

const cloneSet = () => new Promise((resolve, reject) => {
  const target = new Set([
    1,
    2,
    3,
    4,
    5,
  ]);
  suite('cloneSet', resolve, reject)
    .add('arrayMap', () => baseCloneSet.arrayMap(target))
    .add('arrayMapExternal', () => baseCloneSet.arrayMapExternal(target))
    .add('forOfEntries', () => baseCloneSet.forOfEntries(target))
    .add('forOfValues', () => baseCloneSet.forOfValues(target))
    .add('forEach', () => baseCloneSet.forEach(target))
    .run({ async: true });
});

(async function() {
  await clone();
  await isEqual();
  await cloneMap();
  await cloneSet();

  console.log('done');
}());