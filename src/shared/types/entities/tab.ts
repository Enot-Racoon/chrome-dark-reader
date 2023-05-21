import { ParsedQs } from "qs";

export interface ChromeTab {
  status?: string | undefined;
  index: number;
  openerTabId?: number | undefined;
  title?: string | undefined;
  url?: string | undefined;
  pendingUrl?: string | undefined;
  pinned: boolean;
  highlighted: boolean;
  windowId: number;
  active: boolean;
  favIconUrl?: string | undefined;
  id?: number | undefined;
  incognito: boolean;
  selected: boolean;
  audible?: boolean | undefined;
  discarded: boolean;
  autoDiscardable: boolean;
  mutedInfo?:
    | {
        muted: boolean;
        reason?: string | undefined;
        extensionId?: string | undefined;
      }
    | undefined;
  width?: number | undefined;
  height?: number | undefined;
  sessionId?: string | undefined;
  groupId: number;
}

export interface ITabSettingsCssProperty {
  name: string;
  value: string;
}

export interface ITabSettingsCssRule {
  selector: string;
  properties: ITabSettingsCssProperty[];
}

export interface ITabSettings {
  readonly host: string;
  enabled: boolean;
  rules: ITabSettingsCssRule[];
}

export interface ITabURL {
  readonly hash: string;
  readonly host: string;
  readonly hostname: string;
  readonly href: string;
  readonly origin: string;
  readonly password: string;
  readonly pathname: string;
  readonly port: string;
  readonly protocol: string;
  readonly search: string;
  readonly searchParams: ParsedQs;
  readonly username: string;
  toString(): string;
}

export interface ITab extends Omit<ChromeTab, "url"> {
  url: ITabURL;
}
