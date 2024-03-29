import React from 'react';
import StoreError from '../StoreError.js';
import {
  isStore,
  isFunction,
  isObjectLike,
} from '../types.js';
import {
  useContext,
  useStore,
} from './hooks.js';

const displayName = Component => {
  return Component.name || Component.displayName || 'Component';
};

const curry = (fn, arity) => {
  return function f1(...args) {
    if (args.length >= arity) return fn(...args);
    return function f2(...args2) {
      return f1(...[...args, ...args2]);
    };
  };
};

const root = function(store, Component) {
  if (!isStore(store)) throw new StoreError(`given object is not a store.`, { store });
  if (!isFunction(Component)) throw new StoreError(`given target is not a valid React component.`, { Component });

  const name = displayName(Component);

  const Root = function(props) {
    const Root = useContext(store);
    return (
      React.createElement(Root, null,
        React.createElement(Component, props)
      )
    );
  };

  Root.displayName = `Rooted${name}`;

  return Root;
};

const branch = function(cursors, Component) {
  if (!isFunction(Component)) throw new StoreError(`given target is not a valid React component`, { Component });

  const name = displayName(Component);

  const functionalCursor = isFunction(cursors);
  if (!isObjectLike(cursors) && !functionalCursor) throw new StoreError(`invalid mapping`, { mapping: cursors });

  const Branch = function(props) {
    const state = useStore(functionalCursor ? cursors(props) : cursors);
    return React.createElement(Component,
      {
        ...props,
        ...state,
      }
    );
  };

  Branch.displayName = `Branched${name}`;

  return Branch;
};

const curriedRoot = curry(root, 2);
const curriedBranch = curry(branch, 2);

export {
  curriedRoot as root,
  curriedBranch as branch,
};