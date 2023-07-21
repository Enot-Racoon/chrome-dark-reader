export * as default from '.'
export * from './delay'

export const log = (name: string) => console.log.bind(console, name)

export const error = (error: unknown) => console.error(error)
