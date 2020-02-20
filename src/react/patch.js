// TODO: Add support for react-native
import ReactDom from 'react-dom';
import scheduler from '../scheduler';

// TODO: don't latch into unstable batch - create a root component
const { batch } = scheduler;
scheduler.batch = fn => ReactDom.unstable_batchedUpdates(() => batch(fn));