import {
  $PAUSE,
  $RESUME,
} from './consts.js';

export default function locker(proxy) {
  let locks = 0;
  return {
    lock() {
      if (locks === 0) proxy[$PAUSE];
      locks++;
    },
    unlock() {
      locks = locks === 0 ? 0 : locks - 1;
      if (locks === 0) proxy[$RESUME];
    },
  };
};