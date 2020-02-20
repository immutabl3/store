import hooks from './hooks';

// TODO: encapsulation?

const changesCounters = {
  counters: new WeakMap(),

  get(store) {
    return changesCounters.counters.get(store) || 0;
  },
  increment(store) {
    changesCounters.counters.set(store, changesCounters.get(store) + 1);
  },
};

hooks.store.change.subscribe(changesCounters.increment);

export default changesCounters;