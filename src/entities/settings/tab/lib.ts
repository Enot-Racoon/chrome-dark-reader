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

export type ITabSetEventArgs = Partial<Omit<Tab.ITabSettings, "host">>;

export interface ICreateModelOpts {
  settings: Store<Settings.ISettings>;
  activeTab: Store<Tab.ITab | null>;
}

const createEvents = () => {
  const setEnabled = createEvent<boolean | null>();
  return {
    initialize: createEvent<void>(),
    setEnabled,
    enable: setEnabled.prepend(() => true),
    disable: setEnabled.prepend(() => false),
    toggle: setEnabled.prepend(() => null),
  };
};

const createEffects = () => ({
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
  const host = createStore<string>(self.location.host);
  const rules = createStore<Tab.ITabSettingsCssRule[]>([]);
  const enabled = createStore<boolean>(false);

  const settings = combine<Tab.ITabSettings>({ host, enabled, rules });

  return {
    initialized,
    initializeError,
    host,
    enabled,
    rules,
    settings,
  };
};

export const createModel = (options: ICreateModelOpts) => {
  const gate = ER.createGate<void>();
  const baseEvents = createEvents();
  const effects = createEffects();
  const stores = createStores(baseEvents, effects);
  const events = {
    ...baseEvents,
    initialized: effects.initialize.doneData,
    initializeError: effects.initialize.failData,
  };

  effects.initialize.use(delay.bind(null, 10));

  forward({ from: gate.open, to: events.initialize });
  forward({ from: events.initialize, to: effects.initialize });
  stores.initialized.on(effects.initialize.done, () => true);

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
    .on(options.settings.updates, (enabled, { tabs }) => {
      const activeTabState = options.activeTab.getState();

      const host = activeTabState
        ? activeTabState.url.host
        : stores.host.getState();
      const [tabSettings] = getCurrentTabSettings(host, tabs);

      return tabSettings.enabled ?? enabled;
    });

  options.settings.on(events.setEnabled, ({ tabs, ...state }, enabled) => {
    const activeTabState = options.activeTab.getState();

    if (!activeTabState) {
      return { tabs, ...state };
    }

    const [tab, index] = getCurrentTabSettings(activeTabState.url.host, tabs);

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
    useGate: createUseGate(gate),
    useEvents: createUseEvents(events),
    useStores: createUseStores(stores),
    use: createUse(events, stores),
  };
};
