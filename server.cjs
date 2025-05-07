const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// Debug: Print env variables
console.log('Token:', process.env.VITE_HARVEST_ACCESS_TOKEN);
console.log('Account ID:', process.env.VITE_HARVEST_ACCOUNT_ID);

const app = express();
app.use(cors());

// Proxy endpoint for Harvest projects
app.get('/api/harvest/projects', async (req, res) => {
  try {
    const response = await axios.get('https://api.harvestapp.com/v2/projects', {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_HARVEST_ACCESS_TOKEN}`,
        'Harvest-Account-Id': process.env.VITE_HARVEST_ACCOUNT_ID,
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Unknown error' });
  }
});

// Proxy endpoint for Harvest users
app.get('/api/harvest/users', async (req, res) => {
  try {
    const response = await axios.get('https://api.harvestapp.com/v2/users', {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_HARVEST_ACCESS_TOKEN}`,
        'Harvest-Account-Id': process.env.VITE_HARVEST_ACCOUNT_ID,
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Unknown error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
}); 