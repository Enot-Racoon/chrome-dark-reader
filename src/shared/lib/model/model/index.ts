import { createEvent, createStore, Event, Store } from "effector";

export interface ITabSettings {
  readonly host: string;
  readonly enabled: boolean;
}

export interface ISettings {
  readonly enabled: boolean;
  readonly tabs: ITabSettings[];
}

export interface ISettingsEvents {
  readonly set: Event<ISettings>;
}

export interface ISettingsStores {
  readonly value: Store<ISettings>;
}

export interface ISettingsModel {
  readonly events: ISettingsEvents;
  readonly stores: ISettingsStores;
}

export interface ITabSettingsEvents {
  toggle: Event<void>;
}

export interface ITabSettingsStores {
  host: Store<string>;
  enabled: Store<boolean>;
}

export interface ITabSettingsModel {
  readonly events: ITabSettingsEvents;
  readonly stores: ITabSettingsStores;
}

const createSettingsModel = (): ISettingsModel => {
  const createEvents = (): ISettingsEvents => ({
    set: createEvent<ISettings>(),
  });

  const createDefaultSetting = (): ISettings => ({
    enabled: false,
    tabs: [],
  });

  const createStores = (): ISettingsStores => ({
    value: createStore<ISettings>(createDefaultSetting()),
  });

  const events = createEvents();
  const stores = createStores();

  stores.value.on(events.set, (_, payload) => payload);

  return { events, stores };
};

const createTabSettingModel = (
  settingsModel: ISettingsModel
): ITabSettingsModel => {
  const createEvents = (): ITabSettingsEvents => ({
    toggle: createEvent(),
  });

  const getCurrentHost = () => "localhost";

  const createDefaultTabSettings = (
    host: string,
    enabled = false
  ): ITabSettings => ({ host, enabled });

  const getCurrentOrDefaultTab = (
    tabs: ITabSettings[]
  ): [tab: ITabSettings, index: number] => {
    const currentHost = getCurrentHost();
    const currentTabIndex = tabs.findIndex(({ host }) => host === currentHost);
    const currentTab: ITabSettings =
      currentTabIndex > -1
        ? tabs[currentTabIndex]
        : createDefaultTabSettings(currentHost);
    return [currentTab, currentTabIndex];
  };

  const createStores = (): ITabSettingsStores => {
    const host = createStore<string>(getCurrentHost());
    // const enabled = createStore<boolean>(false);

    return {
      host,
      enabled: settingsModel.stores.value.map(({ tabs }) => {
        const [tab] = getCurrentOrDefaultTab(tabs);
        return tab.enabled;
      }),
    };
  };

  const events = createEvents();
  const stores = createStores();

  settingsModel.stores.value.on(events.toggle, (state) => {
    const [{ host, enabled }, index] = getCurrentOrDefaultTab(state.tabs);
    const newTab: ITabSettings = { host, enabled: !enabled };
    const { tabs: newTabs } = state;

    if (index > -1) {
      newTabs.splice(index, 1, newTab);
    } else {
      newTabs.push(newTab);
    }

    return { enabled: state.enabled, tabs: newTabs };
  });

  return { events, stores };
};

const settingsModel = createSettingsModel();

const tabSettingsModel = createTabSettingModel(settingsModel);

//

const log = (...args: unknown[]) => console.log.bind(console, ...args);
console.clear();
log(" ~--===+ Start +====---~ ")();

settingsModel.stores.value.watch(log("settingsModel.stores.value.watch"));
settingsModel.events.set.watch(log("settingsModel.events.set.watch"));
tabSettingsModel.stores.host.watch(log("tabSettingsModel.stores.host.watch"));
tabSettingsModel.stores.enabled.watch(
  log("tabSettingsModel.stores.enabled.watch")
);
tabSettingsModel.events.toggle.watch(
  log("\ntabSettingsModel.events.toggle.watch")
);

//
// tabSettingsModel.stores.enabled.setState(() => )
//

settingsModel.events.set({
  enabled: true,
  tabs: [
    {
      host: "localhost",
      enabled: true,
    },
  ],
});

log(" ~--===+ Toggle +====---~ ")();

tabSettingsModel.events.toggle();
log("tabSettingsModel.stores.enabled.getState")(
  tabSettingsModel.stores.enabled.getState()
);
tabSettingsModel.events.toggle();
log("tabSettingsModel.stores.enabled.getState")(
  tabSettingsModel.stores.enabled.getState()
);
tabSettingsModel.events.toggle();
log("tabSettingsModel.stores.enabled.getState")(
  tabSettingsModel.stores.enabled.getState()
);

// settingsModel.events.set({
//   enabled: true,
//   tabs: [
//     {
//       host: "localhost",
//       enabled: false,
//     },
//     {
//       host: "127.0.0.1",
//       enabled: true,
//     },
//   ],
// });
