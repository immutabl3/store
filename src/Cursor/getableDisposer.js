import {
  isArray,
  isProjection,
} from '../types';

const PROJECTION = Symbol('projection');
const GET = Symbol('get');

const get = function() {
  const value = isArray(this.selector) ? this.selector : this.selector();
  return isProjection(value) ? this[PROJECTION](value) : this[GET](value);
};

export default function getableDisposer(api, disposer) {
  disposer.get = get;
  disposer[GET] = api.get;
  disposer[PROJECTION] = api.projection;

  return disposer;
};