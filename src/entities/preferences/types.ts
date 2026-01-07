export interface IPreferences {
  readonly hosts: Record<string, IHostSettings>
}

export interface IHostSettings {
  readonly host: string
  enabled: boolean
  styles: string
}
