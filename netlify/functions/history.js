// Netlify Function pour récupérer l'historique des cours
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

  // Extraire symbol et period de l'URL
  const pathSegments = event.path.split('/');
  const symbol = pathSegments[pathSegments.length - 2];
  const period = pathSegments[pathSegments.length - 1];

  if (!symbol || !period) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Symbol and period parameters required' })
    };
  }

  try {
    console.log(`📈 Récupération historique ${symbol} pour ${period}...`);

    // Mapping des périodes pour Yahoo Finance
    const ranges = {
      '1d': '1d',
      '5d': '5d',
      '10d': '1mo',
      '20d': '1mo',
      '1m': '1mo',
      '3m': '3mo',
      '6m': '6mo',
      '1y': '1y',
      '2y': '5y',
      '5y': '5y',
      '10y': '10y'
    };

    const intervals = {
      '1d': '5m',
      '5d': '15m',
      '10d': '15m',
      '20d': '15m',
      '1m': '1d',
      '3m': '1d',
      '6m': '1wk',
      '1y': '1wk',
      '2y': '1wk',
      '5y': '1wk',
      '10y': '1wk'
    };

    const range = ranges[period] || '1mo';
    const interval = intervals[period] || '1d';

    // Appel à Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`✅ Historique obtenu pour ${symbol} (${period})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error(`❌ Erreur historique ${symbol}:`, error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Impossible de récupérer l\'historique',
        symbol: symbol,
        period: period,
        message: error.message
      })
    };
  }
};