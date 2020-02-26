import {
  isPrimitive,
} from '../../src/types';
import baseIsEqual from 'lodash/isEqual';

export const isEqual = (value, other) => {
  if (isPrimitive(value) || isPrimitive(other)) return Object.is(value, other);
  return baseIsEqual(value, other);
};