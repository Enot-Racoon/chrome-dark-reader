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
  api.create && effects.createFx.use(api.create);
  api.get && effects.getFx.use(api.get);
  api.getList && effects.getListFx.use(api.getList);
  api.update && effects.updateFx.use(api.update);
  api.replace && effects.replaceFx.use(api.replace);
  api.remove && effects.removeFx.use(api.remove);

  // Forwards from events to effects
  sample({ clock: events.get, target: effects.getFx });
  sample({ clock: events.getList, target: effects.getListFx });
  sample({ clock: events.create, target: effects.createFx });
  sample({ clock: events.update, target: effects.updateFx });
  sample({ clock: events.replace, target: effects.replaceFx });
  sample({ clock: events.remove, target: effects.removeFx });

  // Select
  stores.selected.reset(events.unselect);

  // Set flags reset logic
  stores.loadError.reset(effects.getFx, effects.getListFx);
  stores.loaded.reset(effects.getFx, effects.getListFx);

  stores.updateError.reset(
    effects.createFx,
    effects.updateFx,
    effects.replaceFx
  );
  stores.updated.reset(effects.createFx, effects.updateFx, effects.replaceFx);

  stores.removeError.reset(effects.removeFx);
  stores.removed.reset(effects.removeFx);

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
    source: Gate.state.map((props) => (props && props?.id)!),
    target: events.get,
    filter: (id) => !!id,
  });

  // Unselect selected movie on unmount
  forward({ from: Gate.close, to: events.unselect });

  // Stores update logic
  stores.list
    .on(effects.getListFx.doneData, (_, list) => list)
    .on(
      [
        effects.createFx.doneData,
        effects.updateFx.doneData,
        effects.replaceFx.doneData,
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
    .on(effects.removeFx.doneData, (state, data) => {
      const movieIndex = state.findIndex((movie) => movie.id === data?.id);

      state.splice(movieIndex, 1);

      return [...state];
    });

  stores.removingIds
    .on([effects.removeFx], (state, data) => {
      [data].flat().forEach((id) => {
        if (!state.includes(id)) {
          state.push(id);
        }
      });

      return [...state];
    })
    .on([effects.removeFx.finally], (state, { params }) => {
      [params].flat().forEach((_id) => {
        const index = state.findIndex((id) => id === _id);
        if (index > -1) {
          state.splice(index, 1);
        }
      });

      return [...state];
    });

  stores.removedIds
    .on([effects.removeFx.done], (state, { params }) => {
      [params].flat().forEach((id) => {
        if (!state.includes(id)) {
          state.push(id);
        }
      });

      return [...state];
    })
    .reset(effects.removeFx);

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
