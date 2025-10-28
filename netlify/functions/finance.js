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

  // Parser le path: /api/finance/SYMBOL ou /api/finance/SYMBOL/PERIOD
  const pathParts = event.path.split('/').filter(p => p);
  // Retirer 'api' et 'finance' pour obtenir [SYMBOL] ou [SYMBOL, PERIOD]
  const relevantParts = pathParts.slice(2); // Ignorer 'api' et 'finance'
  const symbol = relevantParts[0];
  const period = relevantParts.length > 1 ? relevantParts[1] : null;

  if (!symbol) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Symbol parameter required' })
    };
  }

  try {
    let url;

    // Si c'est une requête d'historique
    if (period && period !== symbol) {
      // Mapping des périodes
      const periodMap = {
        '1d': { range: '1d', interval: '5m' },
        '5d': { range: '5d', interval: '15m' },
        '10d': { range: '1mo', interval: '15m' },
        '20d': { range: '1mo', interval: '15m' },
        '1m': { range: '1mo', interval: '1d' },
        '2m': { range: '2mo', interval: '1d' },
        '3m': { range: '3mo', interval: '1d' },
        '6m': { range: '6mo', interval: '1d' },
        '1y': { range: '1y', interval: '1d' },
        '2y': { range: '2y', interval: '1d' },
        '5y': { range: '5y', interval: '1d' },
        '10y': { range: '10y', interval: '1d' },
        'max': { range: '10y', interval: '1d' }
      };

      const config = periodMap[period] || { range: '1mo', interval: '1d' };
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${config.interval}&range=${config.range}`;
      console.log(`📈 Récupération historique ${period} pour ${symbol}...`);
    } else {
      // Quote actuel
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
      console.log(`📊 Récupération des données pour ${symbol}...`);
    }

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log(`✅ Données obtenues pour ${symbol}${period ? ` (${period})` : ''}`);

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