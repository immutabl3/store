/* eslint-disable no-underscore-dangle */
import event from './event';
import handler from './handler';
import { get } from './utils';
import {
  isProjection,
} from './types';
import query from './query';

const getMapper = ({ proxy }) => (
  ([key, selector]) => [key, get(proxy, selector)]
);

const projectionReducer = ({
  proxy,
  root,
}) => (memo, [key, value]) => {
  const { map, paths, entries } = memo;
  const selector = query.solve(proxy, value);
  const path = query.toString(root, selector);
  const hasPath = map.has(path);
  if (hasPath) paths.push(selector);
  entries.push([key, selector]);
  return memo;
};

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
    return this._gm || (this._gm = getMapper(this));
  },

  // lazy instantiation
  get projectionReducer() {
    return this._pr || (this._pr = projectionReducer(this));
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

    const selector = query.solve(proxy, value);
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