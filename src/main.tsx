import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initHarvestClient } from './integrations/harvest/client'
import { HARVEST_CONFIG } from './config/harvest'

// Initialize Harvest client if credentials are available
if (HARVEST_CONFIG.accessToken && HARVEST_CONFIG.accountId) {
  try {
    initHarvestClient(HARVEST_CONFIG.accessToken, HARVEST_CONFIG.accountId);
    console.log('Harvest client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Harvest client:', error);
  }
} else {
  console.warn('Harvest credentials not found. Harvest integration will be disabled.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
