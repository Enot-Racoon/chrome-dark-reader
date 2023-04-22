import { createEvent } from "effector";

export const createEvents = <T>() => {
  const getSettled = createEvent();

  const create = createEvent<T>();
  const get = createEvent<string>();
  const getList = createEvent();
  const update = createEvent<Partial<T>>();
  const replace = createEvent<T>();
  const remove = createEvent<string>();

  const select = createEvent<T>();
  const unselect = createEvent();

  return {
    getSettled,

    create,
    get,
    getList,
    update,
    replace,
    remove,

    select,
    unselect,
  };
};
