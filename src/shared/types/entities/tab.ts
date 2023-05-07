import { ParsedQs } from "qs";

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

export interface ITab extends Omit<chrome.tabs.Tab, "url"> {
  url: ITabURL;
}
