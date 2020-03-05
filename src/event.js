// target: proxy
// data?: data
// transactions: [ { type, path, value }]
const event = {};

export default function(target, data, transactions) {
  event.target = target;
  event.data = data;
  event.transactions = transactions;

  return event;
};

export const clearEvent = () => {
  event.target = undefined;
  event.data = undefined;
  event.transactions = undefined;
};