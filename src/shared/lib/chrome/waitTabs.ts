export const waitTabs = (cb: () => void, ms = 100) => {
  const wait = (cb: () => void, ms: number) => {
    if (chrome && chrome.tabs) {
      cb();
    } else {
      setTimeout(() => wait(cb, ms), ms);
    }
  };
  wait(cb, ms);
};
