const fn = value => `${value}`;

const externalMap = ([key, value]) => [fn(key), fn(value)];

export default {
  arrayMap(map) {
    return new Map(
      Array.from(map.entries())
        .map(([key, value]) => [fn(key), fn(value)])
    );
  },
  arrayMapExternal(map) {
    return new Map(
      Array.from(map.entries())
        .map(externalMap)
    );
  },
  forOf(map) {
    const result = new Map();
    for (const [key, value] of map.entries()) {
      result.set(fn(key), fn(value));
    }
    return result;
  },
  forEach(map) {
    const result = new Map();
    map.forEach((value, key) => {
      result.set(fn(key), fn(value));
    });
    return result;
  },
};