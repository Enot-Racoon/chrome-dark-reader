export {}

declare global {
  type ValOrArr<T> = T | T[]

  type Index = string | number | symbol

  type Unknown = NonNullable<unknown>

  type NullableValue<T> = T | null

  type Nullable<T> = {
    [P in keyof T]: T[P] | null
  }

  type PartialNullable<T> = {
    [P in keyof T]?: T[P] | null
  }
}
