import {
  isPrimitive,
} from '../../src/types.js';
import baseIsEqual from 'lodash/isEqual.js';

export default function isEqual(value, other) {
  if (isPrimitive(value) || isPrimitive(other)) return Object.is(value, other);
  return baseIsEqual(value, other);
};