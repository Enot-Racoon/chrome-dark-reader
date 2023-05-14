/* eslint-disable @typescript-eslint/no-explicit-any */
import { Event, Store } from "effector";
import { Gate, useEvent, useGate, useStore } from "effector-react";

export const createUseGate =
  <Props>(gate: Gate<Props>) =>
  (props?: Props) =>
    useGate<Props>(gate, props);

type ICreateUseOpts = { forceScope?: boolean };

type ICreateUseStoresReturnType<T> = {
  [K in keyof T]: T[K] extends Store<infer U> ? U : never;
};

export const createUseStores =
  <T extends Record<string, Store<any>>>(stores: T) =>
  (opts?: ICreateUseOpts): ICreateUseStoresReturnType<T> =>
    Object.fromEntries(
      Object.entries(stores).map(([key, store]) => [key, useStore(store, opts)])
    ) as ICreateUseStoresReturnType<T>;

type ICreateUseEventsReturnType<T> = {
  [K in keyof T]: T[K] extends Event<infer U>
    ? U extends void
      ? () => void
      : (payload: U) => void
    : () => void;
};

export const createUseEvents =
  <T extends Record<string, Event<any>>>(events: T) =>
  (opts?: ICreateUseOpts): ICreateUseEventsReturnType<T> =>
    Object.fromEntries(
      Object.entries(events).map(([key, event]) => [key, useEvent(event, opts)])
    ) as ICreateUseEventsReturnType<T>;

export const createUse =
  <
    Ev extends Record<string, Event<any>>,
    St extends Record<string, Store<any>>
  >(
    events: Ev,
    stores: St,
    opts?: ICreateUseOpts
  ) =>
  (): {
    events: ICreateUseEventsReturnType<Ev>;
    stores: ICreateUseStoresReturnType<St>;
  } => ({
    events: Object.fromEntries(
      Object.entries(events).map(([key, event]) => [key, useEvent(event, opts)])
    ) as ICreateUseEventsReturnType<Ev>,
    stores: Object.fromEntries(
      Object.entries(stores).map(([key, store]) => [key, useStore(store, opts)])
    ) as ICreateUseStoresReturnType<St>,
  });
