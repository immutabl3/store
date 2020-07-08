export default function Transactions() {
  const transactions = [];

  return {
    list() {
      return transactions;
    },
    size() {
      return transactions.length;
    },
    clear() {
      transactions.length = 0;
    },
    add(path, type, current, args) {
      transactions.push({
        type,
        path,
        value: args === undefined ? current : args,
      });
    },
  };
};