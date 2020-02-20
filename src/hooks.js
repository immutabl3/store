import Subscriber from './subscriber';

export default {
  store: {
    change: new Subscriber(),
    new: new Subscriber(),
  },
};