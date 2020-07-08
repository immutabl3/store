export default function Emitter() {
  const events = new Set();

  return {
    values() {
      return events.values();
    },
    add(fn, selector, projection = false) {
      const entry = function() {
        events.has(entry) && events.delete(entry);
      };
      
      entry.fn = fn;
      entry.projection = projection;
      entry.selector = selector;

      events.add(entry);

      return entry;
    },
  };
};