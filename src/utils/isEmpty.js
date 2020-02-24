export default function isEmpty(obj) {
  for (const key in obj) return false;
  return true;
};