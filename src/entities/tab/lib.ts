import {
  combine,
  createEffect,
  createEvent,
  createStore,
  forward,
  restore,
  Store,
} from "effector";
import * as ER from "effector-react";

import { delay } from "shared/lib/common";
import {
  createUse,
  createUseEvents,
  createUseGate,
  createUseStores,
} from "shared/lib/model/create-use";
import type { Settings, Tab } from "shared/types/entities";

import * as TabApi from "./api";

export type ITabSetEventArgs = Partial<Omit<Tab.ITabSettings, "host">>;

export interface ICreateModelOpts {
  settings: Store<Settings.ISettings>;
}

const createEvents = () => {
  const setEnabled = createEvent<boolean | null>();
  return {
    initialize: createEvent<void>(),
    load: createEvent<void>(),
    set: createEvent<ITabSetEventArgs>(),
    setEnabled,
    enable: setEnabled.prepend(() => true),
    disable: setEnabled.prepend(() => false),
    toggle: setEnabled.prepend(() => null),
  };
};

const createEffects = () => ({
  load: createEffect<void, Tab.ITab>(),
  initialize: createEffect<void, void>(),
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
  events: ReturnType<typeof createEvents>,
  effects: ReturnType<typeof createEffects>
) => {
  const initialized = createStore<boolean>(false);
  const initializeError = restore<Error>(effects.initialize.failData, null);
  const tab = createStore<Tab.ITab | null>(null);
  const host = createStore<string>("");
  const rules = createStore<Tab.ITabSettingsCssRule[]>([]);
  const enabled = createStore<boolean>(false);

  const settings = combine<Tab.ITabSettings>({ host, enabled, rules });

  return {
    initialized,
    initializeError,
    host,
    enabled,
    rules,
    tab,
    settings,
  };
};

export const createModel = (options: ICreateModelOpts) => {
  const gate = ER.createGate<void>();
  const events = createEvents();
  const effects = createEffects();
  const stores = createStores(events, effects);

  //

  effects.initialize.use(delay.bind(null, 10));
  effects.load.use(TabApi.getCurrentTab);

  forward({ from: gate.open, to: events.initialize });
  forward({ from: events.initialize, to: effects.initialize });
  stores.initialized.on(effects.initialize.done, () => true);
  forward({ from: effects.initialize.done, to: events.load });

  forward({ from: events.load, to: effects.load });
  //

  stores.tab.on(effects.load.doneData, (_, tab) => tab);
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

  //

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
