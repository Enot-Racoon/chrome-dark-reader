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
    sample({ clock: [effects.get.failData, effects.get.failData] }),
    null
  );
  const loading = combine(
    effects.get.pending,
    effects.getList.pending,
    (loading, loadingList) => loading || loadingList
  );
  const loaded = restore(
    sample({
      fn: Boolean,
      clock: [effects.get.done, effects.getList.done],
    }),
    false
  );

  // Updating
  const updateError = restore<Error>(
    sample({
      clock: [
        effects.create.failData,
        effects.update.failData,
        effects.replace.failData,
      ],
    }),
    null
  );
  const updating = combine(
    effects.create.pending,
    effects.update.pending,
    effects.replace.pending,
    (creating, updating, replacing) => creating || updating || replacing
  );
  const updated = restore(
    sample({
      fn: Boolean,
      clock: [effects.create.done, effects.update.done],
    }),
    false
  );

  // Removing
  const removeError = restore<Error>(
    sample({ clock: [effects.remove.failData] }),
    null
  );
  const removing = combine(effects.remove.pending);
  const removed = restore(
    sample({ fn: Boolean, clock: [effects.remove.done] }),
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
