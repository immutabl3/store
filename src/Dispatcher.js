import event, { clearEvent } from './event';
import { 
  get,
  partialCompare,
} from './utils';
import { solve } from './query';

const filterTransactions = (transactions, selector) => {
  if (!selector.length) return [];
  
  const results = [];
  for (const transaction of transactions) {
    const found = partialCompare(selector, transaction.path);
    if (found) results.push(transaction);
  }
  return results;
};

export default function Dispatcher(root, emitter) {
  const emitChange = (list, fn) => {
    return fn(event(list));
  };

  const getMapper = function([key, selector]) {
    return [key, get(this, selector)];
  };
  
  const reduceProjection = (list, projection) => {
    const transactions = [];
    const entries = [];
    for (const [key, value] of Object.entries(projection)) {
      const selector = solve(root, value);
      const foundTransactions = filterTransactions(list, selector);
      if (foundTransactions.length) transactions.push(...foundTransactions);
      entries.push([key, selector]);
    }

    return { transactions, entries };
  };

  const emitProjection = (list, value, fn) => {
    const {
      transactions,
      entries,
    } = reduceProjection(list, value);
    
    if (!transactions.length) return;

    fn(event(
      transactions,
      () => Object.fromEntries(entries.map(getMapper, root))
    ));
  };

  const emitSelection = (list, value, fn) => {
    const selector = solve(root, value);
    const foundTransactions = filterTransactions(list, selector);

    if (!foundTransactions.length) return;

    fn(event(
      foundTransactions,
      () => get(root, selector)
    ));
  };

  return transactions => {
    const list = transactions.list();

    for (const { fn, selector, projection } of emitter.values()) {
      if (projection) {
        emitProjection(list, selector, fn);
      } else if (!selector.length) {
        emitChange(list, fn);
      } else {
        emitSelection(list, selector, fn);
      }
    }

    clearEvent();
  };
};