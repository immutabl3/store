import plainObjectIsEmpty from 'plain-object-is-empty';
import { cloneDeep } from './proxyWatcher/utils'; // UGLY
import changeSubscribers from './changesSubscribers';
import hooks from './hooks';
import { detailedDiff } from 'deep-object-diff';

const groupLog = (title, collapsed = true, fn) => {
  collapsed ? console.groupCollapsed(title) : console.group(title);
  fn();
  console.groupEnd();
};

const debug = function(opts = {}) {
  if (global.STORE) return global.STORE;
  
  const options = {
    ...debug.defaultOptions,
    ...opts
  };

  const STORE = global.STORE = {
    stores: [],
    log() {
      STORE.stores.forEach(store => {
        console.log(cloneDeep(store));
      });
    },
  };

  hooks.store.new.subscribe(store => {
    STORE.stores.push(store);

    let storePrev = cloneDeep(store);
    
    if (options.logStoresNew) {
      groupLog('Store - New', options.collapsed, () => {
        console.log(storePrev);
      });
    }

    if (options.logChangesFull || options.logChangesDiff) {
      const changes = changeSubscribers.get(store);
      changes.subscribe(() => {
        const storeNext = cloneDeep(store);
        groupLog(`Store - Change - ${new Date().toISOString()}`, options.collapsed, () => {
          if (options.logChangesDiff) {
            const { added, updated, deleted } = detailedDiff(storePrev, storeNext);
            
            if (!plainObjectIsEmpty(added)) {
              console.log('Added');
              console.log(added);
            }

            if (!plainObjectIsEmpty(updated)) {
              console.log('Updated');
              console.log(updated);
            }

            if (!plainObjectIsEmpty(deleted)) {
              console.log('Deleted');
              console.log(deleted);
            }
          }

          if (options.logChangesFull) {
            console.log('New store');
            console.log(storeNext);
            console.log('Old store');
            console.log(storePrev);
          }
        });
        
        storePrev = storeNext;
      });
    }
  });
  return STORE;
};

debug.defaultOptions = {
  collapsed: true,
  logStoresNew: false,
  logChangesDiff: true,
  logChangesFull: false,
};

export default debug;