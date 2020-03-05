import { permute } from './utils';
import query from './query';

export default function Transactions() {
  const transactions = [];
  const map = new Map();

  const getList = hash => {
    if (map.has(hash)) return map.get(hash);
    const list = [];
    map.set(hash, list);
    return list;
  };

  return {
    list() {
      return transactions;
    },
    size() {
      return transactions.length;
    },
    clear() {
      transactions.length = 0;
      map.clear();
    },
    add(path, type, current, previous, args) {
      transactions.push({
        type,
        path,
        value: args === undefined ? current : args,
      });
    },
    map() {
      for (const transaction of transactions) {
        const { path } = transaction;
        const hash = query.hash(path);
        const list = getList(hash);
        list.push(transaction);

        const permutations = permute(path);
        for (const permutation of permutations) {
          const hash = query.hash(permutation);
          const list = getList(hash);
          list.push(transaction);
        }
      }

      return map;
    },
  };
};