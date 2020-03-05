export default function Emitter() {
  const events = new Set();

  return {
    values() {
      return events.values();
    },
    add(fn, root, proxy, selector) {
      const entry = function() {
        events.has(entry) && events.delete(entry);
      };
      
      entry.fn = fn;
      entry.root = root;
      entry.proxy = proxy;
      entry.selector = selector;

      events.add(entry);

      return entry;
    },
  };
};