import Benchmark from 'benchmark';
import Store from '../src';
import BaobabTree from 'baobab';
import delay from '../test/delay';
import uniqueId from 'lodash/uniqueId';
import { obj, objLarge } from './fixtures';
import {
  store as fabio,
  onChange as fabioOnChange,
} from '@fabiospampinato/store';

// compare baobab without immutability e.g. production
// mode and in the best light possible
const Baobab = obj => new BaobabTree(obj, {
  immutable: false,
  persistent: false,
  lazyMonkeys: false,
});

const suite = (name, resolve, reject) => {
  return new Benchmark.Suite()
    .on('cycle', e => console.log(`${e.target}`))
    .on('start', () => console.log(name))
    .on('complete', function() {
      console.log(`${name}: fastest is '${this.filter('fastest').map('name')}'`);
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

const creation = () => new Promise((resolve, reject) => {
  suite('creation', resolve, reject)
    .add('store', () => Store(obj()))
    .add('baobab', () => Baobab(obj()))
    .add('fabio', () => fabio(obj()))
    .run({ async: true });
});

const get = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('get', resolve, reject)
    .add('store', () => store.data.arr[3].foo)
    .add('baobab', () => baobab.get(['arr', 3, 'foo']))
    .add('fabio', () => fab.arr[3].foo)
    .run({ async: true });
});

const set = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('get', resolve, reject)
    .add('store', () => {
      store.data.arr[3].foo = 'bar';
    })
    .add('baobab', () => {
      baobab.set(['arr', 3, 'foo', 'bar']);
    })
    .add('fabio', () => {
      fab.arr[3].foo = 'bar';
    })
    .run({ async: true });
});

const change = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('change', resolve, reject)
    .add({
      name: 'store',
      defer: true,
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        store.on('change', callback);
        store.data.arr[3].foo = uniqueId();
      },
    })
    .add({
      name: 'baobab',
      defer: true,
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        baobab.on('update', callback);
        baobab.set(['arr', 3, 'foo'], uniqueId());
      },
    })
    .add({
      name: 'fabio',
      defer: true, 
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        fabioOnChange(fab, callback);
        fab.arr[3].foo = uniqueId();
      },
    })
    .run({ async: true });
});

const watch = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('watch', resolve, reject)
    .add({
      name: 'store',
      defer: true,
      // TODO: unbinding watch
      fn: async deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          console.log(store.data.arr[3].foo);
          deferred.resolve();
        };
        store.watch(['arr', 3, 'foo'], callback);
        await delay();
        store.data.arr[3].foo = uniqueId();
      },
    })
    .add({
      name: 'baobab',
      defer: true,
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        baobab.select(['arr', 3, 'foo']).on('update', callback);
        baobab.set(['arr', 3, 'foo'], uniqueId());
      },
    })
    .add({
      name: 'fabio',
      defer: true, 
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        fabioOnChange(fab, () => Number.isFinite(fab.arr[3].foo), callback);
        fab.arr[3].foo = uniqueId();
      },
    })
    .run({ async: true });
});

// TODO: large data sets comparison
const largeDataSets = () => new Promise((resolve, reject) => {
  const store = Store(objLarge());
  const baobab = Baobab(objLarge());
  const fab = fabio(objLarge());

  suite('watch', resolve, reject)
    .add({
      name: 'store',
      defer: true,
      // TODO: unbinding watch
      fn: async deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          console.log(store.data.arr[3].foo);
          deferred.resolve();
        };
        store.watch(['arr', 3, 'foo'], callback);
        await delay();
        store.data.arr[3].foo = uniqueId();
      },
    })
    .add({
      name: 'baobab',
      defer: true,
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        baobab.select(['arr', 3, 'foo']).on('update', callback);
        baobab.set(['arr', 3, 'foo'], uniqueId());
      },
    })
    .add({
      name: 'fabio',
      defer: true, 
      fn: deferred => {
        let called = false;
        const callback = () => {
          if (called) return;
          called = true;
          deferred.resolve();
        };
        fabioOnChange(fab, () => Number.isFinite(fab.arr[3].foo), callback);
        fab.arr[3].foo = uniqueId();
      },
    })
    .run({ async: true });
});

(async function() {
  await creation();
  await get();
  await set();
  await change();
  await watch();
  // TODO: projection comparisons
  // await project();
  // TODO: large
  // await largeDataSets();

  // TODO: test efficiency of complex selectors in baobab & store

  console.log('done');
}());