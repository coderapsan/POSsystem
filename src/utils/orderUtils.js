export const formatPortionLabel = (portion) =>
  portion ? portion.charAt(0).toUpperCase() + portion.slice(1) : "";

export const getValidPortions = (item) =>
  Object.entries(item?.price || {})
    .map(([portion, value]) => [portion, Number(value)])
    .filter(([, value]) => Number.isFinite(value) && value > 0);

export const resolvePrice = (menuItem, portionKey = "") => {
  const entries = Object.entries(menuItem?.price || {})
    .map(([key, value]) => [key, Number(value)])
    .filter(([, value]) => Number.isFinite(value) && value > 0);

  if (portionKey) {
    const matched = entries.find(([key]) => key === portionKey);
    if (matched) return matched[1];
  }

  return entries.length > 0 ? entries[0][1] : 0;
};
