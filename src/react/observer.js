import React, {
  useState,
} from 'react';
import Store from '../index.js';
import {
  useContext,
  useStore,
} from './hooks.js';

const KEY = 'OBSERVE';

export default function observer(Component) {
  const ObserverChild = function(props) {
    // here to trigger re-renders if props change
    useStore([KEY]);
    return React.createElement(Component, props);
  };

  return function ObserverView(props) {
    const [store] = useState(() => Store({ [KEY]: {} }));
    const Context = useContext(store);
    Object
      .entries(props)
      .forEach(([key, value]) => store.set([KEY, key], value));

    return (
      React.createElement(Context, null, 
        React.createElement(ObserverChild, props)
      )
    );
  };
};