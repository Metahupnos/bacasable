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

// Route proxy pour Finviz screener (avec pagination)
app.get('/api/finviz/screener', async (req, res) => {
  try {
    const { filters, sort, limit } = req.query;
    const maxTickers = parseInt(limit) || 50; // Limite par défaut: 50
    const now = Date.now();

    // Vérifier le cache
    const cacheKey = `finviz_${filters}_${sort}_${maxTickers}`;
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < 30000) { // Cache 30 secondes
      console.log(`🔄 Cache hit Finviz (${cached.data.tickers.length} tickers)`);
      return res.json(cached.data);
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Referer': 'https://finviz.com/'
    };

    const foundTickers = new Set();
    const tickersPerPage = 20;
    const pagesNeeded = Math.ceil(maxTickers / tickersPerPage);

    // Boucle sur les pages Finviz (r=1, r=21, r=41, ...)
    for (let page = 0; page < pagesNeeded && foundTickers.size < maxTickers; page++) {
      const startRow = page * tickersPerPage + 1; // r=1, r=21, r=41...
      const finvizUrl = `https://finviz.com/screener.ashx?v=141&f=${filters || 'sec_healthcare'}&o=${sort || '-perf1w'}&r=${startRow}`;

      console.log(`🔍 Scraping Finviz page ${page + 1}: r=${startRow}`);

      try {
        const response = await axios.get(finvizUrl, { headers, timeout: 15000 });
        const html = response.data;

        // Extraire les tickers de cette page
        const patterns = [
          /quote\.ashx\?t=([A-Z]{1,5})&/g,
          /href="quote\.ashx\?t=([A-Z]{1,5})"/g
        ];

        let tickersFoundOnPage = 0;
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(html)) !== null) {
            if (!foundTickers.has(match[1])) {
              foundTickers.add(match[1]);
              tickersFoundOnPage++;
            }
          }
        }

        console.log(`   → ${tickersFoundOnPage} nouveaux tickers (total: ${foundTickers.size})`);

        // Si aucun nouveau ticker trouvé, on a atteint la fin
        if (tickersFoundOnPage === 0) {
          console.log(`   → Fin des résultats Finviz`);
          break;
        }

        // Pause entre les requêtes pour éviter le rate limiting
        if (page < pagesNeeded - 1 && foundTickers.size < maxTickers) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (pageError) {
        console.error(`   ❌ Erreur page ${page + 1}:`, pageError.message);
        break;
      }
    }

    const tickers = [...foundTickers].slice(0, maxTickers);
    const result = { tickers, timestamp: new Date().toISOString() };

    // Mettre en cache
    cache.set(cacheKey, { data: result, timestamp: now });

    console.log(`✅ Finviz: ${tickers.length} tickers trouvés (${pagesNeeded} pages scannées)`);
    res.json(result);
  } catch (error) {
    console.error(`❌ Erreur Finviz:`, error.message);
    res.status(500).json({ error: 'Erreur Finviz', message: error.message });
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