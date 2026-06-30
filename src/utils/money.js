// Money is stored as integer "smallest units" where 1,000,000 = 1.00 token
const UNIT = 1;

export const toDisplay = (units) => (units / UNIT).toFixed(2);

export const toUnits = (display) => Math.round(parseFloat(display) * UNIT);

export const formatMultiplier = (m) => `${m.toFixed(2)}x`;




