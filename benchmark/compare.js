import Benchmark from 'benchmark';
import Store from '../store';
import BaobabTree from 'baobab';
import { delay as baseDelay } from '../test/utils';
import uniqueId from 'lodash/uniqueId';
import { large as obj } from './fixtures';
import {
  store as fabio,
  onChange as fabioOnChange,
} from '@fabiospampinato/store';

const delay = () => baseDelay(0);

const Baobab = obj => new BaobabTree(obj, {
  // compare baobab without immutability e.g. production mode
  immutable: false,
  // neither store nor fabio persist
  persistent: false,
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

const access = () => new Promise((resolve, reject) => {
  const { data } = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('access', resolve, reject)
    .add('store', () => data.arr[3].foo)
    .add('baobab', () => baobab.get(['arr', 3, 'foo']))
    .add('fabio', () => fab.arr[3].foo)
    .run({ async: true });
});

const get = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());

  suite('get', resolve, reject)
    .add('store', () => store.get(['arr', 3, 'foo']))
    .add('baobab', () => baobab.get(['arr', 3, 'foo']))
    .run({ async: true });
});

const set = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('set', resolve, reject)
    .add('store', () => {
      store.data.arr[3].foo = 'bar';
    })
    .add('baobab', () => {
      baobab.set(['arr', 3, 'foo'], 'bar');
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
    .add('store', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      store.onChange(callback);
      await delay();
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
      await delay();
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
      await delay();
      fab.arr[3].foo = uniqueId();
    }, { defer: true })
    .run({ async: true });
});

const watch = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const fab = fabio(obj());

  suite('watch', resolve, reject)
    .add('store', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      store.watch(['arr', 3, 'foo'], callback);
      await delay();
      store.data.arr[3].foo = uniqueId();
    }, { defer: true })
    .add('baobab', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      baobab.select(['arr', 3, 'foo']).on('update', callback);
      await delay();
      baobab.set(['arr', 3, 'foo'], uniqueId());
    }, { defer: true })
    .add('fabio', async deferred => {
      let called = false;
      const callback = () => {
        if (called) return;
        called = true;
        deferred.resolve();
      };
      fabioOnChange(fab, () => {
        return fab.arr[3].foo !== 'bar';
      }, callback);
      await delay();
      fab.arr[3].foo = uniqueId();
    }, { defer: true })
    .run({ async: true });
});

const projection = () => new Promise((resolve, reject) => {
  const store = Store(obj());
  const baobab = Baobab(obj());
  const mapping = {
    foo: ['arr', 3, 'foo'],
  };

  suite('projection', resolve, reject)
    .add('store', () => {
      return store.projection(mapping);
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
  await access();
  await get();
  await set();
  await change();
  await watch();
  await projection();
  await select();
  await complexSelectors();

  console.log('done');
}());