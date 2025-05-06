// Harvest API Configuration
const accessToken = import.meta.env.VITE_HARVEST_ACCESS_TOKEN;
const accountId = import.meta.env.VITE_HARVEST_ACCOUNT_ID;

// Debug logging
console.log('Harvest Config - Raw Environment Variables:', {
  accessToken: accessToken,
  accountId: accountId,
  envKeys: Object.keys(import.meta.env),
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD
});

export const HARVEST_CONFIG = {
  accessToken: accessToken || '',
  accountId: accountId || '',
}; 