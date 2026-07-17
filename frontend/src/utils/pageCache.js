const cache = {};

export const setPageState = (key, state) => {
  if (!key) return;
  cache[key] = state;
};

export const getPageState = (key) => {
  if (!key) return null;
  return cache[key];
};

export const clearPageState = (key) => {
  if (!key) return;
  delete cache[key];
};

export const clearAllPageStates = () => {
  for (const k in cache) {
    delete cache[k];
  }
};
