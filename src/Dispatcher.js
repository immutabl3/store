// TODO: use Event
// import Event from './Event';
import { get } from './utils';
import {
  isProjection,
} from './types';
import query from './query';

export default function Dispatcher(emitter) {
  const emitChange = (map, list, root, proxy, fn) => {
    const hasRoot = !!root;
    
    // no root, emit all changes
    if (!hasRoot) {
      return fn({
        transactions: list,
        target: proxy,
      });
    }

    // not a root, check for transactions
    if (!map.has(root)) return;
    const transactions = map.get(root);
    fn({
      transactions,
      target: proxy,
    });
  };

  const getMapper = function([key, selector]) {
    return [key, get(this, selector)];
  };
  
  const projectionReducer = (memo, [key, value]) => {
    const { root, proxy, map, transactions, entries } = memo;
    const selector = query.solve(proxy, value);
    const hash = query.toString(root, selector);
    if (map.has(hash)) transactions.push(...map.get(hash));
    entries.push([key, selector]);
    return memo;
  };

  const emitProjection = (map, root, proxy, value, fn) => {
    const {
      transactions,
      entries,
    } = Object.entries(value)
      .reduce(projectionReducer, {
        map,
        root,
        proxy,
        transactions: [],
        entries: [],
      });
    
    if (!transactions.length) return;

    fn({
      target: proxy,
      transactions,
      data: Object.fromEntries(entries.map(getMapper, proxy)),
    });
  };

  const emitSelection = (map, root, proxy, value, fn) => {
    const selector = query.solve(proxy, value);
    const hash = query.toString(root, selector);
    if (!map.has(hash)) return;

    fn({
      target: proxy,
      transactions: map.get(hash),
      data: get(proxy, selector),
    });
  };

  return transactions => {
    const map = transactions.map();
    const list = transactions.list();

    for (const { fn, selector, proxy, root } of emitter.list()) {
      if (!selector) {
        emitChange(map, list, root, proxy, fn);
      } else {
        const value = selector();
        if (isProjection(value)) {
          emitProjection(map, root, proxy, value, fn);
        } else {
          emitSelection(map, root, proxy, value, fn);
        }
      }
    }

    // TODO: clear event
  };
};