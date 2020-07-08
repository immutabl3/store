import event, { clearEvent } from './event';
import { get } from './utils';
import {
  isProjection,
} from './types';
import query from './query';

export default function Dispatcher(root, emitter) {
  const emitChange = (map, list, hash, fn) => {
    const hasHash = !!hash;
    
    // no hash, emit all changes
    if (!hasHash) return fn(event(list));

    // not a root, check for transactions
    if (!map.has(hash)) return;
    const transactions = map.get(hash);
    fn(event(transactions));
  };

  const getMapper = function([key, selector]) {
    return [key, get(this, selector)];
  };
  
  const projectionReducer = (memo, [key, value]) => {
    const { hash, map, transactions, entries } = memo;
    const selector = query.solve(root, value);
    const projectedHash = query.toString(hash, selector);
    if (map.has(projectedHash)) transactions.push(...map.get(projectedHash));
    entries.push([key, selector]);
    return memo;
  };

  const emitProjection = (map, hash, value, fn) => {
    const {
      transactions,
      entries,
    } = Object.entries(value)
      .reduce(projectionReducer, {
        map,
        hash,
        transactions: [],
        entries: [],
      });
    
    if (!transactions.length) return;

    fn(event(
      transactions,
      Object.fromEntries(entries.map(getMapper, root))
    ));
  };

  const emitSelection = (map, hash, value, fn) => {
    const selector = query.solve(root, value);
    const selectedHash = query.toString(hash, selector);
    if (!map.has(selectedHash)) return;

    fn(event(
      map.get(selectedHash),
      get(root, selector)
    ));
  };

  return transactions => {
    const map = transactions.map();
    const list = transactions.list();

    for (const { fn, hash, selector } of emitter.values()) {
      if (!selector) {
        emitChange(map, list, hash, fn);
      } else {
        const value = selector();
        if (isProjection(value)) {
          emitProjection(map, hash, value, fn);
        } else {
          emitSelection(map, hash, value, fn);
        }
      }
    }

    clearEvent();
  };
};