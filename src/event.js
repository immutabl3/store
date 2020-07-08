// data?: data
let dataFn;
// [ { type, path, value } ]
let transactionsList;

const event = {
  get data() {
    return dataFn ? dataFn() : undefined;
  },
  get transactions() {
    return transactionsList;
  },
};

export default function(transactions, dataGetter) {
  transactionsList = transactions;
  dataFn = dataGetter;

  return event;
};

export const clearEvent = () => {
  transactionsList = undefined;
  dataFn = undefined;
};