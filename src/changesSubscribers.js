// TODO: encapsulation?
const changesSubscribers = {
  subscribers: new WeakMap(),

  get(store) {
    const subscriber = changesSubscribers.subscribers.get(store);
    if (!subscriber) throw new Error('Store not found, it got garbage-collected, you must keep a reference to it');
    return subscriber;
  },

  set(store, subscriber) {
    changesSubscribers.subscribers.set(store, subscriber);
  },
};

export default changesSubscribers;