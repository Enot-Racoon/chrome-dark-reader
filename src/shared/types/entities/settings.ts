import { ITabSettings } from "./tab";

export interface ISettings {
  enabled: boolean;
  readonly tabs: ITabSettings[];
}
