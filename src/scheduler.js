import event from './event';
import {
  defer,
  hashPath,
  permute,
} from './utils';

export default function Scheduler(asynchronous, autoCommit) {
  let debug;
  let processing;
  
  const paths = [];
  const dispatchers = [];
  const pathMap = new Map();
  
  const process = () => {
    if (!paths.length) return (processing = false);

    for (const path of paths) {
      const permutations = permute(path);
      for (const path of permutations) {
        pathMap.set(hashPath(path), path);
      }
    }

    for (const dispatcher of dispatchers) {
      dispatcher(pathMap);
    }

    event.reset();
    paths.length = 0;
    processing = false;
    pathMap.clear();
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

    register(dispatcher) {
      dispatchers.push(dispatcher);
    },

    add(path) {
      paths.push(path);
      autoCommit && commit();
    },   
  };
};