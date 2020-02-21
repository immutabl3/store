import React from 'react';
import { store } from '../src';
import { useStore } from '../src/react';
import { JSDOM } from 'jsdom';

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

export const dom = () => {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>');

  global.window = window;
  global.document = window.document;
  global.navigator = {
    userAgent: 'node.js',
  };
  global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 0);
  };
  global.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
  Object.defineProperties(global, {
    ...Object.getOwnPropertyDescriptors(window),
    ...Object.getOwnPropertyDescriptors(global),
  });
};