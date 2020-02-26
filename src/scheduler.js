import event from './event';
import {
  defer,
  permute,
} from './utils';
import {
  $PAUSE,
  $RESUME,
} from './consts';
import query from './query';

export default function scheduler(asynchronous, autoCommit) {
  let debug;
  let proxy;
  let processing;
  
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

    proxy[$PAUSE];
    for (const dispatcher of dispatchers) {
      dispatcher.dispatch(map, values);
    }
    proxy[$RESUME];

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
    
    proxy(obj) {
      proxy = obj;
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