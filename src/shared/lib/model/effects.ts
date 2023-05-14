import { createEffect } from "effector";

export const createEffects = <T>() => {
  const create = createEffect<T, T | null>();
  const get = createEffect<string, T | null>();
  const getList = createEffect<void, T[]>();
  const update = createEffect<Partial<T>, T | null>();
  const replace = createEffect<T, T | null>();
  const remove = createEffect<string, T | null>();

  return {
    create,
    get,
    getList,
    update,
    replace,
    remove,
  };
};
