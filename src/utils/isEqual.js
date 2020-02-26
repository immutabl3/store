import baseIsEqual from 'lodash.isequal';
// import baseIsEqual from 'lodash/isEqual';
import isPrimitive from 'is-primitive';

export default function isEqual(x, y) {
  return isPrimitive(x) || isPrimitive(y) ? 
    Object.is(x, y) : 
    baseIsEqual(x, y);
};