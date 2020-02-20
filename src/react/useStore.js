import {
  useCallback,
  useDebugValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useMounted from 'react-use-mounted';
import changesCounters from '../changesCounters';
import onChange from '../onChange';

// TODO: move to utils
const constant = value => value;

export default function useStore(store, selector = constant, dependencies = []) {
  const mounted = useMounted();
  const storeMemo = useMemo(() => store, [store]);
  const selectorMemo = useCallback(selector, dependencies);
  // storing a ref so we won't have to resubscribe if the selector changes
  const selectorRef = useRef(selectorMemo);
  // storing the number of changes at rendering time, 
  // in order to understand if changes happened before 
  // now and commit time
  const changesCounterRendering = useMemo(() => changesCounters.get(storeMemo), [storeMemo]);
  // using an object so a re-render is triggered even 
  // if `value` is mutated (effectively remaining the 
  // same object as far as js is concerned)
  const [state, setState] = useState(() => ({ value: selectorMemo(storeMemo) }));
  let { value } = state;

  if (selectorRef.current !== selectorMemo) {
    selectorRef.current = selectorMemo;
    value = selectorMemo(storeMemo);
    setState({ value });
  }

  useDebugValue(value);

  useEffect(() => {
    // something changed while we weren't subscribed yet, updating
    if (changesCounters.get(storeMemo) > changesCounterRendering) {
      value = selectorRef.current(storeMemo);
      setState({ value });
    }
    return onChange(storeMemo, store => selectorRef.current(store), value => {
      if (!mounted.current) return;
      setState({ value });
    });
  }, [storeMemo, changesCounterRendering]);

  return value;
};