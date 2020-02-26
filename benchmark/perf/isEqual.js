import {
  isPrimitive,
} from '../../src/types';
import baseIsEqual from 'lodash/isEqual';

export default function isEqual(value, other) {
  if (isPrimitive(value) || isPrimitive(other)) return Object.is(value, other);
  return baseIsEqual(value, other);
};