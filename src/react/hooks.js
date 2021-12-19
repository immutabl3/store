import StoreError from '../StoreError';
import Context from './context';
import deepEqual from './fast-deep-equal';
import React, {
  useContext as useReactContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  isStore,
  isObjectLike,
  isFunction,
} from '../types';

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

  const ref = useRef();
  const context = useReactContext(ctx);
  const [state, setState] = useState(0);
  ref.current = state;

  if (!context || !isStore(context.store)) throw new StoreError(`unable to locate store`, { context });

  const { store } = context;
  const mapping = isFunction(cursor) ? cursor(store.data) : cursor;

  useEffect(() => {
    return store.watch(mapping, () => setState(ref.current++));
  }, mapping);
    
  return store.project(mapping);
};