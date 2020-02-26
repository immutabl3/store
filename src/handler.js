export default function handler() {
  const set = new Set();

  return {
    add(value) {
      set.add(value);
      return () => {
        if (!set.has(value)) return;
        set.delete(value);
      };
    },

    list() {
      return Array.from(set);
    },
  };
};