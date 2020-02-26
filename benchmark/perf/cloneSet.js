const fn = value => `${value}`;

const externalMap = value => fn(value);

export default {
  arrayMap(set) {
    return new Set(
      Array.from(set.entries())
        .map(value => fn(value))
    );
  },
  arrayMapExternal(set) {
    return new Set(
      Array.from(set.entries())
        .map(externalMap)
    );
  },
  forOfEntries(set) {
    const result = new Set();
    for (const [value] of set.entries()) {
      result.add(fn(value));
    }
    return result;
  },
  forOfValues(set) {
    const result = new Set();
    for (const value of set.values()) {
      result.add(fn(value));
    }
    return result;
  },
  forEach(set) {
    const result = new Set();
    set.forEach(value => {
      result.add(fn(value));
    });
    return result;
  },
};