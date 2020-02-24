let id = 0;
export const uniqueId = () => id++;

export const delay = (ms = 10) => (
  new Promise(resolve => setTimeout(resolve, ms))
);