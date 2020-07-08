import event, { clearEvent } from './event';
import { 
  get,
  partialCompare,
} from './utils';
import query from './query';

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
  
  const projectionReducer = (memo, [key, value]) => {
    const { list, transactions, entries } = memo;
    const selector = query.solve(root, value);
    const foundTransactions = filterTransactions(list, selector);
    // TODO: test push vs concat perf
    if (foundTransactions.length) transactions.push(...foundTransactions);
    entries.push([key, selector]);
    return memo;
  };

  const emitProjection = (list, value, fn) => {
    // TODO: optimize
    const {
      transactions,
      entries,
    } = Object.entries(value)
      .reduce(projectionReducer, {
        list,
        transactions: [],
        entries: [],
      });
    
    if (!transactions.length) return;

    fn(event(
      transactions,
      Object.fromEntries(entries.map(getMapper, root))
    ));
  };

  const emitSelection = (list, value, fn) => {
    const selector = query.solve(root, value);
    const foundTransactions = filterTransactions(list, selector);
    if (!foundTransactions.length) return;

    fn(event(
      foundTransactions,
      get(root, selector)
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