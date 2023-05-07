import {
  createEffect,
  createEvent,
  createStore,
  restore,
  sample,
  combine,
} from "effector";
import { useGate } from "effector-react";
import { createGate, useEvent, useStore } from "effector-react/compat";

import { IStorageRecord } from "../storage";

type Events<T> = ReturnType<typeof createEvents<T>>;
type Effects<T> = ReturnType<typeof createEffects<T>>;

const createEffects = <T>() => ({
  getFx: createEffect<void, T>(),
  setFx: createEffect<T, T>(),
});

const createEvents = <T>() => ({
  get: createEvent(),
  set: createEvent<T>(),
  reset: createEvent(),
});

const createStores = <T>(
  events: Events<T>,
  effects: Effects<T>,
  defaultValue: T
) => {
  const value = createStore<T>(defaultValue);
  const loadingError = restore<Error>(effects.getFx.failData, null);
  const loading = effects.getFx.pending;
  const loaded = restore(
    sample({ fn: Boolean, clock: effects.getFx.doneData }),
    false
  );

  const updatingError = restore<Error>(effects.setFx.failData, null);
  const updating = effects.setFx.pending;
  const updated = restore(
    sample({ fn: Boolean, clock: effects.setFx.doneData }),
    false
  );

  const ready = combine(
    loaded,
    updating,
    (loaded, updating) => loaded && !updating
  );

  return {
    value,
    ready,
    loadingError,
    loading,
    loaded,
    updatingError,
    updating,
    updated,
  };
};

export const createStorageModel = <T>(record: IStorageRecord<T>) => {
  const gate = createGate<void>();

  const events = createEvents<T>();
  const effects = createEffects<T>();
  const stores = createStores(events, effects, record.currentValue);

  effects.getFx.use(record.get.bind(record));
  effects.setFx.use(record.set.bind(record));

  sample({ clock: gate.open, target: events.get });
  sample({ clock: events.get, target: effects.getFx });
  sample({ clock: events.set, target: effects.setFx });

  stores.loadingError.reset(effects.getFx);
  stores.loaded.reset(effects.getFx);
  stores.updatingError.reset(effects.setFx);
  stores.updated.reset(effects.setFx);

  stores.value
    .on(events.set, (_, value) => value)
    .on(effects.setFx.doneData, (_, value) => value)
    .on(effects.getFx.doneData, (_, value) => value)
    .reset(events.reset);

  record.addChangeListener((ev) => events.set(ev.newValue));
  stores.value.updates.watch((settings) => {
    void record.set(settings);
  });

  return {
    gate,
    events,
    effects,
    stores,
    useGate: () => useGate(gate),
    useEvents: () => ({
      get: useEvent(events.get),
      set: useEvent(events.set),
      reset: useEvent(events.reset),
    }),
    useStores: () => ({
      value: useStore(stores.value),
      ready: useStore(stores.ready),
      loadingError: useStore(stores.loadingError),
      loading: useStore(stores.loading),
      loaded: useStore(stores.loaded),
      updatingError: useStore(stores.updatingError),
      updating: useStore(stores.updating),
      updated: useStore(stores.updated),
    }),
  };
};
