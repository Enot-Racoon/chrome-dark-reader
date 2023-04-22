import { createEffect } from "effector";

export const createEffects = <T>() => {
  const createFx = createEffect<T, T | null>();
  const getFx = createEffect<string, T | null>();
  const getListFx = createEffect<void, T[]>();
  const updateFx = createEffect<Partial<T>, T | null>();
  const replaceFx = createEffect<T, T | null>();
  const removeFx = createEffect<string, T | null>();

  return {
    createFx,
    getFx,
    getListFx,
    updateFx,
    replaceFx,
    removeFx,
  };
};
