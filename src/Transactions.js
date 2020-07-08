export default function Transactions() {
  const transactions = [];
  const map = new Map();

  return {
    // TODO: just expose
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
  };
};