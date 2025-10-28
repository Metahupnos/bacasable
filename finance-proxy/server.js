// server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4001;

// Cache simple pour éviter les requêtes répétées
const cache = new Map();
const CACHE_DURATION = 15000; // 15 secondes

// Rate limiting simple
const lastRequests = new Map();
const RATE_LIMIT_WINDOW = 2000; // 2 secondes entre requêtes par symbole

// Autoriser toutes les origines (ou uniquement localhost:3000 si tu préfères)
app.use(cors());

// Route proxy pour Yahoo Finance (données actuelles)
app.get('/api/finance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const now = Date.now();

    // Vérifier le cache
    const cacheKey = `finance_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`🔄 Cache hit pour ${symbol}`);
      return res.json(cached.data);
    }

    // Rate limiting
    const lastRequest = lastRequests.get(symbol);
    if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW) {
      console.log(`⏳ Rate limit pour ${symbol}, attente...`);
      return res.status(429).json({
        error: 'Trop de requêtes, veuillez patienter',
        symbol: symbol,
        retryAfter: RATE_LIMIT_WINDOW - (now - lastRequest)
      });
    }

    console.log(`📊 Récupération des données pour ${symbol}...`);
    lastRequests.set(symbol, now);

    // Appel direct à Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Mettre en cache
    cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });

    console.log(`✅ Données obtenues pour ${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(`❌ Erreur proxy Yahoo pour ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Impossible de récupérer les données',
      symbol: req.params.symbol,
      message: error.message
    });
  }
});

// Route proxy pour données historiques Yahoo Finance
app.get('/api/history/:symbol/:period', async (req, res) => {
  try {
    const { symbol, period } = req.params;
    const now = Date.now();

    // Vérifier le cache pour l'historique
    const cacheKey = `history_${symbol}_${period}`;
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION * 4) { // Cache plus long pour historique
      console.log(`🔄 Cache hit historique ${period} pour ${symbol}`);
      return res.json(cached.data);
    }

    // Rate limiting pour historique
    const historyKey = `${symbol}_${period}`;
    const lastRequest = lastRequests.get(historyKey);
    if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW) {
      console.log(`⏳ Rate limit historique pour ${symbol}_${period}, attente...`);
      return res.status(429).json({
        error: 'Trop de requêtes historiques, veuillez patienter',
        symbol: symbol,
        period: period,
        retryAfter: RATE_LIMIT_WINDOW - (now - lastRequest)
      });
    }

    console.log(`📈 Récupération historique ${period} pour ${symbol}...`);
    lastRequests.set(historyKey, now);

    // Mapping des périodes vers les paramètres Yahoo Finance
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
      'max': { range: 'max', interval: '1d' } // Utiliser max pour avoir toutes les données disponibles
    };

    const config = periodMap[period] || { range: '1mo', interval: '1d' };

    // Appel à Yahoo Finance pour l'historique
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${config.interval}&range=${config.range}`;
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Mettre en cache l'historique
    cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });

    console.log(`✅ Historique ${period} obtenu pour ${symbol}`);
    res.json(response.data);
  } catch (error) {
    console.error(`❌ Erreur historique proxy pour ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Impossible de récupérer les données historiques',
      symbol: req.params.symbol,
      period: req.params.period,
      message: error.message
    });
  }
});

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy Yahoo Finance opérationnel' });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy Yahoo Finance démarré sur http://localhost:${PORT}`);
  console.log(`📡 Route API: http://localhost:${PORT}/api/finance/{SYMBOL}`);
});