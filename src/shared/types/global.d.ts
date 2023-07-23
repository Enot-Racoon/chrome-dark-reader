export {}

declare global {
  type ValOrArr<T> = T | T[]

  export type Index = string | number | symbol
}
