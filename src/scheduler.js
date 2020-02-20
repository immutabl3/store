// TODO: can this turn into an encapsulation?
const scheduler = {
  queue: new Set(),
  triggering: false,
  triggerTimeoutId: -1,
    
  // will be overwritten by react's scheduler
  batch: fn => fn(),

  schedule: fn => {
    if (fn) scheduler.queue.add(fn);
    if (scheduler.triggerTimeoutId !== -1) return;
    scheduler.triggerTimeoutId = setTimeout(scheduler.trigger);
  },
  unschedule: fn => {
    if (fn) scheduler.queue.delete(fn);
    if (scheduler.triggerTimeoutId === -1) return;
    clearTimeout(scheduler.triggerTimeoutId);
    scheduler.triggerTimeoutId = -1;
  },
  trigger: () => {
    scheduler.unschedule();
    if (scheduler.triggering) return scheduler.schedule();
    scheduler.triggering = true;
    const fns = scheduler.queue.values();
    scheduler.queue = new Set();
    scheduler.batch(() => {
      for (const fn of fns) fn();
    });
    scheduler.triggering = false;
  },
};

export default scheduler;