import React, { useContext, useState, useEffect } from 'react';
import {
  isPlainObject,
  isFunction,
} from './types';
import {
  isStore,
} from './utils';

const Context = React.createContext();

export const useRoot = function(store) {
  if (!isStore(store)) throw new Error(`store: given object is not a store`);

  const [state, setState] = useState(() => {
    return ({ children }) => {
      return React.createElement(Context.Provider, {
        value: { store }
      }, children);
    };
  });

  useEffect(() => {
    setState(() => {
      return ({ children }) => {
        return React.createElement(Context.Provider, {
          value: { store }
        }, children);
      };
    });
  }, [store]);

  return state;
};

export const useBranch = function(cursors) {
  if (!isPlainObject(cursors) && !isFunction(cursors)) {
    throw new Error(`store: invalid mapping`);
  }

  const context = useContext(Context);

  if (!context || !isStore(context.store)) {
    throw new Error('store: unable to locate store context');
  }

  const { store } = context;

  const [state, setState] = useState(() => {
    const mapping = isFunction(cursors) ? cursors(store.data) : cursors;
    return context.store.projection(mapping);
  });

  useEffect(() => {
    const mapping = isFunction(cursors) ? cursors(store.data) : cursors;
    const dispose = store.watch(mapping, ({ data }) => {
      setState(data);
    });

    return dispose;
  }, [cursors]);

  return state;
};