// transactions: [ { type, path, value } ]
// data?: data
const event = {};

export default function(transactions, data) {
  event.data = data;
  event.transactions = transactions;

  return event;
};

export const clearEvent = () => {
  event.data = undefined;
  event.transactions = undefined;
};