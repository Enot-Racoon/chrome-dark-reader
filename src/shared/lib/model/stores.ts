import { combine, createStore, restore, sample } from "effector";

import { createEffects } from "./effects";
import { createEvents } from "./events";

type Events<T> = ReturnType<typeof createEvents<T>>;
type Effects<T> = ReturnType<typeof createEffects<T>>;

export const createStores = <T>(events: Events<T>, effects: Effects<T>) => {
  // Main stores
  const list = createStore<T[]>([]);
  const selected = restore<T>(events.select, null);

  // Flag stores

  // Loading
  const loadError = restore<Error>(
    sample({ clock: [effects.getFx.failData, effects.getFx.failData] }),
    null
  );
  const loading = combine(
    effects.getFx.pending,
    effects.getListFx.pending,
    (loading, loadingList) => loading || loadingList
  );
  const loaded = restore(
    sample({
      fn: Boolean,
      clock: [effects.getFx.done, effects.getListFx.done],
    }),
    false
  );

  // Updating
  const updateError = restore<Error>(
    sample({
      clock: [
        effects.createFx.failData,
        effects.updateFx.failData,
        effects.replaceFx.failData,
      ],
    }),
    null
  );
  const updating = combine(
    effects.createFx.pending,
    effects.updateFx.pending,
    effects.replaceFx.pending,
    (creating, updating, replacing) => creating || updating || replacing
  );
  const updated = restore(
    sample({
      fn: Boolean,
      clock: [effects.createFx.done, effects.updateFx.done],
    }),
    false
  );

  // Removing
  const removeError = restore<Error>(
    sample({ clock: [effects.removeFx.failData] }),
    null
  );
  const removing = combine(effects.removeFx.pending);
  const removed = restore(
    sample({ fn: Boolean, clock: [effects.removeFx.done] }),
    false
  );

  const updatingIds = createStore<string[]>([]);
  const updatedIds = createStore<string[]>([]);
  const removingIds = createStore<string[]>([]);
  const removedIds = createStore<string[]>([]);

  return {
    selected,
    loadError,
    list,
    loading,
    loaded,
    updating,
    updated,
    updateError,
    removeError,
    removing,
    removed,
    updatingIds,
    updatedIds,
    removingIds,
    removedIds,
  };
};
