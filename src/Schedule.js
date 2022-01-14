import { defer as timeoutDefer } from '@immutabl3/utils';
import Transactions from './Transactions.js';

const defer = globalThis.setImmediate ?? timeoutDefer;

export default function Schedule(dispatcher, asynchronous, autoCommit, fast) {
  let debug;
  let processing;
  
  const transactions = Transactions();
  
  const process = () => {
    if (!transactions.size()) return (processing = false);

    dispatcher(transactions);

    transactions.clear();
    processing = false;
    debug && debug();
  };
  
  const asyncProcess = async function(fn) {
    fn();
  };

  const dispatchProcess = fast ? asyncProcess : defer;

  const commit = () => {
    if (asynchronous && processing) return;
    
    if (asynchronous) {
      processing = true;
      return dispatchProcess(process);
    }

    process();
  };

  return {
    commit, 
    
    debug(bug) {
      debug = bug;
    },

    add(path, type, current, args) {
      transactions.add(path, type, current, args);
      autoCommit && commit();
    },
  };
};