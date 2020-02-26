import event from './event';
import handler from './handler';
import get from './utils/get';
import {
  isProjection,
} from './types';
import query from './query';

const GET_MAPPER = Symbol('get_iterator');
const PROJECTION_REDUCER = Symbol('projection_iterator');

const Dispatcher = function(proxy, onChange, path = []) {
  this.root = query.hash(path);
  this.hasRoot = !!this.root;
  this.emitter = handler();
  this.proxy = proxy;
  this.onChange = onChange;
};

Dispatcher.prototype = {
  // lazy instantiation
  get getMapper() {
    if (this[GET_MAPPER]) return this[GET_MAPPER];

    this[GET_MAPPER] = ([key, selector]) => [key, get(this.proxy, selector)];

    return this[GET_MAPPER];
  },

  // lazy instantiation
  get projectionReducer() {
    if (this[PROJECTION_REDUCER]) return this[PROJECTION_REDUCER];
    
    this[PROJECTION_REDUCER] = (memo, [key, value]) => {
      const { map, paths, entries } = memo;
      const selector = query.resolve(this.proxy, value);
      const path = query.toString(this.root, selector);
      const hasPath = map.has(path);
      if (hasPath) paths.push(selector);
      entries.push([key, selector]);
      return memo;
    };

    return this[PROJECTION_REDUCER];
  },

  emitProjection(map, value, fn) {
    const {
      paths,
      entries,
    } = Object.entries(value)
      .reduce(this.projectionReducer, {
        map,
        paths: [],
        entries: [],
      });
    
    if (!paths.length) return;

    fn(event(
      paths,
      Object.fromEntries(entries.map(this.getMapper))
    ));
  },

  emitSelection(map, value, fn) {
    const {
      root,
      proxy
    } = this;

    const selector = query.resolve(proxy, value);
    const path = query.toString(root, selector);
    if (!map.has(path)) return;

    fn(event(
      [selector],
      get(proxy, selector)
    ));
  },

  dispatch(map, values) {
    const {
      root,
      proxy,
      hasRoot,
      emitter,
    } = this;

    if (!hasRoot || (hasRoot && map.has(root))) {
      this.onChange(event(
        values,
        proxy,
      ));
    }

    for (const [selectorFn, fn] of emitter.list()) {
      const value = selectorFn();
      if (isProjection(value)) {
        this.emitProjection(map, value, fn);
      } else {
        this.emitSelection(map, value, fn);
      }
    }
  },

  watcher(selector, cursor, fn) {
    const entry = [selector, fn];
    
    const disposer = this.emitter.add(entry);

    disposer.get = () => {
      const value = selector();
      return isProjection(value) ? cursor.projection(value) : cursor.get(value);
    };

    return disposer;
  },
};

export default Dispatcher;