export default function Emitter() {
  const events = new Set();

  return {
    values() {
      return events.values();
    },
    add(fn, root, proxy, selector) {
      const entry = { fn, root, proxy, selector };
      events.add(entry);
      return () => {
        events.has(entry) && events.delete(entry);
      };
    },
  };
};