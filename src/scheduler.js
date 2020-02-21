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
  // TODO: will this improve performance?
  // const pathMap = new Map();
  
  const process = () => {
    if (!paths.length) return (processing = false);

    // TODO: performance
    const pathMap = new Map(
      paths.reduce((memo, path) => {
        const masterPaths = permute(path)
          .map(path => [hashPath(path), path]);
        memo.push(...masterPaths);
        return memo;
      }, [])
    );

    for (const dispatcher of dispatchers) {
      dispatcher(pathMap);
    }

    event.reset();
    paths.length = 0;
    processing = false;
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