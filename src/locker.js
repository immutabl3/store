import {
  $PAUSE,
  $RESUME,
} from './consts';

export default function locker(proxy) {
  let locks = 0;
  return {
    lock() {
      if (locks === 0) proxy[$PAUSE];
      locks++;
    },
    unlock() {
      locks--;
      if (locks === 0) proxy[$RESUME];
    },
  };
};