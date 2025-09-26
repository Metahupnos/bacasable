// server.js
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Autoriser toutes les origines (ou uniquement localhost:3000 si tu préfères)
app.use(cors());

// Route proxy pour Yahoo Finance
app.get('/api/finance/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

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
    res.json(response.data); // On renvoie les données telles quelles
  } catch (error) {
    console.error(`❌ Erreur proxy Yahoo pour ${req.params.symbol}:`, error.message);
    res.status(500).json({
      error: 'Impossible de récupérer les données',
      symbol: req.params.symbol,
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