import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SalesHistory.css';

function SalesHistory() {
  const navigate = useNavigate();
  const [eurUsdRate, setEurUsdRate] = useState(1.04); // Taux par défaut
  const [historicalRates, setHistoricalRates] = useState({}); // Taux historiques par date
  const [currentPrices, setCurrentPrices] = useState({}); // Cours actuels par ticker
  const [portfolioValueData, setPortfolioValueData] = useState([]);
  const [loadingPortfolioChart, setLoadingPortfolioChart] = useState(true);

  // Mapping des noms vers les tickers Yahoo Finance
  const tickerMap = {
    'Coreweave Inc.': { ticker: 'CRWV', name: 'Coreweave Inc.' },
    'Galaxy Digital': { ticker: 'GLXY', name: 'Galaxy Digital' },
    'Redwire Corp.': { ticker: 'RDW', name: 'Redwire Corp.' },
    'Sandisk Corp.': { ticker: 'SNDK', name: 'Sandisk Corp.' },
    'Western Digital': { ticker: 'WDC', name: 'Western Digital' },
    'Applied Materials': { ticker: 'AMAT', name: 'Applied Materials' },
    'WisdomTree Silver': { ticker: 'PHAG.L', name: 'WisdomTree Silver' },
    'Hycroft Mining': { ticker: 'HYMC', name: 'Hycroft Mining' },
    'VanEck Gold Miners': { ticker: 'GDX', name: 'VanEck Gold Miners' },
    'SK Hynix GDR': { ticker: 'HXSCF', name: 'SK Hynix GDR' },
    'Eli Lilly': { ticker: 'LLY', name: 'Eli Lilly' },
    'Samsung Electronics GDR': { ticker: 'SMSN.IL', name: 'Samsung Electronics' },
    'Rocket Lab': { ticker: 'RKLB', name: 'Rocket Lab' },
    'Broadcom': { ticker: 'AVGO', name: 'Broadcom' },
    'Regeneron': { ticker: 'REGN', name: 'Regeneron' },
    'IDEXX Labs': { ticker: 'IDXX', name: 'IDEXX Labs' },
    'Alphabet': { ticker: 'GOOGL', name: 'Alphabet' },
    'iShares S&P 500': { ticker: 'CSPX.AS', name: 'iShares S&P 500' },
    'iShares MSCI World': { ticker: 'IWDA.AS', name: 'iShares MSCI World' },
    'iShares MSCI EM': { ticker: 'IEMA.AS', name: 'iShares MSCI EM' },
    'Invesco MSCI World': { ticker: 'MWRD.PA', name: 'Invesco MSCI World' },
    'Invesco Nasdaq-100': { ticker: 'EQQQ.PA', name: 'Invesco Nasdaq-100' },
    'Invesco Nasdaq-100 nouveau': { ticker: 'EQQQ.PA', name: 'Invesco Nasdaq-100' },
    'Invesco Nasdaq-100 ancien': { ticker: 'EQQQ.PA', name: 'Invesco Nasdaq-100' },
    'Micron Technology, Inc.': { ticker: 'MU', name: 'Micron Technology, Inc.' },
    'SQM': { ticker: 'SQM', name: 'SQM' },
    'Kalray SA': { ticker: 'ALKAL.PA', name: 'Kalray SA' },
    'WisdomTree Physical Silver': { ticker: 'PHAG.AS', name: 'WisdomTree Physical Silver' },
    'Hudbay Minerals': { ticker: 'HBM', name: 'Hudbay Minerals' },
    'BNP Paribas': { ticker: 'BNP.PA', name: 'BNP Paribas' },
  };

  // Fonction pour extraire le ticker depuis la description
  const getTickerInfo = (description) => {
    if (!description) return null;
    // Extraire le nom (avant la parenthèse)
    const nameMatch = description.match(/^([^(]+)/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      return tickerMap[name] || null;
    }
    return null;
  };

  // Convertir timestamp en clé de date YYYY-MM-DD
  const timestampToDateKey = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Convertir DD/MM/YYYY en clé YYYY-MM-DD
  const dateToKey = (dateStr) => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Récupérer le taux EUR/USD actuel et historique depuis Yahoo Finance
  useEffect(() => {
    const fetchEurUsdRates = async () => {
      try {
        // Taux historiques (1 an pour couvrir août 2025 - maintenant)
        const histResponse = await fetch('http://localhost:4001/api/history/EURUSD=X/1y');
        const histData = await histResponse.json();

        if (histData.chart?.result?.[0]) {
          const timestamps = histData.chart.result[0].timestamp || [];
          const closes = histData.chart.result[0].indicators?.quote?.[0]?.close || [];
          const currentRate = histData.chart.result[0].meta?.regularMarketPrice;

          if (currentRate) {
            setEurUsdRate(currentRate);
          }

          const rates = {};
          timestamps.forEach((ts, i) => {
            if (closes[i]) {
              const dateKey = timestampToDateKey(ts);
              rates[dateKey] = closes[i];
            }
          });
          setHistoricalRates(rates);
          console.log('Taux historiques chargés:', Object.keys(rates).length, 'jours');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des taux EUR/USD:', error);
      }
    };
    fetchEurUsdRates();
  }, []);

  // Récupérer les cours actuels depuis Yahoo Finance
  useEffect(() => {
    const fetchCurrentPrices = async () => {
      const tickers = Object.values(tickerMap).map(t => t.ticker);
      const prices = {};
      const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

      for (const ticker of tickers) {
        try {
          const response = await fetch(`${apiBase}/api/finance/${ticker}`);
          const data = await response.json();
          if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
            prices[ticker] = {
              price: data.chart.result[0].meta.regularMarketPrice,
              currency: data.chart.result[0].meta.currency
            };
          }
        } catch (error) {
          console.error(`Erreur pour ${ticker}:`, error);
        }
      }
      setCurrentPrices(prices);
    };
    fetchCurrentPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Obtenir le taux EUR/USD pour une date donnée (cherche la date la plus proche si pas trouvée)
  const getRateForDate = (dateStr) => {
    const dateKey = dateToKey(dateStr);
    if (historicalRates[dateKey]) {
      return historicalRates[dateKey];
    }
    // Chercher la date la plus proche (jour précédent)
    const [year, month, day] = dateKey.split('-').map(Number);
    for (let i = 1; i <= 7; i++) {
      const prevDate = new Date(year, month - 1, day - i);
      const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      if (historicalRates[prevKey]) {
        return historicalRates[prevKey];
      }
    }
    return eurUsdRate; // Fallback au taux actuel
  };

  // Timeline complète du portefeuille (évolution chronologique - ordre Bolero: date desc, ref desc)
  const portfolioTimeline = [
    // 18/02/2026 - Ventes SNDK, GOOGL, MU, WDC (solde complet)
    { date: '18/02/2026', type: 'sell', description: 'Alphabet (150 actions)', amountUSD: 45386.62, costBasisUSD: 43928.64, feesUSD: 209.59, details: '150 × 303.9747 USD', currency: 'USD', ref: '000053777976', bordereau: '2026 22753502' },
    { date: '18/02/2026', type: 'sell', description: 'Micron Technology, Inc. (150 actions)', amountUSD: 63068.57, costBasisUSD: 58132.53, feesUSD: 271.69, details: '150 × 422.2684 USD', currency: 'USD', ref: '000053777957', bordereau: '2026 22753339' },
    { date: '18/02/2026', type: 'sell', description: 'Western Digital (300 actions)', amountUSD: 90077.09, costBasisUSD: 60070.19, feesUSD: 426.76, details: '300 × 301.6795 USD', currency: 'USD', ref: '000053777943', bordereau: '2026 22753241' },
    { date: '18/02/2026', type: 'sell', description: 'Sandisk Corp. (150 actions)', amountUSD: 90036.57, costBasisUSD: 57572.13, feesUSD: 426.62, details: '150 × 603.0879 USD', currency: 'USD', ref: '000053777932', bordereau: '2026 22753112' },

    // 12/02/2026 - Ventes BNP, HBM (solde complet) + Vente partielle GOOGL + Remboursements
    { date: '12/02/2026', type: 'sell', description: 'BNP Paribas (520 actions)', amountEUR: 47705.47, costBasisEUR: 49259.92, feesEUR: 217.73, details: '520 × 92.16 EUR', currency: 'EUR', ref: '000053672718', bordereau: '2026 20506184' },
    { date: '12/02/2026', type: 'deposit', description: 'Remboursement', amountEUR: 107.87, ref: 'cashmovements' },
    { date: '12/02/2026', type: 'sell', description: 'Hudbay Minerals (2500 actions)', amountUSD: 63100.59, costBasisUSD: 66654.18, feesUSD: 540.84, details: '2500 × 34.94361 CAD (converti USD, taux 1.372673)', currency: 'USD', ref: '000053672674', bordereau: '2026 20505334' },
    { date: '12/02/2026', type: 'sell', description: 'Alphabet (200 actions)', amountUSD: 61758.15, costBasisUSD: 58571.47, feesUSD: 267.09, details: '200 × 310.1262 USD', currency: 'USD', ref: '000053672579', bordereau: '2026 20503635' },
    { date: '12/02/2026', type: 'deposit', description: 'Remboursement', amountEUR: 42.13, ref: 'cashmovements' },

    // 05/02/2026 - Achat BNP + Remboursement Nieuwjaarsactie
    { date: '05/02/2026', type: 'buy', description: 'BNP Paribas (520 actions)', amountEUR: -49259.92, feesEUR: 416.32, details: '520 × 93.93 EUR', currency: 'EUR', ref: '000053507175', bordereau: '2026 16815990' },
    { date: '05/02/2026', type: 'deposit', description: 'Remboursement Nieuwjaarsactie / Pro', amountEUR: 50.00, ref: 'Extrait n°22' },

    // 29/01/2026 - Ventes HYMC et SQM (solde complet)
    { date: '29/01/2026', type: 'sell', description: 'SQM (700 actions)', amountUSD: 55875.37, costBasisUSD: 57283.87, feesUSD: 246.43, details: '700 × 80.174 USD', currency: 'USD', ref: '000053334021', bordereau: '2026 12891899' },
    { date: '29/01/2026', type: 'sell', description: 'Hycroft Mining (960 actions)', amountUSD: 42683.09, costBasisUSD: 49673.28, feesUSD: 200.09, details: '960 × 44.66998 USD', currency: 'USD', ref: '000053333545', bordereau: '2026 12887187' },

    // 28/01/2026 - Achat HYMC + Ventes ALKAL (solde complet)
    { date: '28/01/2026', type: 'buy', description: 'Hycroft Mining (460 actions)', amountUSD: -23975.20, feesUSD: 133.45, details: '460 × 51.8299 USD', currency: 'USD', ref: '000053306533', bordereau: '2026 12319975' },

    // 28/01/2026 - Ventes ALKAL (solde complet)
    { date: '28/01/2026', type: 'sell', description: 'Kalray SA (4950 actions)', amountEUR: 13066.89, costBasisEUR: 20846.18, feesEUR: 76.00, details: '4950 × 2.65513 EUR', currency: 'EUR', ref: '000053280156', bordereau: '2026 11964699' },
    { date: '28/01/2026', type: 'sell', description: 'Kalray SA (10050 actions)', amountEUR: 27257.91, costBasisEUR: 42324.07, feesEUR: 140.90, details: '10050 × 2.72625 EUR', currency: 'EUR', ref: '000053279996', bordereau: '2026 11955590' },

    // 27/01/2026 - Achat HBM
    { date: '27/01/2026', type: 'buy', description: 'Hudbay Minerals (2500 actions)', amountUSD: -66654.18, feesUSD: 561.79, details: '2500 × 35.55422 CAD (converti USD, taux 1.344868)', currency: 'USD', ref: '000053275685', bordereau: '2026 11648934' },

    // 26/01/2026 - Achat HYMC
    { date: '26/01/2026', type: 'buy', description: 'Hycroft Mining (500 actions)', amountUSD: -25698.08, feesUSD: 139.46, details: '500 × 51.11724 USD', currency: 'USD', ref: '000053245188', bordereau: '2026 10963877' },

    // 23/01/2026 - Achats PHAG et ALKAL
    { date: '23/01/2026', type: 'buy', description: 'WisdomTree Physical Silver (700 parts)', amountEUR: -54029.07, feesEUR: 238.27, details: '700 × 76.844 EUR', currency: 'EUR', ref: '000053187638', bordereau: '2026 10047049' },
    { date: '23/01/2026', type: 'buy', description: 'Kalray SA (15000 actions)', amountEUR: -63170.25, feesEUR: 270.15, details: '15000 × 4.19334 EUR', currency: 'EUR', ref: '000053186842', bordereau: '2026 10032349' },

    // 21/01/2026 - Achats MU et SQM, Ventes GLXY, RDW et CRWV
    { date: '21/01/2026', type: 'buy', description: 'SQM (700 actions)', amountUSD: -57283.87, feesUSD: 249.62, details: '700 × 81.4775 USD', currency: 'USD', ref: '000053139192', bordereau: '2026 8900995' },
    { date: '21/01/2026', type: 'buy', description: 'Micron Technology, Inc. (150 actions)', amountUSD: -58132.53, feesUSD: 252.58, details: '150 × 385.8663 USD', currency: 'USD', ref: '000053139094', bordereau: '2026 8899752' },
    { date: '21/01/2026', type: 'sell', description: 'Galaxy Digital (1500 actions)', amountUSD: 46430.00, costBasisUSD: 51489.94, feesUSD: 213.25, details: '1500 × 31.0955 USD', currency: 'USD', ref: '000053137568', bordereau: '2026 8877666' },
    { date: '21/01/2026', type: 'sell', description: 'Redwire Corp. (5000 actions)', amountUSD: 50821.82, costBasisUSD: 54970.38, feesUSD: 228.68, details: '5000 × 10.2101 USD', currency: 'USD', ref: '000053135491', bordereau: '2026 8847191' },
    { date: '21/01/2026', type: 'sell', description: 'Coreweave Inc. (500 actions)', amountUSD: 46218.54, costBasisUSD: 50910.49, feesUSD: 212.51, details: '500 × 92.8621 USD', currency: 'USD', ref: '000053132721', bordereau: '2026 8816674' },

    // 16/01/2026 - Achats CRWV et GLXY
    { date: '16/01/2026', type: 'buy', description: 'Coreweave Inc. (500 actions)', amountUSD: -50910.49, feesUSD: 227.39, details: '500 × 101.3662 USD', currency: 'USD', ref: '000053046838', bordereau: '2026 7109476' },
    { date: '16/01/2026', type: 'buy', description: 'Galaxy Digital (1500 actions)', amountUSD: -51239.79, feesUSD: 250.15, details: '1500 × 34.01 USD', currency: 'USD', ref: '000053046686', bordereau: '2026 3972837' },

    // 09/01/2026 - Achats RDW, SNDK, WDC
    { date: '09/01/2026', type: 'buy', description: 'Redwire Corp. (5000 actions)', amountUSD: -54720.23, feesUSD: 250.15, details: '5000 × 10.90 USD', currency: 'USD', ref: '000052891371', bordereau: '2026 2332451' },
    { date: '09/01/2026', type: 'buy', description: 'Sandisk Corp. (150 actions)', amountUSD: -57572.13, feesUSD: 250.15, details: '150 × 382.14 USD', currency: 'USD', ref: '000052891033', bordereau: '2026 2331862' },
    { date: '09/01/2026', type: 'buy', description: 'Western Digital (300 actions)', amountUSD: -60070.19, feesUSD: 250.15, details: '300 × 199.37 USD', currency: 'USD', ref: '000052890858', bordereau: '2026 2331216' },

    // 07/01/2026 - Ventes AMAT, PHAG, HYMC×2, G2X, HY9H, WDC
    { date: '07/01/2026', type: 'sell', description: 'Applied Materials (240 actions)', amountUSD: 69677.98, costBasisUSD: 60476.15, feesUSD: 250.15, details: '240 × 291.55 USD', currency: 'USD', ref: '000052824816', bordereau: '2026 2063660' },
    { date: '07/01/2026', type: 'sell', description: 'WisdomTree Silver (900 parts)', amountEUR: 53941.45, costBasisEUR: 49883.28, feesEUR: 239.63, details: '900 × 60.2012 EUR', currency: 'EUR', ref: '000052824746', bordereau: '2026 2417043' },
    { date: '07/01/2026', type: 'sell', description: 'Hycroft Mining (1000 actions)', amountUSD: 27533.12, costBasisUSD: 27847.64, feesUSD: 250.12, details: '1000 × 27.67 USD', currency: 'USD', ref: '000052824677', bordereau: '2026 2054456' },
    { date: '07/01/2026', type: 'sell', description: 'Hycroft Mining (1000 actions)', amountUSD: 27524.35, costBasisUSD: 27847.64, feesUSD: 250.12, details: '1000 × 27.68 USD', currency: 'USD', ref: '000052824555', bordereau: '2026 2053956' },
    { date: '07/01/2026', type: 'sell', description: 'VanEck Gold Miners (600 parts)', amountEUR: 51262.34, costBasisEUR: 48970.62, feesEUR: 200.14, details: '600 × 85.64 EUR', currency: 'EUR', ref: '000052824405', bordereau: '2026 2049227' },
    { date: '07/01/2026', type: 'sell', description: 'SK Hynix GDR (100 actions)', amountEUR: 43686.35, costBasisEUR: 43210.50, feesEUR: 200.50, details: '100 × 439 EUR', currency: 'EUR', ref: '000052824257', bordereau: '2026 2046825' },
    { date: '07/01/2026', type: 'sell', description: 'Western Digital (400 actions)', amountUSD: 80455.58, costBasisUSD: 65376.85, feesUSD: 250.15, details: '400 × 202.07 USD', currency: 'USD', ref: '000052824043', bordereau: '2026 2045928' },

    // 06/01/2026 - Achat SK Hynix
    { date: '06/01/2026', type: 'buy', description: 'SK Hynix GDR (100 actions)', amountEUR: -43210.50, amountUSD: -50916.14, feesEUR: 210.50, details: '100 × 430 EUR (règlement USD)', currency: 'EUR', ref: '000052790956', bordereau: '2026 1744402' },

    // 05/01/2026 - Achat HYMC + Vente LLY
    { date: '05/01/2026', type: 'buy', description: 'Hycroft Mining (2000 actions)', amountUSD: -55695.28, feesUSD: 244.08, details: '2000 × 27.73 USD', currency: 'USD', ref: '000052759164', bordereau: '2026 1081560' },
    { date: '05/01/2026', type: 'sell', description: 'Eli Lilly (111 actions)', amountUSD: 116550.36, costBasisUSD: 114559.58, feesUSD: 559.89, details: '111 × 1055.05 USD', currency: 'USD', ref: '000052757686', bordereau: '2026 1067387' },

    // 31/12/2025 - Dividende Broadcom
    { date: '31/12/2025', type: 'dividend', description: 'Dividende Broadcom', amountEUR: 48.10, feesEUR: 21.04, details: 'Brut 82.50 USD - 30% précompte', ref: 'cashmovements' },

    // 29/12/2025 - Achats PHAG, Samsung GDR×2
    { date: '29/12/2025', type: 'buy', description: 'WisdomTree Silver (900 parts)', amountEUR: -49883.28, feesEUR: 223.81, details: '900 × 55.17719 EUR', currency: 'EUR', ref: '000052636954', bordereau: '2025 111635290' },
    { date: '29/12/2025', type: 'buy', description: 'Samsung Electronics GDR (34 actions)', amountUSD: -70566.76, feesUSD: 594.76, details: '34 × 2058 USD', currency: 'USD', ref: '000052635737', bordereau: '2025 111617441' },
    { date: '29/12/2025', type: 'buy', description: 'Samsung Electronics GDR (24 actions)', amountUSD: -49860.24, feesUSD: 420.24, details: '24 × 2060 USD', currency: 'USD', ref: '000052635494', bordereau: '2025 111614429' },

    // 18/12/2025 - Dividende Western Digital
    { date: '18/12/2025', type: 'dividend', description: 'Dividende Western Digital', amountEUR: 24.68, feesEUR: 10.79, details: 'Brut 42.32 USD - 30% précompte', ref: 'cashmovements' },

    // 22/12/2025 - Ventes RKLB, AVGO, REGN, IDXX
    { date: '22/12/2025', type: 'sell', description: 'Rocket Lab (2200 actions)', amountUSD: 169210.32, costBasisUSD: 126722.13, feesUSD: 865.26, details: '2200 × 77.31 USD', currency: 'USD', ref: '000052557374', bordereau: '2025 110278867' },
    { date: '22/12/2025', type: 'sell', description: 'Broadcom (150 actions)', amountUSD: 50922.32, costBasisUSD: 57968.64, feesUSD: 229.03, details: '150 × 341.01 USD', currency: 'USD', ref: '000052556569', bordereau: '2025 110266584' },
    { date: '22/12/2025', type: 'sell', description: 'Regeneron (75 actions)', amountEUR: 49280.95, costBasisEUR: 51378.15, feesEUR: 255.00, details: '75 × 780.96 USD (crédité EUR)', currency: 'EUR', ref: '000052556448', bordereau: '2025 110264476' },
    { date: '22/12/2025', type: 'sell', description: 'IDEXX Labs (65 actions)', amountUSD: 45003.17, costBasisUSD: 49798.35, feesUSD: 208.24, details: '65 × 695.56 USD', currency: 'USD', ref: '000052548858', bordereau: '2025 110157099' },

    // 15/12/2025 - Conversion EUR → USD + Dividende Alphabet
    { date: '15/12/2025', type: 'conversion', description: 'Conversion EUR → USD', amountEUR: -15000.00, amountUSD: 17492.41, details: 'Taux 1.16616', ref: 'cashmovements' },
    { date: '15/12/2025', type: 'dividend', description: 'Dividende Alphabet', amountEUR: 36.32, feesEUR: 15.88, details: 'Brut 62.30 USD - 30% précompte', ref: 'cashmovements' },

    // 12/12/2025 - Achat RKLB
    { date: '12/12/2025', type: 'buy', description: 'Rocket Lab (1000 actions)', amountUSD: -65081.82, feesUSD: 276.82, details: '1000 × 64.81 USD', currency: 'USD', ref: '000052408393', bordereau: '2025 107188554' },

    // 08/12/2025 - Achat RKLB + Vente LLY
    { date: '08/12/2025', type: 'buy', description: 'Rocket Lab (1200 actions)', amountUSD: -61640.31, feesUSD: 264.81, details: '1200 × 51.15 USD', currency: 'USD', ref: '000052332080', bordereau: '2025 105389100' },
    { date: '08/12/2025', type: 'sell', description: 'Eli Lilly (111 actions)', amountUSD: 109682.83, costBasisUSD: 114559.58, feesUSD: 535.77, details: '111 × 992.96 USD', currency: 'USD', ref: '000052329454', bordereau: '2025 105347104' },

    // 01/12/2025 - Achat G2X + Conversion EUR → USD
    { date: '01/12/2025', type: 'buy', description: 'VanEck Gold Miners (600 parts)', amountEUR: -48970.62, feesEUR: 118.62, details: '600 × 81.42 EUR', ref: '000052206369', bordereau: '2025 102706493' },
    { date: '01/12/2025', type: 'conversion', description: 'Conversion EUR → USD', amountEUR: -100000.00, amountUSD: 115522.68, details: 'Taux 1.15523', ref: 'cashmovements' },

    // 28/11/2025 - Achats WDC, AMAT
    { date: '28/11/2025', type: 'buy', description: 'Western Digital (400 actions)', amountUSD: -65376.85, feesUSD: 277.85, details: '400 × 162.75 USD', currency: 'USD', ref: '000052191453', bordereau: '2025 102441099' },
    { date: '28/11/2025', type: 'buy', description: 'Applied Materials (240 actions)', amountUSD: -60476.15, feesUSD: 260.75, details: '240 × 250.90 USD', currency: 'USD', ref: '000052191412', bordereau: '2025 102440377' },

    // 25/11/2025 - Achats REGN, AVGO, IDXX
    { date: '25/11/2025', type: 'buy', description: 'Regeneron (75 actions)', amountEUR: -51378.15, feesEUR: 256.09, details: '75 × 785.10 USD (débité EUR)', currency: 'EUR', ref: '000052140547', bordereau: '2025 101411934' },
    { date: '25/11/2025', type: 'buy', description: 'Broadcom (150 actions)', amountUSD: -57968.64, feesUSD: 252.01, details: '150 × 384.78 USD', currency: 'USD', ref: '000052140379', bordereau: '2025 101410483' },
    { date: '25/11/2025', type: 'buy', description: 'IDEXX Labs (65 actions)', amountUSD: -49798.35, feesUSD: 223.51, details: '65 × 762.69 USD', currency: 'USD', ref: '000052140351', bordereau: '2025 101410175' },

    // 20/11/2025 - Rachat GOOGL, Vente GOOGL, Achats GOOGL×2
    { date: '20/11/2025', type: 'buy', description: 'Alphabet (350 actions)', amountUSD: -102500.15, feesUSD: 487.05, details: '350 × 291.47 USD', currency: 'USD', ref: '000052060315', bordereau: '2025 99848566' },
    { date: '20/11/2025', type: 'sell', description: 'Alphabet (700 actions)', amountUSD: 208462.18, costBasisUSD: 215271.21, feesUSD: 1063.34, details: '700 × 299.32 USD', currency: 'USD', ref: '000052053456', bordereau: '2025 99741957' },
    { date: '20/11/2025', type: 'buy', description: 'Alphabet (350 actions)', amountUSD: -107676.08, feesUSD: 505.10, details: '350 × 306.20 USD', currency: 'USD', ref: '000052051289', bordereau: '2025 99715215' },
    { date: '20/11/2025', type: 'buy', description: 'Alphabet (350 actions)', amountUSD: -107595.13, feesUSD: 504.82, details: '350 × 305.97 USD', currency: 'USD', ref: '000052051199', bordereau: '2025 99714369' },

    // 17/11/2025 - Achats LLY×3
    { date: '17/11/2025', type: 'buy', description: 'Eli Lilly (76 actions)', amountUSD: -78450.98, feesUSD: 343.38, details: '76 × 1027.73 USD', currency: 'USD', ref: '000051985563', bordereau: '2025 98912939' },
    { date: '17/11/2025', type: 'buy', description: 'Eli Lilly (70 actions)', amountUSD: -72239.08, feesUSD: 321.71, details: '70 × 1027.39 USD', currency: 'USD', ref: '000051985300', bordereau: '2025 98912525' },
    { date: '17/11/2025', type: 'buy', description: 'Eli Lilly (76 actions)', amountUSD: -78429.10, feesUSD: 343.30, details: '76 × 1027.44 USD', currency: 'USD', ref: '000051985288', bordereau: '2025 98912498' },

    // 18-20/11/2025 - Conversions EUR → USD (avant achats USD)
    { date: '20/11/2025', type: 'conversion', description: 'Conversion EUR → USD', amountEUR: -200000.00, amountUSD: 228878.44, details: 'Taux 1.14439', ref: 'cashmovements' },
    { date: '18/11/2025', type: 'conversion', description: 'Conversion EUR → USD', amountEUR: -200000.00, amountUSD: 230707.40, details: 'Taux 1.15354', ref: 'cashmovements' },

    // 15/11/2025
    { date: '15/11/2025', type: 'withdrawal', description: 'Retrait', amountEUR: -8000.00, ref: 'Extrait n°9' },

    // 14/11/2025
    { date: '14/11/2025', type: 'withdrawal', description: 'Retrait', amountEUR: -2000.00, ref: 'Extrait n°8' },

    // 28/10/2025 - Ventes ETF (costBasis = coût d'achat original)
    { date: '28/10/2025', type: 'sell', description: 'Invesco Nasdaq-100 nouveau (144 parts)', amountEUR: 64863.60, costBasisEUR: 61848.21, feesEUR: 138.00, details: '144 × 451.40 EUR', ref: '000051589834', bordereau: '2025 90099204' },
    { date: '28/10/2025', type: 'sell', description: 'Invesco MSCI World (796 parts)', amountEUR: 94758.92, costBasisEUR: 90363.46, feesEUR: 256.54, details: '796 × 119.37 EUR', ref: '000051589814', bordereau: '2025 90098993' },
    { date: '28/10/2025', type: 'sell', description: 'iShares MSCI EM (2567 parts)', amountEUR: 98359.51, costBasisEUR: 89978.84, feesEUR: 213.29, details: '2567 × 38.40 EUR', ref: '000051589778', bordereau: '2025 90098779' },
    { date: '28/10/2025', type: 'sell', description: 'iShares MSCI World (1424 parts)', amountEUR: 157963.86, costBasisEUR: 150557.54, feesEUR: 427.66, details: '1424 × 111.23 EUR', ref: '000051589752', bordereau: '2025 90098776' },
    { date: '28/10/2025', type: 'sell', description: 'iShares S&P 500 (354 parts)', amountEUR: 222457.03, costBasisEUR: 211065.72, feesEUR: 602.26, details: '354 × 630.11 EUR', ref: '000051589730', bordereau: '2025 90098246' },

    // 06/10/2025
    { date: '06/10/2025', type: 'deposit', description: 'Dépôt complémentaire', amountEUR: 7000.00, ref: 'Extrait n°6' },

    // 19/09/2025 - Switch Nasdaq
    { date: '19/09/2025', type: 'buy', description: 'Invesco Nasdaq-100 nouveau (144 parts)', amountEUR: -61848.21, feesEUR: 134.06, details: '144 × 428.57 EUR', ref: '000050784266', bordereau: '2025 74318900' },
    { date: '19/09/2025', type: 'sell', description: 'Invesco Nasdaq-100 ancien (121 parts)', amountEUR: 61283.81, costBasisEUR: 60162.25, feesEUR: 123.69, details: '121 × 507.50 EUR', ref: '000050782251', bordereau: '2025 74306729' },

    // 18/09/2025
    { date: '18/09/2025', type: 'dividend', description: 'Dividende Invesco Nasdaq-100', amountEUR: 29.39, feesEUR: 12.85, details: 'Brut 50.99 USD - 30% précompte', ref: '073852502' },

    // 01/09/2025
    { date: '01/09/2025', type: 'deposit', description: 'Dépôt complémentaire', amountEUR: 3000.00, ref: 'Extrait n°2' },

    // 29/08/2025 - Achats ETF
    { date: '29/08/2025', type: 'buy', description: 'Invesco Nasdaq-100 ancien (121 parts)', amountEUR: -60162.25, feesEUR: 122.05, details: '121 × 496.20 EUR', ref: '000050453617', bordereau: '2025 67549641' },
    { date: '29/08/2025', type: 'buy', description: 'iShares MSCI EM (2567 parts)', amountEUR: -89978.84, feesEUR: 187.75, details: '2567 × 34.98 EUR', ref: '000050453551', bordereau: '2025 67548928' },
    { date: '29/08/2025', type: 'buy', description: 'Invesco MSCI World (796 parts)', amountEUR: -90363.46, feesEUR: 243.32, details: '796 × 113.22 EUR', ref: '000050453478', bordereau: '2025 67548154' },
    { date: '29/08/2025', type: 'buy', description: 'iShares MSCI World (1424 parts)', amountEUR: -150557.54, feesEUR: 330.28, details: '475+475+474 × 105.50 EUR', ref: '000050453228-367', bordereau: '2025 67545627 (+2)' },
    { date: '29/08/2025', type: 'buy', description: 'iShares S&P 500 (354 parts)', amountEUR: -211065.72, feesEUR: 447.75, details: '3×118 × 594.97 EUR', ref: '000050453081-150', bordereau: '2025 67543276/298/331' },

    // 27/08/2025
    { date: '27/08/2025', type: 'deposit', description: 'Dépôt initial', amountEUR: 600000.00, ref: 'Extrait n°1' }
  ];

  // Calculer les positions actuelles (titres encore en portefeuille)
  const currentPositions = (() => {
    const positions = {};

    // Parcourir toutes les transactions en ordre chronologique (ancien → récent)
    const chronologicalTimeline = [...portfolioTimeline].reverse();
    chronologicalTimeline.forEach(item => {
      if (item.type !== 'buy' && item.type !== 'sell') return;

      // Extraire le nom du titre (avant la parenthèse)
      const nameMatch = item.description?.match(/^([^(]+)/);
      if (!nameMatch) return;
      const name = nameMatch[1].trim();

      // Extraire la quantité
      const qtyMatch = item.description?.match(/\((\d[\d\s]*)\s*(actions?|parts?)\)/);
      if (!qtyMatch) return;
      const quantity = parseInt(qtyMatch[1].replace(/\s/g, ''), 10);

      // Extraire la devise
      const priceMatch = item.details?.match(/×\s*([\d.,]+)\s*(USD|EUR|\$|€)/);
      const currency = item.currency || (priceMatch && (priceMatch[2] === 'EUR' || priceMatch[2] === '€') ? 'EUR' : 'USD');

      // Initialiser la position si nécessaire
      if (!positions[name]) {
        positions[name] = {
          name,
          quantity: 0,
          totalCost: 0,
          totalFees: 0,
          currency,
          ticker: tickerMap[name]?.ticker || null
        };
      }

      // Mettre à jour la position
      if (item.type === 'buy') {
        positions[name].quantity += quantity;
        positions[name].totalCost += Math.abs(item.amountUSD || item.amountEUR || 0);
        positions[name].totalFees += item.feesUSD || item.feesEUR || 0;
      } else if (item.type === 'sell') {
        positions[name].quantity -= quantity;
        // Réduire le coût proportionnellement
        if (positions[name].quantity > 0) {
          const avgCost = positions[name].totalCost / (positions[name].quantity + quantity);
          positions[name].totalCost = avgCost * positions[name].quantity;
        } else {
          positions[name].totalCost = 0;
        }
      }
    });

    // Filtrer pour ne garder que les positions avec quantité > 0
    return Object.values(positions)
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.totalCost - a.totalCost); // Trier par valeur investie décroissante
  })();

  // Timeline pour affichage (ordre Bolero: récent → ancien)
  const timelineWithBalance = portfolioTimeline;

  // Calcul du solde EUR estimé (en descendant depuis les liquidités actuelles)
  const liquiditesActuelles = 279255.94;
  const computedBalances = (() => {
    let balance = liquiditesActuelles;
    const balances = [];
    for (let i = 0; i < timelineWithBalance.length; i++) {
      balances.push(balance);
      const item = timelineWithBalance[i];
      const rate = getRateForDate(item.date);
      let eurImpact;
      if (item.type === 'conversion') {
        // Net: EUR sortant + USD entrant converti en EUR ≈ frais uniquement
        eurImpact = (item.amountEUR || 0) + (item.amountUSD ? item.amountUSD / rate : 0);
      } else {
        eurImpact = item.amountEUR || (item.amountUSD ? item.amountUSD / rate : 0);
      }
      balance -= eurImpact;
    }
    return balances;
  })();

  // Tickers EUR (tout le reste = USD)
  const eurTickers = new Set(['ALKAL.PA', 'PHAG.AS', 'BNP.PA', 'CSPX.AS', 'IWDA.AS', 'IEMA.AS', 'MWRD.PA', 'EQQQ.PA']);

  // Graphique valeur du portefeuille jour par jour
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (Object.keys(historicalRates).length === 0) return;

    const computePortfolioValues = async () => {
      setLoadingPortfolioChart(true);
      try {
        // 1. Reconstituer les positions chronologiquement (du plus ancien au plus récent)
        const chronological = [...portfolioTimeline].reverse();
        const positions = {};
        let cEUR = 0, cUSD = 0;
        const states = {};

        for (const item of chronological) {
          // Appliquer la transaction sur le cash
          if (item.type === 'conversion') {
            cEUR += item.amountEUR || 0;
            cUSD += item.amountUSD || 0;
          } else if (['deposit', 'withdrawal', 'dividend'].includes(item.type)) {
            cEUR += item.amountEUR || 0;
          } else if (item.type === 'buy' || item.type === 'sell') {
            if (item.amountUSD) cUSD += item.amountUSD;
            else if (item.amountEUR) cEUR += item.amountEUR;
          }
          // Appliquer la transaction sur les positions
          if (item.type === 'buy' || item.type === 'sell') {
            const info = getTickerInfo(item.description);
            const ticker = info?.ticker;
            const qtyMatch = item.description?.match(/\((\d[\d\s]*)\s*(actions?|parts?)\)/);
            const qty = qtyMatch ? parseInt(qtyMatch[1].replace(/\s/g, ''), 10) : 0;
            if (ticker && qty) {
              if (item.type === 'buy') {
                positions[ticker] = (positions[ticker] || 0) + qty;
              } else {
                positions[ticker] = (positions[ticker] || 0) - qty;
                if (positions[ticker] <= 0) delete positions[ticker];
              }
            }
          }
          // Enregistrer l'état fin de journée (dernier état par date)
          states[item.date] = { positions: { ...positions }, cashEUR: cEUR, cashUSD: cUSD };
        }
        console.log('Forward cash final - EUR:', cEUR.toFixed(2), 'USD:', cUSD.toFixed(2));

        // 2. Trier les dates d'état chronologiquement
        const stateDates = Object.keys(states).sort((a, b) => {
          const [dA, mA, yA] = a.split('/');
          const [dB, mB, yB] = b.split('/');
          return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
        });

        // 3. Collecter tous les tickers ayant été détenus
        const allTickersSet = new Set();
        Object.values(states).forEach(s => Object.keys(s.positions).forEach(t => allTickersSet.add(t)));
        const allTickers = Array.from(allTickersSet);
        console.log('Tickers à charger:', allTickers.join(', '));

        // 4. Charger les cours historiques pour chaque ticker
        const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
        const priceHistory = {};
        await Promise.all(allTickers.map(async (ticker) => {
          try {
            const resp = await fetch(`${apiBase}/api/history/${ticker}/1y`);
            const data = await resp.json();
            if (data.chart?.result?.[0]) {
              const r = data.chart.result[0];
              const currency = r.meta?.currency;
              console.log(`Ticker ${ticker}: devise=${currency}, isEUR=${eurTickers.has(ticker)}`);
              const ts = r.timestamp || [];
              const cl = r.indicators?.quote?.[0]?.close || [];
              priceHistory[ticker] = {};
              ts.forEach((t, i) => {
                if (cl[i]) {
                  const dt = new Date(t * 1000);
                  const key = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
                  priceHistory[ticker][key] = cl[i];
                }
              });
            }
          } catch (e) {
            console.error(`Erreur historique ${ticker}:`, e);
          }
        }));

        // 5. Calculer la valeur jour par jour
        const tradingDays = Object.keys(historicalRates).sort().map(k => {
          const [y, m, d] = k.split('-');
          return { dateStr: `${d}/${m}/${y}`, dateObj: new Date(y, m - 1, d), rateKey: k };
        });

        const [fd, fm, fy] = stateDates[0].split('/');
        const firstDateObj = new Date(fy, fm - 1, fd);

        const chartData = [];
        let stateIdx = 0;

        for (const day of tradingDays) {
          if (day.dateObj < firstDateObj) continue;

          // Trouver l'état applicable (plus récent ≤ jour courant)
          while (stateIdx < stateDates.length - 1) {
            const [nd, nm, ny] = stateDates[stateIdx + 1].split('/');
            if (new Date(ny, nm - 1, nd) <= day.dateObj) stateIdx++;
            else break;
          }
          const state = states[stateDates[stateIdx]];
          const rate = historicalRates[day.rateKey] || eurUsdRate;

          // Valeur des actions en EUR
          let stocksEUR = 0;
          for (const [ticker, qty] of Object.entries(state.positions)) {
            let price = priceHistory[ticker]?.[day.dateStr];
            if (!price) {
              for (let off = 1; off <= 5 && !price; off++) {
                const prev = new Date(day.dateObj);
                prev.setDate(prev.getDate() - off);
                const pk = `${String(prev.getDate()).padStart(2, '0')}/${String(prev.getMonth() + 1).padStart(2, '0')}/${prev.getFullYear()}`;
                price = priceHistory[ticker]?.[pk];
              }
            }
            if (price) {
              const val = qty * price / (eurTickers.has(ticker) ? 1 : rate);
              if (day.dateStr === '27/10/2025') {
                console.log(`  27/10 - ${ticker}: ${qty} × ${price.toFixed(2)} / ${eurTickers.has(ticker) ? '1(EUR)' : rate.toFixed(4)} = ${val.toFixed(0)} EUR`);
              }
              stocksEUR += val;
            }
          }

          if (day.dateStr === '27/10/2025') {
            console.log(`  27/10 - cashEUR: ${state.cashEUR.toFixed(2)}, cashUSD: ${state.cashUSD.toFixed(2)}, stocksEUR: ${stocksEUR.toFixed(0)}`);
          }
          const cashEUR = state.cashEUR + state.cashUSD / rate;
          chartData.push({
            date: day.dateStr,
            total: Math.round(cashEUR + stocksEUR),
            stocks: Math.round(stocksEUR),
            cash: Math.round(cashEUR)
          });
        }

        console.log('Graphique portfolio:', chartData.length, 'jours');
        setPortfolioValueData(chartData);
      } catch (err) {
        console.error('Erreur calcul valeur portefeuille:', err);
      } finally {
        setLoadingPortfolioChart(false);
      }
    };

    computePortfolioValues();
  }, [historicalRates, eurUsdRate]);

  return (
    <div className="sales-history-container">
      <div className="nav-buttons">
        <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        <button onClick={() => navigate('/chl')} className="nav-button">Portfolio</button>
        <button onClick={() => navigate('/chl/charts')} className="nav-button">Graphiques</button>
      </div>

      {/* Tableau des positions actuelles */}
      <div className="sales-summary" style={{ borderColor: '#4caf50', background: 'linear-gradient(135deg, #1e2228 0%, #1a2530 100%)', marginBottom: '20px' }}>
        <h2 style={{ color: '#4caf50' }}>Positions Actuelles</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>
          Titres encore en portefeuille (calculé depuis l'historique)
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #3a3f47' }}>
              <th style={{ padding: '4px 6px', textAlign: 'left', color: '#4caf50', fontSize: '0.6rem' }}>Action</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', color: '#4caf50', fontSize: '0.6rem' }}>Achat</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', color: '#4caf50', fontSize: '0.6rem' }}>Actuel</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', color: '#4caf50', fontSize: '0.6rem' }}>Total achat</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', color: '#4caf50', fontSize: '0.6rem' }}>Total actuel</th>
              <th style={{ padding: '4px 6px', textAlign: 'right', color: '#4caf50', fontSize: '0.6rem' }}>+/- (EUR)</th>
            </tr>
          </thead>
          <tbody>
            {currentPositions.map((position, index) => {
              const pru = position.quantity > 0 ? position.totalCost / position.quantity : 0;
              const currencySymbol = position.currency === 'EUR' ? '€' : '$';
              const priceData = position.ticker ? currentPrices[position.ticker] : null;
              const currentPrice = priceData?.price || null;

              // Calculs
              const totalCurrent = currentPrice ? currentPrice * position.quantity : null;
              const diff = totalCurrent ? totalCurrent - position.totalCost : null;
              const diffPercent = diff !== null ? (diff / position.totalCost) * 100 : null;

              // Conversion EUR
              const diffEUR = diff !== null && position.currency === 'USD' && eurUsdRate
                ? diff / eurUsdRate
                : diff;
              const totalCurrentEUR = totalCurrent && position.currency === 'USD' && eurUsdRate
                ? totalCurrent / eurUsdRate
                : totalCurrent;

              return (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #2a3038',
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                  }}
                >
                  <td style={{ padding: '4px 6px', color: '#e6e6e6', fontSize: '0.6rem' }}>
                    <div>
                      {position.ticker ? (
                        <a
                          href={`https://finance.yahoo.com/quote/${position.ticker}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#61dafb', textDecoration: 'none' }}
                        >
                          {position.name}
                        </a>
                      ) : (
                        position.name
                      )}
                    </div>
                    <div style={{ fontSize: '0.5rem', color: '#9fa3a8', marginTop: '2px' }}>
                      {position.ticker || '-'} ({position.quantity} unités)
                    </div>
                  </td>
                  <td style={{ padding: '4px 6px', color: '#e6e6e6', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {pru.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap', color: currentPrice && currentPrice > pru ? '#4caf50' : '#ff6b6b' }}>
                    {currentPrice
                      ? `${currentPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
                      : <span style={{ color: '#ff6b6b' }}>N/A</span>
                    }
                  </td>
                  <td style={{ padding: '4px 6px', color: '#e6e6e6', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {position.currency === 'USD' && eurUsdRate ? (
                      <>
                        <div>{(position.totalCost / eurUsdRate).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                        <div style={{ fontSize: '0.5rem', color: '#9fa3a8', marginTop: '2px' }}>
                          {position.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                        </div>
                      </>
                    ) : (
                      <div>{position.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</div>
                    )}
                  </td>
                  <td style={{ padding: '4px 6px', color: '#e6e6e6', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {totalCurrent ? (
                      position.currency === 'USD' && totalCurrentEUR ? (
                        <>
                          <div>{totalCurrentEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                          <div style={{ fontSize: '0.5rem', color: '#9fa3a8', marginTop: '2px' }}>
                            {totalCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                          </div>
                        </>
                      ) : (
                        <div>{totalCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}</div>
                      )
                    ) : (
                      <span style={{ color: '#ff6b6b' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap', color: diffEUR !== null && diffEUR >= 0 ? '#4caf50' : '#ff6b6b' }}>
                    {diffEUR !== null ? (
                      <>
                        <div>{diffEUR >= 0 ? '+' : ''}{diffEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                        <div style={{ fontSize: '0.5rem', marginTop: '2px' }}>
                          {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <span style={{ color: '#ff6b6b' }}>N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {(() => {
              const totalBuy = currentPositions.filter(p => p.currency === 'USD').reduce((sum, p) => sum + p.totalCost, 0);
              const totalCurrent = currentPositions
                .filter(p => p.currency === 'USD' && p.ticker && currentPrices[p.ticker])
                .reduce((sum, p) => sum + (currentPrices[p.ticker].price * p.quantity), 0);
              const diff = totalCurrent - totalBuy;
              const diffPercent = totalBuy > 0 ? (diff / totalBuy) * 100 : 0;
              const diffEUR = eurUsdRate ? diff / eurUsdRate : diff;
              const isPositive = diff >= 0;

              return (
                <tr style={{ borderTop: '2px solid #3a3f47', fontWeight: 'bold' }}>
                  <td colSpan="3" style={{ padding: '6px', color: '#4caf50', fontSize: '0.6rem' }}>TOTAL ({currentPositions.length} positions)</td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#e6e6e6', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {eurUsdRate && (
                      <div>{(totalBuy / eurUsdRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                    )}
                    <div style={{ fontSize: '0.5rem', color: '#9fa3a8', marginTop: '2px' }}>
                      {totalBuy.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                    </div>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right', color: '#e6e6e6', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                    {eurUsdRate && (
                      <div>{(totalCurrent / eurUsdRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                    )}
                    <div style={{ fontSize: '0.5rem', color: '#9fa3a8', marginTop: '2px' }}>
                      {totalCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                    </div>
                  </td>
                  <td style={{ padding: '6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap', color: isPositive ? '#4caf50' : '#ff6b6b' }}>
                    <div>{isPositive ? '+' : ''}{diffEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                    <div style={{ fontSize: '0.5rem', marginTop: '2px' }}>
                      {isPositive ? '+' : ''}{diffPercent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })()}
          </tfoot>
        </table>
        <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
          EUR/USD: {eurUsdRate ? eurUsdRate.toFixed(4) : 'N/A'}
        </p>
      </div>

      {/* Graphique valeur du portefeuille */}
      <div className="sales-summary" style={{ borderColor: '#ffc107', background: 'linear-gradient(135deg, #1e2228 0%, #1a2530 100%)', marginBottom: '20px' }}>
        <h2 style={{ color: '#ffc107' }}>Valeur du Portefeuille</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>
          Évolution jour par jour depuis la constitution (actions + liquidités en EUR)
        </p>
        {loadingPortfolioChart ? (
          <p style={{ textAlign: 'center', color: '#9fa3a8' }}>Chargement du graphique...</p>
        ) : portfolioValueData.length > 0 && (
          <>
            <div style={{ fontSize: '0.75rem', color: '#9fa3a8', textAlign: 'center', marginBottom: '10px' }}>
              <span>Début: {portfolioValueData[0]?.total?.toLocaleString('fr-FR')} € → </span>
              <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                Actuel: {portfolioValueData[portfolioValueData.length - 1]?.total?.toLocaleString('fr-FR')} €
              </span>
              {(() => {
                const first = portfolioValueData[0]?.total;
                const last = portfolioValueData[portfolioValueData.length - 1]?.total;
                const perf = first ? ((last - first) / first * 100).toFixed(2) : null;
                return perf ? (
                  <span style={{ color: parseFloat(perf) >= 0 ? '#4caf50' : '#ff6b6b', marginLeft: '10px' }}>
                    ({parseFloat(perf) >= 0 ? '+' : ''}{perf}%)
                  </span>
                ) : null;
              })()}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={portfolioValueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
                <XAxis
                  dataKey="date"
                  stroke="#9fa3a8"
                  tick={{ fontSize: 9 }}
                  interval={Math.floor(portfolioValueData.length / 8)}
                />
                <YAxis
                  stroke="#9fa3a8"
                  tick={{ fontSize: 10 }}
                  domain={[600000, 'auto']}
                  allowDataOverflow={true}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0]?.payload;
                    return (
                      <div style={{ backgroundColor: '#1e2228', border: '1px solid #ffc107', borderRadius: '4px', padding: '8px 12px', fontSize: '0.7rem' }}>
                        <div style={{ color: '#ffc107', marginBottom: '4px' }}>{(() => { const [d,m,y] = (label||'').split('/'); const dt = new Date(y, m-1, d); return dt.toLocaleDateString('fr-FR', { weekday: 'long' }) + ' ' + label; })()}</div>
                        <div style={{ color: '#ffc107', fontWeight: 'bold', marginBottom: '4px' }}>Total: {data?.total?.toLocaleString('fr-FR')} €</div>
                        <div style={{ color: '#4caf50' }}>Actions: {data?.stocks?.toLocaleString('fr-FR')} €</div>
                        <div style={{ color: '#2196f3' }}>Liquidités: {data?.cash?.toLocaleString('fr-FR')} €</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="cash" stackId="a" fill="#2196f3" name="cash" />
                <Bar dataKey="stocks" stackId="a" fill="#4caf50" name="stocks" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '0.7rem', color: '#9fa3a8', textAlign: 'center', marginTop: '5px' }}>
              <span style={{ color: '#4caf50' }}>■</span> Actions
              <span style={{ color: '#2196f3', marginLeft: '15px' }}>■</span> Liquidités
            </div>
          </>
        )}
      </div>

      {/* Tableau chronologique */}
      <div className="sales-summary" style={{ borderColor: '#61dafb', background: 'linear-gradient(135deg, #1e2228 0%, #1a2530 100%)' }}>
        <h2 style={{ color: '#61dafb' }}>Historique des Ordres</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>
          Historique chronologique de toutes les transactions depuis la création
        </p>

        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #3a3f47' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', color: '#61dafb', fontSize: '0.6rem' }}>Réf.</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', color: '#61dafb', fontSize: '0.6rem' }}>Date</th>
                <th style={{ padding: '4px 6px', textAlign: 'left', color: '#61dafb', fontSize: '0.6rem' }}>Nom</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', color: '#61dafb', fontSize: '0.6rem' }}>Type</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>Qté</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>Cours</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>Actuel</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>Frais</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>USD</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>EUR</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>Taux</th>
                <th style={{ padding: '4px 6px', textAlign: 'right', color: '#61dafb', fontSize: '0.6rem' }}>Solde EUR</th>
              </tr>
            </thead>
            <tbody>
              {timelineWithBalance.map((item, index) => {
                const typeColors = {
                  deposit: '#4caf50',
                  withdrawal: '#ff6b6b',
                  buy: '#ff9800',
                  sell: '#2196f3',
                  dividend: '#9c27b0',
                  conversion: '#ffc107'
                };
                const typeLabels = {
                  deposit: 'Dépôt',
                  withdrawal: 'Retrait',
                  buy: 'Achat',
                  sell: 'Vente',
                  dividend: 'Dividende',
                  conversion: 'Conversion'
                };

                const tickerInfo = getTickerInfo(item.description);
                // Extraire la quantité depuis la description (ex: "500 actions" ou "900 parts")
                const qtyMatch = item.description?.match(/\((\d[\d\s]*)\s*(actions?|parts?)\)/);
                const quantity = qtyMatch ? qtyMatch[1].replace(/\s/g, '') : null;
                // Extraire le cours depuis details (ex: "500 × 101.3662 USD" ou "900 × 55.17719 EUR")
                const priceMatch = item.details?.match(/×\s*([\d.,]+)\s*(USD|EUR|\$|€)/);
                const price = priceMatch ? priceMatch[1].replace(',', '.') : null;
                const priceCurrency = priceMatch ? (priceMatch[2] === 'EUR' || priceMatch[2] === '€' ? '€' : '$') : null;

                return (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #2a3038',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <td style={{ padding: '4px 6px', color: '#9fa3a8', fontFamily: 'monospace', fontSize: '0.55rem' }}>{item.ref || '-'}</td>
                    <td style={{ padding: '4px 6px', color: '#e6e6e6', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>{item.date}</td>
                    <td style={{ padding: '4px 6px', color: '#e6e6e6', fontSize: '0.6rem' }}>
                      {tickerInfo ? (
                        <a
                          href={`https://finance.yahoo.com/quote/${tickerInfo.ticker}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#61dafb', textDecoration: 'none' }}
                        >
                          {tickerInfo.name} ({tickerInfo.ticker})
                        </a>
                      ) : (
                        <span>{item.description?.split('(')[0]?.trim() || '-'}</span>
                      )}
                    </td>
                    <td style={{ padding: '4px 6px', fontSize: '0.6rem', textAlign: 'center' }}>
                      <span style={{
                        backgroundColor: typeColors[item.type],
                        color: '#fff',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontSize: '0.55rem',
                        fontWeight: 'bold'
                      }}>
                        {typeLabels[item.type]}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px', color: '#e6e6e6', textAlign: 'right', fontSize: '0.6rem' }}>
                      {quantity || '-'}
                    </td>
                    <td style={{ padding: '4px 6px', color: '#e6e6e6', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                      {price ? `${parseFloat(price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${priceCurrency}` : '-'}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                      {(() => {
                        if (!tickerInfo || !price || (item.type !== 'buy' && item.type !== 'sell')) return '-';
                        const priceData = currentPrices[tickerInfo.ticker];
                        if (!priceData) return <span style={{ color: '#9fa3a8' }}>N/A</span>;
                        const orderPrice = parseFloat(price);
                        const currentP = priceData.price;
                        const isOrderEUR = priceCurrency === '€';
                        const isPriceGBp = priceData.currency === 'GBp';
                        const adjustedCurrent = isPriceGBp ? currentP / 100 : currentP;
                        const diff = ((adjustedCurrent - orderPrice) / orderPrice * 100);
                        // Pour un achat: vert si le cours a monté (bon achat), rouge sinon
                        // Pour une vente: rouge si le cours a monté (vendu trop tôt), vert sinon
                        const isGood = item.type === 'buy' ? diff >= 0 : diff <= 0;
                        return (
                          <>
                            <div style={{ color: '#e6e6e6' }}>
                              {adjustedCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {isOrderEUR ? '€' : '$'}
                            </div>
                            <div style={{ fontSize: '0.5rem', color: isGood ? '#4caf50' : '#ff6b6b', marginTop: '1px' }}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                            </div>
                          </>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', color: '#e6e6e6', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                      {item.feesEUR || item.feesUSD ? (
                        <>
                          {item.feesEUR && <div>{item.feesEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>}
                          {item.feesUSD && <div>{item.feesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</div>}
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                      {item.amountUSD ? (
                        <div style={{ color: item.amountUSD > 0 ? '#4caf50' : '#ff6b6b' }}>
                          {item.amountUSD > 0 ? '+' : ''}{item.amountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const rate = getRateForDate(item.date);
                        const amountEUR = item.amountEUR || (item.amountUSD ? item.amountUSD / rate : null);
                        if (amountEUR) {
                          return (
                            <div style={{ color: amountEUR > 0 ? '#4caf50' : '#ff6b6b' }}>
                              {amountEUR > 0 ? '+' : ''}{amountEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                            </div>
                          );
                        }
                        return '-';
                      })()}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', color: '#9fa3a8' }}>
                      {getRateForDate(item.date).toFixed(4)}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: '0.6rem', whiteSpace: 'nowrap', color: '#61dafb' }}>
                      {computedBalances[index] !== undefined
                        ? computedBalances[index].toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', fontSize: '0.75rem' }}>
            <span><span style={{ color: '#4caf50' }}>●</span> Dépôt</span>
            <span><span style={{ color: '#ff6b6b' }}>●</span> Retrait</span>
            <span><span style={{ color: '#ff9800' }}>●</span> Achat</span>
            <span><span style={{ color: '#2196f3' }}>●</span> Vente</span>
            <span><span style={{ color: '#9c27b0' }}>●</span> Dividende</span>
            <span><span style={{ color: '#ffc107' }}>●</span> Conversion</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesHistory;
