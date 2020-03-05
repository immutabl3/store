import StoreError from '../StoreError';
import Context from './context';
import { isEqual } from '../utils';
import React, {
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  isStore,
  isObjectLike,
  isFunction,
} from '../types';

export const useRoot = function(store) {
  if (!isStore(store)) throw new StoreError(`given object is not a store`, { store });

  const [state, setState] = useState(() => ({ store }));

  useEffect(() => {
    if (state.store === store) return;
    setState({ store });
  }, [store]);

  return function({ children }) {
    return React.createElement(Context.Provider, {
      value: { store: state.store }
    }, children);
  };
};

export const useBranch = function(value) {
  if (!isObjectLike(value) && !isFunction(value)) throw new StoreError(`invalid mapping`, { mapping: value });

  const context = useContext(Context);

  if (!context || !isStore(context.store)) throw new StoreError(`unable to locate store`, { context });

  const { store } = context;

  // looking for value equality, saving the previous value
  // so that a comparison can take place
  // https://blog.logrocket.com/rethinking-hooks-memoization/
  const ref = useRef(value);

  // we need to check if the stored values have changed
  // and refresh the data accordingly
  const isDirty = !isEqual(value, ref.current);
  if (isDirty) ref.current = value;

  const { current: cursors } = ref;

  const [state, setState] = useState(() => {
    const mapping = isFunction(cursors) ? cursors(store.data) : cursors;
    return store.projection(mapping);
  });

  useEffect(() => {
    const mapping = isFunction(cursors) ? cursors(store.data) : cursors;
    const dispose = store.watch(mapping, ({ data }) => {
      setState(data);
    });

    return dispose;
  }, [
    cursors,
  ]);

  if (isDirty) {
    const mapping = isFunction(cursors) ? cursors(store.data) : cursors;
    return store.projection(mapping);
  }

  return state;
};