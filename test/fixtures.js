import React from 'react';
import { store } from '../src';
import { useStore } from '../src/react';

// TODO: shared references

export const API = {
  store: store({ value: 0 }),
  increment: () => API.store.value++,
  decrement: () => API.store.value--,
};

export const AppNoSelector = ({ rendering }) => {
  rendering();
  const { value } = useStore(API.store);
  return (
    React.createElement('div', {
      id: 'value',
    }, value)
  );
};

export const AppSelector = ({ rendering }) => {
  rendering();
  const value = useStore(API.store, store => store.value);
  return (
    React.createElement('div', {
      id: 'value',
    }, value)
  );
};