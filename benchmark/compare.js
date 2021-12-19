import Benchmark from 'benchmark';
import Store from '../dist/bundle.min.cjs';
import BaobabTree from 'baobab';
import { wait, uniqueId } from '@immutabl3/utils';
import { large as obj } from './fixtures.js';
import {
  store as fabio,
  onChange as fabioOnChange,
} from '@fabiospampinato/store';

const Baobab = obj => new BaobabTree(obj, {
  // compare baobab without immutability e.g. production mode
  immutable: false,
  // neither store nor fabio persist
  persistent: false,
  // turn off async
  asynchronous: false,
  // we don't have these capabilities, turn off
  lazyMonkeys: false,
  monkeyBusiness: false,
});

const suite = (name, resolve, reject) => {
  return new Benchmark.Suite()
    .on('cycle', e => console.log(`${e.target}`))
    .on('start', () => console.log(name))
    .on('complete', function() {
      console.log(`fastest: ${this.filter('fastest').map('name')}\n`);
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

const getAccess = () => new Promise((resolve, reject) => {
  const { data } = Store(obj());
  const fab = fabio(obj());

  suite('get: access', resolve, reject)
    .add('store', () => data.arr[3].foo)
    .add('fabio', () => fab.arr[3].foo)
    .run({ async: true });
});

const getPath = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());

  suite('get: path', resolve, reject)
    .add('store', () => store.get(['arr', 3, 'foo']))
    .add('baobab', () => baobab.get(['arr', 3, 'foo']))
    .run({ async: true });
});

const setAccess = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const fab = fabio(obj());

  suite('set: access', resolve, reject)
    .add('store', () => {
      store.data.arr[3].foo = 'bar';
    })
    .add('fabio', () => {
      fab.arr[3].foo = 'bar';
    })
    .run({ async: true });
});

const setPath = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());

  suite('set: path', resolve, reject)
    .add('store', () => {
      store.set(['arr', 3, 'foo'], uniqueId());
    })
    .add('baobab', () => {
      baobab.set(['arr', 3, 'foo'], uniqueId());
    })
    .run({ async: true });
});

const change = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('change', resolve, reject)
    .add('store', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      store.watch(callback);
      await wait();
      store.data.arr[3].foo = uniqueId();
    }, { defer: true })
    .add('baobab', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      baobab.on('update', callback);
      await wait();
      baobab.set(['arr', 3, 'foo'], uniqueId());
    }, { defer: true })
    .add('fabio', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      fabioOnChange(fab, callback);
      await wait();
      fab.arr[3].foo = uniqueId();
    }, { defer: true })
    .run({ async: true });
});

const watch = () => new Promise((resolve, reject) => {
  const store = Store(obj(), { asynchronous: false });
  const baobab = Baobab(obj());
  const cursor = baobab.select(['arr', 3, 'foo']);
  const fab = fabio(obj());

  suite('watch', resolve, reject)
    .add('store', () => {
      // eslint-disable-next-line no-use-before-define
      const callback = () => dispose();
      const dispose = store.watch(['arr', 3, 'foo'], callback);
      store.data.arr[3].foo = uniqueId();
    })
    .add('baobab', () => {
      const callback = () => cursor.off('update', callback);
      cursor.on('update', callback);
      baobab.set(['arr', 3, 'foo'], uniqueId());
    })
    .add('fabio', () => {
      // eslint-disable-next-line no-use-before-define
      const callback = () => dispose();
      const dispose = fabioOnChange(fab, () => {
        return fab.arr[3].foo;
      }, callback);
      fab.arr[3].foo = uniqueId();
    })
    .run({ async: true });
});

const project = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const mapping = {
    foo: ['arr', 3, 'foo'],
  };

  suite('project', resolve, reject)
    .add('store', () => {
      return store.project(mapping);
    })
    .add('baobab', () => {
      return baobab.project(mapping);
    })
    .run({ async: true });
});

const select = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const path = () => ['arr', 3, 'foo'];

  suite('select', resolve, reject)
    .add('store', () => store.select(path()))
    .add('baobab', () => baobab.select(path()))
    .run({ async: true });
});

const complexSelectors = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const path = () => [
    'arr',
    { foo: 'bar' },
    'baz',
    () => 0
  ];

  suite('complex selectors', resolve, reject)
    .add('store', () => store.get(path()))
    .add('baobab', () => baobab.get(path()))
    .run({ async: true });
});

(async function() {
  await getAccess();
  await getPath();
  await setAccess();
  await setPath();
  await change();
  await watch();
  await project();
  await select();
  await complexSelectors();

  console.log('done');
}());