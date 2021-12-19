import StoreError from '../StoreError.js';
import Context from './context.js';
import React, {
  useContext as useReactContext,
  useState,
  useEffect,
} from 'react';
import {
  isStore,
  isObjectLike,
  isFunction,
} from '../types.js';

export const useContext = function(store, ctx = Context) {
  if (!isStore(store)) throw new StoreError(`given object is not a store`, { store });

  const [state, setState] = useState(() => ({ store }));

  useEffect(() => {
    if (state.store === store) return;
    setState({ store });
  }, [store]);

  return function StoreContext({ children }) {
    return React.createElement(ctx.Provider, {
      value: { store: state.store }
    }, children);
  };
};

export const useStore = function(cursor, ctx = Context) {
  if (!isObjectLike(cursor) && !isFunction(cursor)) throw new StoreError(`invalid mapping`, { mapping: cursor });

  const context = useReactContext(ctx);
  if (!context || !isStore(context.store)) throw new StoreError(`unable to locate store`, { context });

  const { store } = context;
  const mapping = isFunction(cursor) ? cursor(store.data) : cursor;

  const [, setState] = useState(() => store.project(mapping));

  useEffect(() => {
    return store.watch(mapping, ({ data }) => setState(data));
  }, mapping);

  return store.project(mapping);
};