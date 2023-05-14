import { forward, guard, sample } from "effector";
import { useGate as useGateBase } from "effector-react";
import { createGate, useEvent, useStore } from "effector-react/ssr";

import { createEffects } from "./effects";
import { createEvents } from "./events";
import { createStores } from "./stores";

export type WithId<T = object> = { id?: string } & T;

export interface RestApi<T> {
  create(data: T): Promise<T | null>;
  get(id: string): Promise<T | null>;
  getList(): Promise<T[]>;
  update(data: Partial<T>): Promise<T | null>;
  replace(data: T): Promise<T | null>;
  remove(id: string): Promise<T | null>;
}

export const createModel = <
  T extends WithId = WithId,
  P extends Partial<WithId> = object
>(
  api: Partial<RestApi<T>>
) => {
  // Gate
  const Gate = createGate<P | void>({});

  // Create effects, events and stores
  const effects = createEffects<T>();
  const events = createEvents<T>();
  const stores = createStores<T>(events, effects);

  // Set effects handlers
  api.create && effects.create.use(api.create);
  api.get && effects.get.use(api.get);
  api.getList && effects.getList.use(api.getList);
  api.update && effects.update.use(api.update);
  api.replace && effects.replace.use(api.replace);
  api.remove && effects.remove.use(api.remove);

  // Forwards from events to effects
  sample({ clock: events.get, target: effects.get });
  sample({ clock: events.getList, target: effects.getList });
  sample({ clock: events.create, target: effects.create });
  sample({ clock: events.update, target: effects.update });
  sample({ clock: events.replace, target: effects.replace });
  sample({ clock: events.remove, target: effects.remove });

  // Select
  stores.selected.reset(events.unselect);

  // Set flags reset logic
  stores.loadError.reset(effects.get, effects.getList);
  stores.loaded.reset(effects.get, effects.getList);

  stores.updateError.reset(effects.create, effects.update, effects.replace);
  stores.updated.reset(effects.create, effects.update, effects.replace);

  stores.removeError.reset(effects.remove);
  stores.removed.reset(effects.remove);

  // Autoload for SSR/SSG
  forward({ from: events.getSettled, to: Gate.state });

  // Choice api by gate params
  guard({
    clock: Gate.state,
    source: Gate.state,
    target: events.getList,
    filter: (props) => !props?.id,
  });
  guard({
    clock: Gate.state,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    source: Gate.state.map((props) => (props && props?.id)!),
    target: events.get,
    filter: (id) => !!id,
  });

  // Unselect selected movie on unmount
  forward({ from: Gate.close, to: events.unselect });

  // Stores update logic
  stores.list
    .on(effects.getList.doneData, (_, list) => list)
    .on(
      [
        effects.create.doneData,
        effects.update.doneData,
        effects.replace.doneData,
      ],
      (state, data) => {
        if (!data) return;

        const movieIndex = state.findIndex((movie) => movie.id === data.id);

        if (movieIndex > -1) {
          state.splice(movieIndex, 1, data);
        } else {
          state.push(data);
        }

        return [...state];
      }
    )
    .on(effects.remove.doneData, (state, data) => {
      const movieIndex = state.findIndex((movie) => movie.id === data?.id);

      state.splice(movieIndex, 1);

      return [...state];
    });

  stores.removingIds
    .on([effects.remove], (state, data) => {
      [data].flat().forEach((id) => {
        if (!state.includes(id)) {
          state.push(id);
        }
      });

      return [...state];
    })
    .on([effects.remove.finally], (state, { params }) => {
      [params].flat().forEach((_id) => {
        const index = state.findIndex((id) => id === _id);
        if (index > -1) {
          state.splice(index, 1);
        }
      });

      return [...state];
    });

  stores.removedIds
    .on([effects.remove.done], (state, { params }) => {
      [params].flat().forEach((id) => {
        if (!state.includes(id)) {
          state.push(id);
        }
      });

      return [...state];
    })
    .reset(effects.remove);

  //
  // Create API methods
  const useGate = (props?: P) => useGateBase(Gate, props);

  const useStores = () => ({
    selected: useStore(stores.selected),
    loadError: useStore(stores.loadError),
    list: useStore(stores.list),
    loading: useStore(stores.loading),
    loaded: useStore(stores.loaded),
    updateError: useStore(stores.updateError),
    updating: useStore(stores.updating),
    updated: useStore(stores.updated),
    removeError: useStore(stores.removeError),
    removed: useStore(stores.removed),
    removing: useStore(stores.removing),
    removedIds: useStore(stores.removedIds),
    removingIds: useStore(stores.removingIds),
  });

  const useEvents = () => ({
    get: useEvent(events.get),
    getList: useEvent(events.getList),
    create: useEvent(events.create),
    update: useEvent(events.update),
    remove: useEvent(events.remove),
    select: useEvent(events.select),
    unselect: useEvent(events.unselect),
  });

  return {
    Gate,

    effects,
    events,
    stores,

    useGate,
    useStores,
    useEvents,
  };
};
