import {
  combine,
  createEffect,
  createEvent,
  createStore,
  forward,
  restore,
  sample,
} from "effector";
import * as ER from "effector-react";
import { delay } from "../common";
import type { IStorageRecord } from "../storage";

import {
  createUse,
  createUseEvents,
  createUseGate,
  createUseStores,
} from "./create-use";

type Events<T> = ReturnType<typeof createEvents<T>>;
type Effects<T> = ReturnType<typeof createEffects<T>>;

const createEffects = <T>() => ({
  get: createEffect<void, T>(),
  set: createEffect<T, T>(),
  initialize: createEffect<void, void>(),
});

const createEvents = <T>() => ({
  get: createEvent<void>(),
  set: createEvent<T>(),
  reset: createEvent<void>(),
  initialize: createEvent<void>(),
});

const createStores = <T>(
  events: Events<T>,
  effects: Effects<T>,
  defaultValue: T
) => {
  const value = createStore<T>(defaultValue);
  const initialized = createStore<boolean>(false);
  const initializeError = restore<Error>(effects.initialize.failData, null);
  const loadingError = restore<Error>(effects.get.failData, null);
  const loading = effects.get.pending;
  const loaded = restore(
    sample({ fn: Boolean, clock: effects.get.doneData }),
    false
  );

  const updatingError = restore<Error>(effects.set.failData, null);
  const updating = effects.set.pending;
  const updated = restore(
    sample({ fn: Boolean, clock: effects.set.doneData }),
    false
  );

  const ready = combine(
    loaded,
    updating,
    (loaded, updating) => loaded && !updating
  );

  return {
    value,
    initialized,
    initializeError,
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
  const gate = ER.createGate<void>();
  const events = createEvents<T>();
  const effects = createEffects<T>();
  const stores = createStores(events, effects, record.currentValue);

  //

  effects.initialize.use(delay.bind(null, 10));
  effects.get.use(record.get.bind(record));
  effects.set.use(record.set.bind(record));

  forward({ from: gate.open, to: events.initialize });
  forward({ from: events.initialize, to: effects.initialize });
  stores.initialized.on(effects.initialize.done, () => true);
  forward({ from: effects.initialize.done, to: events.get });

  forward({ from: events.get, to: effects.get });
  forward({ from: events.set, to: effects.set });

  stores.loadingError.reset(effects.get);
  stores.loaded.reset(effects.get);
  stores.updatingError.reset(effects.set);
  stores.updated.reset(effects.set);

  stores.value
    .on(events.set, (_, value) => value)
    .on(effects.set.doneData, (_, value) => value)
    .on(effects.get.doneData, (_, value) => value)
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
    useGate: createUseGate(gate),
    useEvents: createUseEvents(events),
    useStores: createUseStores(stores),
    use: createUse(events, stores),
  };
};
