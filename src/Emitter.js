export default function Emitter() {
  const events = new Set();

  return {
    add(fn, root, proxy, selector) {
      const entry = { fn, root, proxy, selector };
      events.add(entry);
      return () => {
        events.has(entry) && events.delete(entry);
      };
    },
    list() {
      return Array.from(events);
    },
  };
};