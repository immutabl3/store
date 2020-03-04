import event from './event';
import {
  permute,
  defer,
} from './utils';
import query from './query';

export default function scheduler(asynchronous, autoCommit) {
  let debug;
  let processing;
  let locker;
  
  const paths = [];
  const dispatchers = [];
  const map = new Map();
  
  const process = () => {
    if (!paths.length) return (processing = false);

    for (const path of paths) {
      const initialPath = query.hash(path);
      if (map.has(initialPath)) continue;
      
      const permutations = permute(path);
      for (const path of permutations) {
        map.set(query.hash(path), path);
      }
    }

    const values = dispatchers.length ? Array.from(map.values()) : [];

    locker.lock();
    for (const dispatcher of dispatchers) {
      dispatcher.dispatch(map, values);
    }
    locker.unlock();

    event.reset();
    paths.length = 0;
    processing = false;
    map.clear();
    debug && debug();
  };

  const commit = () => {
    if (asynchronous && processing) return;
    
    if (asynchronous) {
      processing = true;
      return defer(process);
    }

    process();
  };

  return {
    debug(bug) {
      debug = bug;
    },
    
    locker(lock) {
      locker = lock;
    },

    register(dispatcher) {
      dispatchers.push(dispatcher);
    },

    add(path) {
      paths.push(path);
      autoCommit && commit();
    },   
  };
};