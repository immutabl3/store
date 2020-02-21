import { cloneDeep } from './utils';
import plainObjectIsEmpty from 'plain-object-is-empty';
import { detailedDiff } from 'deep-object-diff';

const groupLog = (log, collapsed) => {
  return {
    open(title) {
      collapsed ? log.groupCollapsed(title) : log.group(title);
    },
    log(...args) {
      log.log(...args);
    },
    close() {
      log.groupEnd();
    },
  };
};

const debug = function(proxy, opts = {}) {
  const {
    full,
    diffs,
    collapsed,
    log,
  } = {
    ...debug.options,
    ...opts,
  };

  const logger = groupLog(log, collapsed);

  let prev = cloneDeep(proxy);

  return () => {
    const next = cloneDeep(proxy);
    
    logger.open(`store: change: ${new Date().toISOString()}`);

    const {
      added,
      updated,
      deleted,
    } = detailedDiff(prev, next);
    
    if (diffs && !plainObjectIsEmpty(added)) {
      logger.log('added', added);
    }

    if (diffs && !plainObjectIsEmpty(updated)) {
      logger.log('updated', updated);
    }

    if (diffs && !plainObjectIsEmpty(deleted)) {
      logger.log('deleted', deleted);
    }

    if (full) {
      logger.log('new state', next);
      logger.log('old state', prev);
    }

    logger.close();

    prev = next;
    return this;
  };
};

debug.options = {
  collapsed: true,
  diffs: true,
  full: false,
  log: console,
};

export default debug;