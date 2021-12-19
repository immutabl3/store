import { defer } from './utils';
import Transactions from './Transactions.js';

export default function Schedule(dispatcher, asynchronous, autoCommit) {
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

  const commit = () => {
    if (asynchronous && processing) return;
    
    if (asynchronous) {
      processing = true;
      return defer(process);
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