import { createGate, useEvent, useGate, useStore } from "effector-react";
import {
  combine,
  createEffect,
  createEvent,
  createStore,
  Effect,
  Event,
  restore,
  sample,
  Store,
} from "effector";

import * as TabApi from "./api";
import type { Tab, Settings } from "shared/types/entities";

export type ITabSetEventArgs = Partial<Omit<Tab.ITabSettings, "host">>;

export interface ITabEvents {
  init: Event<void>;
  set: Event<ITabSetEventArgs>;
  enable: Event<void>;
  disable: Event<void>;
  toggle: Event<void>;
  setEnabled: Event<boolean | null>;
}

export interface ITabEffects {
  init: Effect<void, Tab.ITab>;
}

export interface ITabStores {
  host: Store<string>;
  enabled: Store<boolean>;
  rules: Store<Tab.ITabSettingsCssRule[]>;
  tab: Store<Tab.ITab | null>;
  tabError: Store<Error | null>;
  settings: Store<Tab.ITabSettings>;
}

// export interface ITabModel {
//   gate: Gate<void>;
//   events: ITabEvents;
//   effects: ITabEffects;
//   stores: ITabStores;
//   useGate: () => void;
//   useEvents: () => {
//     [K in keyof ITabEvents]: (...args: Parameters<ITabEvents[K]>) => void;
//   };
//   useStores: () => {
//     // [K in keyof ITabEffects]:
//   };
// }

export interface ICreateModelOpts {
  settings: Store<Settings.ISettings>;
}

export const createModel = (options: ICreateModelOpts) => {
  const createEvents = (): ITabEvents => {
    const setEnabled = createEvent<boolean | null>();
    return {
      init: createEvent<void>(),
      set: createEvent<ITabSetEventArgs>(),
      setEnabled,
      enable: setEnabled.prepend(() => true),
      disable: setEnabled.prepend(() => false),
      toggle: setEnabled.prepend(() => null),
    };
  };

  const createEffects = (): ITabEffects => ({
    init: createEffect<void, Tab.ITab>(),
  });

  const createDefaultTabSettings = (
    host: string,
    enabled = false,
    rules: Tab.ITabSettingsCssRule[] = []
  ) => ({ host, enabled, rules });

  const getCurrentTabSettings = (
    host: string,
    tabs: Tab.ITabSettings[]
  ): [tabSettings: Tab.ITabSettings, index: number] => {
    const index = tabs.findIndex((tab) => tab.host === host);
    const tab: Tab.ITabSettings =
      index > -1 ? tabs[index] : createDefaultTabSettings(host);

    return [tab, index];
  };

  const createStores = (
    events: ITabEvents,
    effects: ITabEffects
  ): ITabStores => {
    const tab = createStore<Tab.ITab | null>(null);
    const tabError = restore<Error>(effects.init.failData, null);
    const host = createStore<string>("");
    const rules = createStore<Tab.ITabSettingsCssRule[]>([]);
    const enabled = createStore<boolean>(false);

    const settings = combine<Tab.ITabSettings>({ host, enabled, rules });

    return { host, enabled, rules, tab, tabError, settings };
  };

  const gate = createGate<void>();
  const events = createEvents();
  const effects = createEffects();
  const stores = createStores(events, effects);

  effects.init.use(TabApi.getCurrentTab);

  sample({ clock: gate.open, target: events.init });
  sample({ clock: events.init, target: effects.init });

  stores.tab.on(effects.init.doneData, (_, tab) => tab);
  stores.host.on(stores.tab, (state, tab) =>
    tab && tab.url ? tab.url.host : state
  );
  stores.rules.on(stores.host, (state, host) => {
    const { tabs } = options.settings.getState();
    const [tabSettings] = getCurrentTabSettings(host, tabs);

    return tabSettings.rules;
  });
  stores.enabled
    .on(stores.host, (enabled, host) => {
      const { tabs } = options.settings.getState();
      const [tabSettings] = getCurrentTabSettings(host, tabs);

      return tabSettings.enabled ?? enabled;
    })
    .on(options.settings, (enabled, { tabs }) => {
      const host = stores.host.getState();
      const [tabSettings] = getCurrentTabSettings(host, tabs);

      return tabSettings.enabled ?? enabled;
    });

  options.settings.on(events.setEnabled, ({ tabs, ...state }, enabled) => {
    const [tab, index] = getCurrentTabSettings(stores.host.getState(), tabs);

    if (enabled === null) {
      tab.enabled = !tab.enabled;
    } else {
      tab.enabled = enabled;
    }

    if (index > -1) {
      tabs.splice(index, 1, tab);
    } else {
      tabs.push(tab);
    }

    return { ...state, tabs };
  });

  return {
    gate,
    events,
    effects,
    stores,
    useGate: () => useGate(gate),
    useEvents: () => ({
      init: useEvent(events.init),
      set: useEvent(events.set),
      setEnabled: useEvent(events.setEnabled),
      enable: useEvent(events.enable),
      disable: useEvent(events.disable),
      toggle: useEvent(events.toggle),
    }),
    useStores: () => ({
      host: useStore(stores.host),
      enabled: useStore(stores.enabled),
      rules: useStore(stores.rules),
      tab: useStore(stores.tab),
      tabError: useStore(stores.tabError),
      settings: useStore(stores.settings),
    }),
  };
};
