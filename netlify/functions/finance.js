// Netlify Function pour proxy Yahoo Finance
const axios = require('axios');

exports.handler = async (event, context) => {
  // Gérer CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Extraire le symbole de l'URL
  const symbol = event.path.split('/').pop();

  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Symbol parameter required' })
    };
  }

  try {
    console.log(`📊 Récupération des données pour ${symbol}...`);

    // Appel direct à Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`✅ Données obtenues pour ${symbol}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error(`❌ Erreur pour ${symbol}:`, error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Impossible de récupérer les données',
        symbol: symbol,
        message: error.message
      })
    };
  }
};