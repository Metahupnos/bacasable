import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './GraphiquesETF.css';

function GraphiquesChL() {
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState({});
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [eurUsdRate, setEurUsdRate] = useState(null);
  const [usdEurHistory, setUsdEurHistory] = useState([]);
  const [usdEurByDate, setUsdEurByDate] = useState({});

  // Mis à jour 19/02/2026 - Ventes GOOGL, MU, SNDK, WDC (gardés pour suivi futur)
  // Actions actuelles + vendues récemment (sold: true = vendu mais suivi continu)
  const stocks = [
    { symbol: 'GOOGL', name: 'Alphabet Inc.', color: '#2196f3', units: 150, buyPrice: 292.86, buyDate: '2025-11-20', sold: true, sellPrice: 303.97, sellDate: '2026-02-18' },
    { symbol: 'MU', name: 'Micron Technology', color: '#00bcd4', units: 150, buyPrice: 387.55, buyDate: '2026-01-21', sold: true, sellPrice: 422.27, sellDate: '2026-02-18' },
    { symbol: 'SMSN.IL', name: 'Samsung Electronics GDR', color: '#1428a0', units: 58, buyPrice: 2076.33, buyDate: '2025-12-29' },
    { symbol: 'SNDK', name: 'Sandisk Corp.', color: '#9c27b0', units: 150, buyPrice: 383.81, buyDate: '2026-01-09', sold: true, sellPrice: 603.09, sellDate: '2026-02-18' },
    { symbol: 'WDC', name: 'Western Digital', color: '#4caf50', units: 300, buyPrice: 200.23, buyDate: '2026-01-09', sold: true, sellPrice: 301.68, sellDate: '2026-02-18' },
    { symbol: 'PHAG.AS', name: 'WisdomTree Physical Silver', color: '#c0c0c0', units: 700, buyPrice: 77.18, buyDate: '2026-01-23', currency: 'EUR' },
  ];

  // Actions vendues (historique) - courbes grises
  // Prix de vente = montant net après frais / quantité
  // Les taux USD/EUR seront récupérés dynamiquement depuis l'historique
  const soldStocks = [
    { symbol: 'CRWV', name: 'Coreweave Inc. (vendu)', color: '#00bcd4', units: 500, buyPrice: 101.37, buyDate: '2026-01-16', sellPrice: 92.86, sellDate: '2026-01-21', sold: true, currency: 'USD' },
    { symbol: 'GLXY', name: 'Galaxy Digital (vendu)', color: '#ff9800', units: 1500, buyPrice: 34.01, buyDate: '2026-01-16', sellPrice: 31.10, sellDate: '2026-01-21', sold: true, currency: 'USD' },
    { symbol: 'RDW', name: 'Redwire Corp. (vendu)', color: '#e91e63', units: 5000, buyPrice: 10.90, buyDate: '2026-01-09', sellPrice: 10.21, sellDate: '2026-01-21', sold: true, currency: 'USD' },
    { symbol: 'LLY', name: 'Eli Lilly (vendu)', color: '#666666', units: 111, buyPrice: 1032.07, buyDate: '2025-11-17', sellPrice: 1050.00, sellDate: '2026-01-05', sold: true, currency: 'USD' },
    { symbol: 'RKLB', name: 'Rocket Lab (vendu)', color: '#777777', units: 2200, buyPrice: 57.60, buyDate: '2025-12-08', sellPrice: 76.91, sellDate: '2025-12-22', sold: true, currency: 'USD' },
    { symbol: 'AVGO', name: 'Broadcom (vendu)', color: '#888888', units: 150, buyPrice: 384.78, buyDate: '2025-11-25', sellPrice: 339.48, sellDate: '2025-12-22', sold: true, currency: 'USD' },
    { symbol: 'REGN', name: 'Regeneron (vendu)', color: '#999999', units: 75, buyPrice: 785.10, buyDate: '2025-11-25', sellPrice: 777.56, sellDate: '2025-12-22', sold: true, currency: 'USD' },
    { symbol: 'IDXX', name: 'IDEXX Labs (vendu)', color: '#aaaaaa', units: 65, buyPrice: 762.69, buyDate: '2025-11-25', sellPrice: 692.36, sellDate: '2025-12-22', sold: true, currency: 'USD' },
    { symbol: 'WDC', name: 'Western Digital (vendu)', color: '#bbbbbb', units: 400, buyPrice: 163.44, buyDate: '2025-11-28', sellPrice: 201.14, sellDate: '2026-01-07', sold: true, currency: 'USD' },
    { symbol: 'AMAT', name: 'Applied Materials (vendu)', color: '#8bc34a', units: 240, buyPrice: 251.98, buyDate: '2025-11-28', sellPrice: 290.32, sellDate: '2026-01-07', sold: true, currency: 'USD' },
    { symbol: 'HYMC', name: 'Hycroft Mining (vendu)', color: '#9c27b0', units: 2000, buyPrice: 27.73, buyDate: '2026-01-05', sellPrice: 27.53, sellDate: '2026-01-07', sold: true, currency: 'USD' },
    { symbol: 'HY9H.F', name: 'SK Hynix GDR (vendu)', color: '#cccccc', units: 100, buyPrice: 430, buyDate: '2026-01-06', sellPrice: 436.86, sellDate: '2026-01-07', sold: true, currency: 'EUR' },
    { symbol: 'SQM', name: 'SQM (vendu)', color: '#ff9800', units: 700, buyPrice: 81.83, buyDate: '2026-01-21', sellPrice: 80.17, sellDate: '2026-01-29', sold: true, currency: 'USD' },
    { symbol: 'ALKAL.PA', name: 'Kalray SA (vendu)', color: '#e91e63', units: 15000, buyPrice: 4.21, buyDate: '2026-01-23', sellPrice: 2.70, sellDate: '2026-01-28', sold: true, currency: 'EUR' },
    { symbol: 'HBM', name: 'Hudbay Minerals (vendu)', color: '#795548', units: 2500, buyPrice: 26.66, buyDate: '2026-01-27', sellPrice: 25.24, sellDate: '2026-02-12', sold: true, currency: 'USD' },
    { symbol: 'BNP.PA', name: 'BNP Paribas (vendu)', color: '#009688', units: 520, buyPrice: 93.93, buyDate: '2026-02-05', sellPrice: 92.16, sellDate: '2026-02-12', sold: true, currency: 'EUR' }
  ];

  // ETF vendus (historique) - courbes grises
  // Prix avec frais inclus - Symboles Yahoo Finance
  const soldETFs = [
    { symbol: 'CSPX.AS', name: 'iShares S&P 500 (vendu)', color: '#555555', units: 354, buyPrice: 596.23, buyDate: '2025-08-29', sellPrice: 628.41, sellDate: '2025-10-28', sold: true, currency: 'EUR' },
    { symbol: 'IWDA.AS', name: 'iShares MSCI World (vendu)', color: '#606060', units: 1424, buyPrice: 105.73, buyDate: '2025-08-29', sellPrice: 110.93, sellDate: '2025-10-28', sold: true, currency: 'EUR' },
    { symbol: 'EMIM.AS', name: 'iShares MSCI EM (vendu)', color: '#6b6b6b', units: 2567, buyPrice: 35.05, buyDate: '2025-08-29', sellPrice: 38.32, sellDate: '2025-10-28', sold: true, currency: 'EUR' },
    { symbol: 'SC0J.DE', name: 'Invesco MSCI World (vendu)', color: '#767676', units: 796, buyPrice: 113.52, buyDate: '2025-08-29', sellPrice: 119.04, sellDate: '2025-10-28', sold: true, currency: 'EUR' },
    { symbol: 'EQEU.DE', name: 'Invesco Nasdaq-100 (vendu)', color: '#818181', units: 144, buyPrice: 429.50, buyDate: '2025-09-19', sellPrice: 450.44, sellDate: '2025-10-28', sold: true, currency: 'EUR' },
    { symbol: 'G2X.DE', name: 'VanEck Gold Miners (vendu)', color: '#ffc107', units: 600, buyPrice: 81.62, buyDate: '2025-12-01', sellPrice: 85.44, sellDate: '2026-01-07', sold: true, currency: 'EUR' },
    { symbol: 'PHAG.L', name: 'WisdomTree Physical Silver (vendu)', color: '#c0c0c0', units: 900, buyPrice: 55.43, buyDate: '2025-12-29', sellPrice: 59.93, sellDate: '2026-01-07', sold: true, currency: 'EUR', convertFromUSD: true }
  ];

  // Tous les stocks pour affichage (actions + ETF vendus)
  const allStocks = [...stocks, ...soldStocks, ...soldETFs];

  const [combinedData, setCombinedData] = useState([]);
  const [oldPortfolioData, setOldPortfolioData] = useState([]);

  const periods = [
    { value: '1d', label: '1J' },
    { value: '5d', label: '5J' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' },
    { value: '5y', label: '5Y' }
  ];

  const isIntradayPeriod = ['1d', '5d'].includes(selectedPeriod);
  const isOneDayPeriod = selectedPeriod === '1d';

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fillMissingValues = (data) => {
    let lastValidPrice = null;
    return data.map(item => {
      if (item.price !== null && item.price !== undefined) {
        lastValidPrice = item.price;
        return item;
      } else if (lastValidPrice !== null) {
        return { ...item, price: lastValidPrice };
      }
      return item;
    }).filter(item => item.price !== null);
  };

  const calculatePerformance = (data) => {
    if (!data || data.length < 2) return null;
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    if (!firstPrice || !lastPrice) return null;
    return ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
  };

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

      // Récupérer le taux EUR/USD pour conversion
      let rate = eurUsdRate;
      if (!rate) {
        try {
          const fxResponse = await axios.get(`${apiBase}/api/finance/EURUSD=X`);
          const fxData = fxResponse.data.chart.result[0];
          rate = fxData.meta.regularMarketPrice;
          setEurUsdRate(rate);
          console.log(`Taux EUR/USD: ${rate}`);
        } catch (err) {
          console.error('Erreur taux EUR/USD:', err);
          rate = 1.04; // Taux par défaut
        }
      }

      // Récupérer l'historique USD/EUR pour le graphique (période sélectionnée)
      // ET sur 1Y pour les calculs de rendement EUR des actions vendues
      let usdEurByDateLocal = {};

      // D'abord récupérer 1Y pour avoir toutes les dates d'achat/vente
      try {
        const usdEurLongResponse = await axios.get(`${apiBase}/api/history/USDEUR=X/1y`);
        const usdEurLongResult = usdEurLongResponse.data.chart.result[0];
        const usdEurLongTimestamps = usdEurLongResult.timestamp;
        const usdEurLongPrices = usdEurLongResult.indicators.quote[0].close;

        usdEurLongTimestamps.forEach((timestamp, index) => {
          const date = new Date(timestamp * 1000);
          const dateStr = date.toLocaleDateString('fr-FR');
          const price = usdEurLongPrices[index] ? parseFloat(usdEurLongPrices[index].toFixed(4)) : null;
          if (price) {
            usdEurByDateLocal[dateStr] = price;
          }
        });
        console.log(`USD/EUR 1Y: ${Object.keys(usdEurByDateLocal).length} dates`);
      } catch (err) {
        console.error('Erreur historique USD/EUR 1Y:', err);
      }

      // Puis récupérer la période sélectionnée pour le graphique
      try {
        const usdEurResponse = await axios.get(`${apiBase}/api/history/USDEUR=X/${selectedPeriod}`);
        const usdEurResult = usdEurResponse.data.chart.result[0];
        const usdEurTimestamps = usdEurResult.timestamp;
        const usdEurPrices = usdEurResult.indicators.quote[0].close;

        const usdEurData = usdEurTimestamps.map((timestamp, index) => {
          const date = new Date(timestamp * 1000);
          const dateStr = date.toLocaleDateString('fr-FR');
          const price = usdEurPrices[index] ? parseFloat(usdEurPrices[index].toFixed(4)) : null;
          // Ajouter aussi au dictionnaire local
          if (price) {
            usdEurByDateLocal[dateStr] = price;
          }
          return {
            timestamp: timestamp,
            date: dateStr,
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            datetime: `${dateStr} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            price: price
          };
        }).filter(item => item.price !== null);

        setUsdEurHistory(usdEurData);
        setUsdEurByDate(usdEurByDateLocal); // Contient 1Y + période sélectionnée
        console.log(`USD/EUR historique: ${usdEurData.length} points (graphique), ${Object.keys(usdEurByDateLocal).length} dates (calculs)`);
      } catch (err) {
        console.error('Erreur historique USD/EUR:', err);
        // Même en cas d'erreur, sauvegarder les données 1Y si disponibles
        if (Object.keys(usdEurByDateLocal).length > 0) {
          setUsdEurByDate(usdEurByDateLocal);
        }
      }

      const promises = allStocks.map(async (stock) => {
        try {
          const ticker = stock.yahooTicker || stock.symbol;
          const url = `${apiBase}/api/history/${ticker}/${selectedPeriod}`;
          console.log(`Fetching ${stock.symbol} (${ticker}) from ${url}`);
          const response = await axios.get(url);

          const result = response.data.chart.result[0];
          const timestamps = result.timestamp;
          const prices = result.indicators.quote[0].close;

          // Dernier taux connu pour fallback
          let lastKnownRate = rate;

          const data = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            const dateStr = date.toLocaleDateString('fr-FR');
            let price = prices[index] ? parseFloat(prices[index].toFixed(2)) : null;

            // Conversion USD -> EUR pour PHAG.L avec taux historique
            if (stock.convertFromUSD && price) {
              const historicalRate = usdEurByDate[dateStr] || lastKnownRate;
              if (historicalRate) {
                lastKnownRate = historicalRate;
                price = parseFloat((price * historicalRate).toFixed(2));
              }
            }
            return {
              timestamp: timestamp,
              date: dateStr,
              time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              datetime: `${dateStr} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              price: price
            };
          });

          const filledData = fillMissingValues(data);

          return {
            symbol: stock.symbol,
            name: stock.name,
            color: stock.color,
            units: stock.units,
            data: filledData
          };
        } catch (err) {
          console.error(`Erreur pour ${stock.symbol}:`, err);
          return {
            symbol: stock.symbol,
            name: stock.name,
            color: stock.color,
            units: stock.units,
            data: [],
            error: 'Erreur de chargement'
          };
        }
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(result => {
        dataMap[result.symbol] = result;
      });
      setChartsData(dataMap);
      calculatePortfolioTotal(results);
      calculateCombinedPerformance(results);
      setError(null);
    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Impossible de charger les données historiques');
    } finally {
      setLoading(false);
    }
  };

  // Actions actives uniquement (non vendues) pour le total portefeuille
  const activeStocks = stocks.filter(s => !s.sold);

  const calculatePortfolioTotal = (results) => {
    const allTimestamps = new Set();
    results.forEach(result => {
      result.data.forEach(item => {
        allTimestamps.add(item.timestamp);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const lastKnownPrices = {};
    activeStocks.forEach(stock => {
      lastKnownPrices[stock.symbol] = null;
    });

    const portfolioValues = sortedTimestamps.map(timestamp => {
      let totalValue = 0;
      let allStocksHaveValue = true;

      results.forEach(result => {
        const stockData = activeStocks.find(s => s.symbol === result.symbol);
        if (!stockData) return;

        const priceData = result.data.find(item => item.timestamp === timestamp);

        if (priceData && priceData.price) {
          lastKnownPrices[result.symbol] = priceData.price;
          totalValue += priceData.price * stockData.units;
        } else if (lastKnownPrices[result.symbol] !== null) {
          totalValue += lastKnownPrices[result.symbol] * stockData.units;
        } else {
          allStocksHaveValue = false;
        }
      });

      if (allStocksHaveValue && totalValue > 0) {
        const date = new Date(timestamp * 1000);
        return {
          date: date.toLocaleDateString('fr-FR'),
          time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          datetime: `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          value: parseFloat(totalValue.toFixed(2))
        };
      }
      return null;
    }).filter(item => item !== null);

    setPortfolioData(portfolioValues);

    // Calcul de l'ancien portefeuille (toutes les actions incluant vendues)
    const oldLastKnownPrices = {};
    stocks.forEach(stock => {
      oldLastKnownPrices[stock.symbol] = null;
    });

    const oldPortfolioValues = sortedTimestamps.map(timestamp => {
      let totalValue = 0;
      let allHaveValue = true;

      results.forEach(result => {
        const stockData = stocks.find(s => s.symbol === result.symbol);
        if (!stockData) return;

        const priceData = result.data.find(item => item.timestamp === timestamp);

        if (priceData && priceData.price) {
          oldLastKnownPrices[result.symbol] = priceData.price;
          totalValue += priceData.price * stockData.units;
        } else if (oldLastKnownPrices[result.symbol] !== null) {
          totalValue += oldLastKnownPrices[result.symbol] * stockData.units;
        } else {
          allHaveValue = false;
        }
      });

      if (allHaveValue && totalValue > 0) {
        const date = new Date(timestamp * 1000);
        return {
          date: date.toLocaleDateString('fr-FR'),
          time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          datetime: `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          value: parseFloat(totalValue.toFixed(2))
        };
      }
      return null;
    }).filter(item => item !== null);

    setOldPortfolioData(oldPortfolioValues);
  };

  // Calcul des performances combinées (normalisées en % depuis date d'achat)
  const calculateCombinedPerformance = (results) => {
    // Utiliser uniquement les dates (pas les timestamps exacts) pour éviter les problèmes d'alignement
    const allDates = new Set();
    const pricesByDate = {};

    // Collecter tous les prix par date pour chaque action
    results.forEach(result => {
      pricesByDate[result.symbol] = {};
      result.data.forEach(item => {
        allDates.add(item.date);
        // Garder le dernier prix de la journée
        pricesByDate[result.symbol][item.date] = item.price;
      });
    });

    // Trier les dates chronologiquement
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    // Convertir les dates d'achat et de vente en format fr-FR
    // Les stocks dans stocks[] avec sold: true gardent leur courbe (suivi continu)
    const stockSymbols = new Set(stocks.map(s => s.symbol));
    const buyDatesStr = {};
    const sellDatesStr = {};
    allStocks.forEach(stock => {
      const [year, month, day] = stock.buyDate.split('-');
      buyDatesStr[stock.symbol] = `${day}/${month}/${year}`;
      // Ne couper la courbe que pour soldStocks/soldETFs, pas pour stocks[] avec sold: true
      if (stock.sellDate && !stockSymbols.has(stock.symbol)) {
        const [sYear, sMonth, sDay] = stock.sellDate.split('-');
        sellDatesStr[stock.symbol] = `${sDay}/${sMonth}/${sYear}`;
      }
    });

    // Tracker le dernier prix connu et si on a dépassé la date d'achat
    const lastKnownPrices = {};
    const hasStarted = {};
    const hasSold = {};
    allStocks.forEach(stock => {
      lastKnownPrices[stock.symbol] = null;
      hasStarted[stock.symbol] = false;
      hasSold[stock.symbol] = false;
    });

    const combined = sortedDates.map(dateStr => {
      const dataPoint = {
        date: dateStr
      };

      allStocks.forEach(stock => {
        // Mettre à jour le dernier prix connu si on a un prix pour cette date
        if (pricesByDate[stock.symbol] && pricesByDate[stock.symbol][dateStr]) {
          lastKnownPrices[stock.symbol] = pricesByDate[stock.symbol][dateStr];
        }

        // Vérifier si on a atteint ou dépassé la date d'achat
        const [day, month, year] = dateStr.split('/');
        const currentDate = new Date(year, month - 1, day);

        const [buyDay, buyMonth, buyYear] = buyDatesStr[stock.symbol].split('/');
        const buyDate = new Date(buyYear, buyMonth - 1, buyDay);

        if (currentDate >= buyDate) {
          hasStarted[stock.symbol] = true;
        }

        // Vérifier si on a dépassé la date de vente (pour les actions vendues)
        if (sellDatesStr[stock.symbol]) {
          const [sellDay, sellMonth, sellYear] = sellDatesStr[stock.symbol].split('/');
          const sellDate = new Date(sellYear, sellMonth - 1, sellDay);
          if (currentDate > sellDate) {
            hasSold[stock.symbol] = true;
          }
        }

        const currentPrice = lastKnownPrices[stock.symbol];
        const buyPrice = stock.buyPrice;

        // Calculer le % par rapport au prix d'achat (arrêter après la vente)
        if (currentPrice && buyPrice && hasStarted[stock.symbol] && !hasSold[stock.symbol]) {
          const perf = parseFloat(((currentPrice - buyPrice) / buyPrice * 100).toFixed(2));
          dataPoint[stock.symbol] = perf;
        }
      });

      return dataPoint;
    }).filter(item => {
      return allStocks.some(stock => item[stock.symbol] !== undefined);
    });

    setCombinedData(combined);
  };

  // Récupérer le taux USD/EUR à une date donnée (format YYYY-MM-DD)
  const getFxRate = (dateYMD) => {
    if (!dateYMD || Object.keys(usdEurByDate).length === 0) return null;
    const [year, month, day] = dateYMD.split('-');
    const dateStr = `${day}/${month}/${year}`;
    // Chercher le taux exact ou le plus proche
    if (usdEurByDate[dateStr]) return usdEurByDate[dateStr];
    // Si pas trouvé, chercher dans les jours précédents (weekend/jours fériés)
    const dates = Object.keys(usdEurByDate).sort((a, b) => {
      const [dA, mA, yA] = a.split('/');
      const [dB, mB, yB] = b.split('/');
      return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
    });
    const targetDate = new Date(year, month - 1, day);
    let closestRate = null;
    for (const d of dates) {
      const [dd, mm, yy] = d.split('/');
      const dDate = new Date(yy, mm - 1, dd);
      if (dDate <= targetDate) {
        closestRate = usdEurByDate[d];
      }
    }
    return closestRate;
  };

  // Trouver le point d'achat dans les données du graphique
  const findBuyPoint = (chartData, buyDate, buyPrice) => {
    if (!chartData || chartData.length === 0) return null;

    // Convertir sans parsing Date pour éviter timezone issues
    const [year, month, day] = buyDate.split('-');
    const buyDateStr = `${day}/${month}/${year}`;

    // Chercher le point le plus proche de la date d'achat
    const buyPoint = chartData.find(item => item.date === buyDateStr);

    if (buyPoint) {
      return { date: buyPoint.date, datetime: buyPoint.datetime, price: buyPrice };
    }
    return null;
  };

  // Trouver le point de vente dans les données du graphique
  const findSellPoint = (chartData, sellDate, sellPrice) => {
    if (!chartData || chartData.length === 0 || !sellDate) return null;

    const [year, month, day] = sellDate.split('-');
    const sellDateStr = `${day}/${month}/${year}`;

    const sellPoint = chartData.find(item => item.date === sellDateStr);

    if (sellPoint) {
      return { date: sellPoint.date, datetime: sellPoint.datetime, price: sellPrice };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="charts-container">
        <h1>Graphiques Portfolio ChL</h1>
        <p>Chargement des données historiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <h1>Graphiques Portfolio ChL</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="nav-buttons">
        <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        <button onClick={() => navigate('/chl')} className="nav-button">Portfolio</button>
      </div>

      <div className="header-controls">
        <div className="period-selector">
          {periods.map((period) => (
            <button
              key={period.value}
              className={`period-button ${selectedPeriod === period.value ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique du portefeuille total */}
      {portfolioData.length > 0 && (
        <div className="chart-section portfolio-total-section">
          <h2>
            Portfolio ChL (USD)
            {(() => {
              // Calcul du rendement total depuis achat
              const totalBuyValue = activeStocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.units), 0);
              const lastValue = portfolioData[portfolioData.length - 1]?.value || 0;
              const totalPerf = ((lastValue - totalBuyValue) / totalBuyValue * 100).toFixed(2);
              const perfNum = parseFloat(totalPerf);
              const perfAmount = lastValue - totalBuyValue;
              return (
                <span style={{ float: 'right', textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#f44336' }}>
                    Rendement depuis achat: {perfNum >= 0 ? '+' : ''}{totalPerf}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: perfNum >= 0 ? '#4caf50' : '#f44336', marginTop: '2px' }}>
                    {perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </span>
              );
            })()}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis
                dataKey={isIntradayPeriod ? "datetime" : "date"}
                stroke="#9fa3a8"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => {
                  if (isOneDayPeriod) {
                    const parts = value.split(' ');
                    return parts[1] || value;
                  }
                  const tickInterval = Math.floor(portfolioData.length / 6);
                  if (index % tickInterval === 0 || index === portfolioData.length - 1) {
                    return isIntradayPeriod ? value.split(' ')[0] : value;
                  }
                  return '';
                }}
              />
              <YAxis stroke="#9fa3a8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #61dafb', borderRadius: '4px' }}
                labelStyle={{ color: '#61dafb' }}
                itemStyle={{ color: '#61dafb' }}
                formatter={(value) => [`${value.toLocaleString('fr-FR')} USD`, 'Valeur']}
              />
              <Line type="monotone" dataKey="value" stroke="#61dafb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Graphique Old Portfolio (toutes les actions incluant vendues) */}
      {oldPortfolioData.length > 0 && (
        <div className="chart-section portfolio-total-section" style={{ borderLeft: '3px solid #ff9800' }}>
          <h2 style={{ color: '#9fa3a8' }}>
            Old Portfolio ChL (USD)
            {(() => {
              const totalBuyValue = stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.units), 0);
              const lastValue = oldPortfolioData[oldPortfolioData.length - 1]?.value || 0;
              const totalPerf = ((lastValue - totalBuyValue) / totalBuyValue * 100).toFixed(2);
              const perfNum = parseFloat(totalPerf);
              const perfAmount = lastValue - totalBuyValue;
              return (
                <span style={{ float: 'right', textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#f44336' }}>
                    Rendement depuis achat: {perfNum >= 0 ? '+' : ''}{totalPerf}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: perfNum >= 0 ? '#4caf50' : '#f44336', marginTop: '2px' }}>
                    {perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </span>
              );
            })()}
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#9fa3a8', marginBottom: '10px' }}>
            Suivi si les positions vendues avaient été conservées
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={oldPortfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis
                dataKey={isIntradayPeriod ? "datetime" : "date"}
                stroke="#9fa3a8"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => {
                  if (isOneDayPeriod) {
                    const parts = value.split(' ');
                    return parts[1] || value;
                  }
                  const tickInterval = Math.floor(oldPortfolioData.length / 6);
                  if (index % tickInterval === 0 || index === oldPortfolioData.length - 1) {
                    return isIntradayPeriod ? value.split(' ')[0] : value;
                  }
                  return '';
                }}
              />
              <YAxis stroke="#9fa3a8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #ff9800', borderRadius: '4px' }}
                labelStyle={{ color: '#ff9800' }}
                itemStyle={{ color: '#ff9800' }}
                formatter={(value) => [`${value.toLocaleString('fr-FR')} USD`, 'Valeur']}
              />
              <Line type="monotone" dataKey="value" stroke="#ff9800" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Graphique combiné - Toutes les actions en % depuis achat */}
      {combinedData.length > 0 && (
        <div className="chart-section portfolio-total-section">
          <h2>Performance depuis achat (%)</h2>
          {/* Affichage des performances finales - Actions actuelles + suivi post-vente */}
          <div style={{ fontSize: '0.75rem', marginBottom: '5px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {stocks.map(stock => {
              const lastPoint = combinedData[combinedData.length - 1];
              const perf = lastPoint ? lastPoint[stock.symbol] : null;
              return perf !== undefined && perf !== null ? (
                <span key={stock.symbol} style={{ color: perf >= 0 ? '#4caf50' : '#f44336', opacity: stock.sold ? 0.6 : 1 }}>
                  {stock.symbol}{stock.sold ? '*' : ''}: {perf >= 0 ? '+' : ''}{perf}%
                </span>
              ) : null;
            })}
          </div>
          {/* Affichage des performances - Actions USD vendues (historique) */}
          <div style={{ fontSize: '0.7rem', marginBottom: '5px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', opacity: 0.7 }}>
            {soldStocks.map(stock => {
              // Pour les actions vendues en USD, calculer la perf USD et EUR
              const perfUSD = (stock.sellPrice - stock.buyPrice) / stock.buyPrice;
              const perfAtSellUSD = (perfUSD * 100).toFixed(1);
              // Récupérer les taux USD/EUR aux dates d'achat et de vente
              const fxBuy = getFxRate(stock.buyDate);
              const fxSell = getFxRate(stock.sellDate);
              // Rendement EUR = (1 + Rendement USD) × (Taux vente / Taux achat) - 1
              const perfEUR = fxBuy && fxSell ? (1 + perfUSD) * (fxSell / fxBuy) - 1 : null;
              const perfAtSellEUR = perfEUR !== null ? (perfEUR * 100).toFixed(1) : 'N/A';
              return (
                <span key={stock.symbol} style={{ color: perfEUR !== null && perfEUR >= 0 ? '#4caf50' : '#f44336' }}>
                  {stock.symbol}: {perfUSD >= 0 ? '+' : ''}{perfAtSellUSD}% ({perfEUR !== null && perfEUR >= 0 ? '+' : ''}{perfAtSellEUR}% EUR)
                </span>
              );
            })}
          </div>
          {/* Affichage des performances - ETF EUR vendus (historique) */}
          <div style={{ fontSize: '0.7rem', marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', opacity: 0.7 }}>
            {soldETFs.map(etf => {
              // Pour les ETF en EUR, pas de conversion
              const perfEUR = (etf.sellPrice - etf.buyPrice) / etf.buyPrice;
              const perfAtSellEUR = (perfEUR * 100).toFixed(1);
              return (
                <span key={etf.symbol} style={{ color: perfEUR >= 0 ? '#4caf50' : '#f44336' }}>
                  {etf.symbol}: {perfEUR >= 0 ? '+' : ''}{perfAtSellEUR}% EUR
                </span>
              );
            })}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis
                dataKey={isIntradayPeriod ? "datetime" : "date"}
                stroke="#9fa3a8"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#9fa3a8"
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #61dafb', borderRadius: '4px' }}
                labelStyle={{ color: '#61dafb' }}
                formatter={(value, name) => {
                  if (value !== null && value !== undefined) {
                    const color = value >= 0 ? '#4caf50' : '#f44336';
                    const soldStock = soldStocks.find(s => s.symbol === name);
                    const suffix = soldStock ? ' (vendu)' : '';
                    return [<span style={{ color }}>{value >= 0 ? '+' : ''}{value}%{suffix}</span>, name];
                  }
                  return [null, null];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {/* Actions actuelles - lignes pleines */}
              {stocks.map((stock) => {
                const [year, month, day] = stock.buyDate.split('-');
                const buyDateStr = `${day}/${month}/${year}`;

                return (
                  <Line
                    key={stock.symbol}
                    type="monotone"
                    dataKey={stock.symbol}
                    stroke={stock.color}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (payload.date === buyDateStr && payload[stock.symbol] !== undefined) {
                        return (
                          <circle
                            key={`buy-${stock.symbol}`}
                            cx={cx}
                            cy={cy}
                            r={5}
                            fill="#ffeb3b"
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }
                      return null;
                    }}
                    name={stock.symbol}
                    connectNulls={false}
                  />
                );
              })}
              {/* Actions vendues - lignes pointillées grises */}
              {soldStocks.map((stock) => {
                const [year, month, day] = stock.buyDate.split('-');
                const buyDateStr = `${day}/${month}/${year}`;
                const [sYear, sMonth, sDay] = stock.sellDate.split('-');
                const sellDateStr = `${sDay}/${sMonth}/${sYear}`;

                return (
                  <Line
                    key={stock.symbol}
                    type="monotone"
                    dataKey={stock.symbol}
                    stroke={stock.color}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      // Point d'achat jaune
                      if (payload.date === buyDateStr && payload[stock.symbol] !== undefined) {
                        return (
                          <circle
                            key={`buy-${stock.symbol}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="#ffeb3b"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                        );
                      }
                      // Point de vente rouge
                      if (payload.date === sellDateStr && payload[stock.symbol] !== undefined) {
                        return (
                          <circle
                            key={`sell-${stock.symbol}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="#f44336"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                          />
                        );
                      }
                      return null;
                    }}
                    name={stock.symbol}
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Graphiques individuels */}
      {stocks.map((stock) => {
        const chartData = chartsData[stock.symbol];
        if (!chartData || chartData.error || chartData.data.length === 0) {
          return (
            <div key={stock.symbol} className="chart-section">
              <h2>{stock.name} ({stock.symbol})</h2>
              <p className="error">Données non disponibles</p>
            </div>
          );
        }

        // Trouver le point d'achat dans les données
        const buyPoint = findBuyPoint(chartData.data, stock.buyDate, stock.buyPrice);
        const sellPoint = stock.sold ? findSellPoint(chartData.data, stock.sellDate, stock.sellPrice) : null;

        // Ajouter les points d'achat et de vente aux données
        const dataWithPoints = chartData.data.map(item => ({
          ...item,
          buyPrice: buyPoint && item.date === buyPoint.date ? stock.buyPrice : null,
          sellPrice: sellPoint && item.date === sellPoint.date ? stock.sellPrice : null
        }));

        return (
          <div key={stock.symbol} className="chart-section" style={stock.sold ? { opacity: 0.8, borderLeft: '3px solid #ff9800' } : {}}>
            <h2 style={stock.sold ? { color: '#9fa3a8' } : {}}>
              {stock.name} {stock.sold && <span style={{ fontSize: '0.7rem', color: '#ff9800' }}>VENDU</span>} (
              <a href={`https://finance.yahoo.com/quote/${stock.symbol}/analysis/`} target="_blank" rel="noopener noreferrer" className="etf-chart-link">
                {stock.symbol}
              </a>
              )
              {(() => {
                const perf = calculatePerformance(chartData.data);
                if (perf !== null && chartData.data.length > 0) {
                  const perfNum = parseFloat(perf);
                  const firstPrice = chartData.data[0].price;
                  const lastPrice = chartData.data[chartData.data.length - 1].price;
                  const perfAmount = (lastPrice - firstPrice) * stock.units;
                  return (
                    <span style={{ float: 'right', textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b' }}>
                        {perfNum >= 0 ? '+' : ''}{perf}%
                      </div>
                      <div style={{ fontSize: '0.85rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b', marginTop: '2px' }}>
                        {perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    </span>
                  );
                }
                return null;
              })()}
            </h2>
            {(() => {
              const lastPrice = chartData.data[chartData.data.length - 1]?.price;
              const totalPerf = lastPrice ? ((lastPrice - stock.buyPrice) / stock.buyPrice * 100).toFixed(2) : null;
              return (
                <div style={{ fontSize: '0.75rem', color: '#9fa3a8', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Achat: {stock.buyDate.split('-').reverse().join('/')} @ {stock.buyPrice.toLocaleString('fr-FR')} {stock.currency || 'USD'}</span>
                  {stock.sold && (
                    <span style={{ color: '#ff9800' }}>Vente: {stock.sellDate.split('-').reverse().join('/')} @ {stock.sellPrice.toLocaleString('fr-FR')} {stock.currency || 'USD'}</span>
                  )}
                  {totalPerf && (
                    <span style={{ color: parseFloat(totalPerf) >= 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                      Rendement depuis achat: {parseFloat(totalPerf) >= 0 ? '+' : ''}{totalPerf}%
                    </span>
                  )}
                </div>
              );
            })()}
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dataWithPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
                <XAxis
                  dataKey={isIntradayPeriod ? "datetime" : "date"}
                  stroke="#9fa3a8"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => {
                    if (isOneDayPeriod) {
                      const parts = value.split(' ');
                      return parts[1] || value;
                    }
                    const tickInterval = Math.floor(chartData.data.length / 6);
                    if (index % tickInterval === 0 || index === chartData.data.length - 1) {
                      return isIntradayPeriod ? value.split(' ')[0] : value;
                    }
                    return '';
                  }}
                />
                <YAxis stroke="#9fa3a8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #61dafb', borderRadius: '4px' }}
                  labelStyle={{ color: '#61dafb' }}
                  itemStyle={{ color: stock.color }}
                  formatter={(value, name) => {
                    if (name === 'buyPrice' && value) {
                      return [`${value.toLocaleString('fr-FR')} ${stock.currency || 'USD'}`, 'Prix achat'];
                    }
                    if (name === 'sellPrice' && value) {
                      return [`${value.toLocaleString('fr-FR')} ${stock.currency || 'USD'}`, 'Prix vente'];
                    }
                    return [`${value?.toLocaleString('fr-FR')} ${stock.currency || 'USD'}`, 'Prix'];
                  }}
                />
                <Line type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} dot={false} name="Prix" />
                {buyPoint && (
                  <Line
                    type="monotone"
                    dataKey="buyPrice"
                    stroke="#ffffff"
                    strokeWidth={0}
                    dot={{ r: 6, fill: '#ffeb3b', stroke: '#ffffff', strokeWidth: 2 }}
                    name="buyPrice"
                    isAnimationActive={false}
                  />
                )}
                {sellPoint && (
                  <Line
                    type="monotone"
                    dataKey="sellPrice"
                    stroke="#ffffff"
                    strokeWidth={0}
                    dot={{ r: 6, fill: '#f44336', stroke: '#ffffff', strokeWidth: 2 }}
                    name="sellPrice"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}

      {/* Section séparateur pour les actions vendues */}
      {soldStocks.length > 0 && (
        <div style={{ margin: '30px 0', padding: '15px', backgroundColor: '#1a1d21', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#9fa3a8', margin: 0 }}>Historique des actions vendues</h3>
          <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0 0' }}>
            Courbes grises avec points d'achat (jaune) et de vente (rouge)
          </p>
        </div>
      )}

      {/* Graphiques individuels - Actions vendues */}
      {soldStocks.map((stock, idx) => {
        const chartData = chartsData[stock.symbol];
        if (!chartData || chartData.error || chartData.data.length === 0) {
          return (
            <div key={`${stock.symbol}-${idx}`} className="chart-section" style={{ opacity: 0.7, borderLeft: '3px solid #666' }}>
              <h2 style={{ color: '#9fa3a8' }}>{stock.name} ({stock.symbol})</h2>
              <p className="error">Données non disponibles</p>
            </div>
          );
        }

        // Trouver les points d'achat et de vente
        const buyPoint = findBuyPoint(chartData.data, stock.buyDate, stock.buyPrice);
        const sellPoint = findSellPoint(chartData.data, stock.sellDate, stock.sellPrice);

        // Ajouter les points d'achat et de vente aux données
        const dataWithPoints = chartData.data.map(item => ({
          ...item,
          buyPrice: buyPoint && item.date === buyPoint.date ? stock.buyPrice : null,
          sellPrice: sellPoint && item.date === sellPoint.date ? stock.sellPrice : null
        }));

        // Calculer la performance à la vente (USD et EUR)
        const perfUSD = (stock.sellPrice - stock.buyPrice) / stock.buyPrice;
        const perfAtSellUSD = (perfUSD * 100).toFixed(2);
        const profitLossUSD = (stock.sellPrice - stock.buyPrice) * stock.units;

        // Récupérer les taux USD/EUR aux dates d'achat et de vente
        const fxBuy = getFxRate(stock.buyDate);
        const fxSell = getFxRate(stock.sellDate);
        // Rendement EUR = (1 + Rendement USD) × (Taux vente / Taux achat) - 1
        const perfEUR = fxBuy && fxSell ? (1 + perfUSD) * (fxSell / fxBuy) - 1 : null;
        const perfAtSellEUR = perfEUR !== null ? (perfEUR * 100).toFixed(2) : 'N/A';
        // Montant EUR = (vente × taux vente) - (achat × taux achat)
        const profitLossEUR = fxBuy && fxSell ? (stock.sellPrice * stock.units * fxSell) - (stock.buyPrice * stock.units * fxBuy) : null;

        return (
          <div key={`${stock.symbol}-${idx}`} className="chart-section" style={{ opacity: 0.8, borderLeft: '3px solid #666' }}>
            <h2 style={{ color: '#9fa3a8' }}>
              {stock.name} (
              <a href={`https://finance.yahoo.com/quote/${stock.symbol}/`} target="_blank" rel="noopener noreferrer" className="etf-chart-link" style={{ color: '#888' }}>
                {stock.symbol}
              </a>
              )
              <span style={{ float: 'right', textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', color: perfEUR !== null && perfEUR >= 0 ? '#4caf50' : '#f44336' }}>
                  {perfUSD >= 0 ? '+' : ''}{perfAtSellUSD}% ({perfEUR !== null && perfEUR >= 0 ? '+' : ''}{perfAtSellEUR}% EUR)
                </div>
                <div style={{ fontSize: '0.85rem', color: perfEUR !== null && perfEUR >= 0 ? '#4caf50' : '#f44336', marginTop: '2px' }}>
                  {profitLossUSD >= 0 ? '+' : ''}{profitLossUSD.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD ({profitLossEUR !== null ? (profitLossEUR >= 0 ? '+' : '') + profitLossEUR.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'N/A'} EUR)
                </div>
              </span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Achat: {stock.buyDate.split('-').reverse().join('/')} @ {stock.buyPrice.toLocaleString('fr-FR')} USD</span>
              <span style={{ color: '#f44336' }}>Vente: {stock.sellDate.split('-').reverse().join('/')} @ {stock.sellPrice.toLocaleString('fr-FR')} USD</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataWithPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f37" />
                <XAxis
                  dataKey={isIntradayPeriod ? "datetime" : "date"}
                  stroke="#666"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => {
                    if (isOneDayPeriod) {
                      const parts = value.split(' ');
                      return parts[1] || value;
                    }
                    const tickInterval = Math.floor(chartData.data.length / 6);
                    if (index % tickInterval === 0 || index === chartData.data.length - 1) {
                      return isIntradayPeriod ? value.split(' ')[0] : value;
                    }
                    return '';
                  }}
                />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #666', borderRadius: '4px' }}
                  labelStyle={{ color: '#9fa3a8' }}
                  itemStyle={{ color: stock.color }}
                  formatter={(value, name) => {
                    if (name === 'buyPrice' && value) {
                      return [`${value.toLocaleString('fr-FR')} USD`, 'Prix achat'];
                    }
                    if (name === 'sellPrice' && value) {
                      return [`${value.toLocaleString('fr-FR')} USD`, 'Prix vente'];
                    }
                    return [`${value?.toLocaleString('fr-FR')} USD`, 'Prix'];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={stock.color}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Prix"
                />
                {/* Point d'achat - jaune */}
                {buyPoint && (
                  <Line
                    type="monotone"
                    dataKey="buyPrice"
                    stroke="#ffffff"
                    strokeWidth={0}
                    dot={{ r: 6, fill: '#ffeb3b', stroke: '#ffffff', strokeWidth: 2 }}
                    name="buyPrice"
                    isAnimationActive={false}
                  />
                )}
                {/* Point de vente - rouge */}
                {sellPoint && (
                  <Line
                    type="monotone"
                    dataKey="sellPrice"
                    stroke="#ffffff"
                    strokeWidth={0}
                    dot={{ r: 6, fill: '#f44336', stroke: '#ffffff', strokeWidth: 2 }}
                    name="sellPrice"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}

      {/* Section séparateur pour les ETF vendus */}
      {soldETFs.length > 0 && (
        <div style={{ margin: '30px 0', padding: '15px', backgroundColor: '#1a1d21', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ color: '#9fa3a8', margin: 0 }}>Historique des ETF vendus</h3>
          <p style={{ color: '#666', fontSize: '0.8rem', margin: '5px 0 0 0' }}>
            ETF en EUR - achetés août 2025, vendus octobre 2025
          </p>
        </div>
      )}

      {/* Graphiques individuels - ETF vendus */}
      {soldETFs.map((etf) => {
        const chartData = chartsData[etf.symbol];
        if (!chartData || chartData.error || chartData.data.length === 0) {
          return (
            <div key={etf.symbol} className="chart-section" style={{ opacity: 0.7, borderLeft: '3px solid #555' }}>
              <h2 style={{ color: '#9fa3a8' }}>{etf.name} ({etf.symbol})</h2>
              <p className="error">Données non disponibles</p>
            </div>
          );
        }

        // Trouver les points d'achat et de vente
        const buyPoint = findBuyPoint(chartData.data, etf.buyDate, etf.buyPrice);
        const sellPoint = findSellPoint(chartData.data, etf.sellDate, etf.sellPrice);

        // Ajouter les points d'achat et de vente aux données
        const dataWithPoints = chartData.data.map(item => ({
          ...item,
          buyPrice: buyPoint && item.date === buyPoint.date ? etf.buyPrice : null,
          sellPrice: sellPoint && item.date === sellPoint.date ? etf.sellPrice : null
        }));

        // Calculer la performance à la vente (EUR seulement)
        const perfEUR = (etf.sellPrice - etf.buyPrice) / etf.buyPrice;
        const perfAtSellEUR = (perfEUR * 100).toFixed(2);
        const profitLossEUR = (etf.sellPrice - etf.buyPrice) * etf.units;

        return (
          <div key={etf.symbol} className="chart-section" style={{ opacity: 0.8, borderLeft: '3px solid #555' }}>
            <h2 style={{ color: '#9fa3a8' }}>
              {etf.name} (
              <a href={`https://finance.yahoo.com/quote/${etf.symbol}/`} target="_blank" rel="noopener noreferrer" className="etf-chart-link" style={{ color: '#888' }}>
                {etf.symbol}
              </a>
              )
              <span style={{ float: 'right', textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', color: perfEUR >= 0 ? '#4caf50' : '#f44336' }}>
                  {perfEUR >= 0 ? '+' : ''}{perfAtSellEUR}% EUR
                </div>
                <div style={{ fontSize: '0.85rem', color: perfEUR >= 0 ? '#4caf50' : '#f44336', marginTop: '2px' }}>
                  {profitLossEUR >= 0 ? '+' : ''}{profitLossEUR.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EUR
                </div>
              </span>
            </h2>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Achat: {etf.buyDate.split('-').reverse().join('/')} @ {etf.buyPrice.toLocaleString('fr-FR')} EUR</span>
              <span style={{ color: '#f44336' }}>Vente: {etf.sellDate.split('-').reverse().join('/')} @ {etf.sellPrice.toLocaleString('fr-FR')} EUR</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dataWithPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f37" />
                <XAxis
                  dataKey={isIntradayPeriod ? "datetime" : "date"}
                  stroke="#666"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => {
                    if (isOneDayPeriod) {
                      const parts = value.split(' ');
                      return parts[1] || value;
                    }
                    const tickInterval = Math.floor(chartData.data.length / 6);
                    if (index % tickInterval === 0 || index === chartData.data.length - 1) {
                      return isIntradayPeriod ? value.split(' ')[0] : value;
                    }
                    return '';
                  }}
                />
                <YAxis stroke="#666" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #666', borderRadius: '4px' }}
                  labelStyle={{ color: '#9fa3a8' }}
                  itemStyle={{ color: etf.color }}
                  formatter={(value, name) => {
                    if (name === 'buyPrice' && value) {
                      return [`${value.toLocaleString('fr-FR')} EUR`, 'Prix achat'];
                    }
                    if (name === 'sellPrice' && value) {
                      return [`${value.toLocaleString('fr-FR')} EUR`, 'Prix vente'];
                    }
                    return [`${value?.toLocaleString('fr-FR')} EUR`, 'Prix'];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={etf.color}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Prix"
                />
                {/* Point d'achat - jaune */}
                {buyPoint && (
                  <Line
                    type="monotone"
                    dataKey="buyPrice"
                    stroke="#ffffff"
                    strokeWidth={0}
                    dot={{ r: 6, fill: '#ffeb3b', stroke: '#ffffff', strokeWidth: 2 }}
                    name="buyPrice"
                    isAnimationActive={false}
                  />
                )}
                {/* Point de vente - rouge */}
                {sellPoint && (
                  <Line
                    type="monotone"
                    dataKey="sellPrice"
                    stroke="#ffffff"
                    strokeWidth={0}
                    dot={{ r: 6, fill: '#f44336', stroke: '#ffffff', strokeWidth: 2 }}
                    name="sellPrice"
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}

      {/* Graphique USD/EUR */}
      {usdEurHistory.length > 0 && (
        <div className="chart-section">
          <h2>
            <a href="https://finance.yahoo.com/quote/USDEUR=X/" target="_blank" rel="noopener noreferrer" className="etf-chart-link">
              USD/EUR
            </a>
            {(() => {
              const firstPrice = usdEurHistory[0]?.price;
              const lastPrice = usdEurHistory[usdEurHistory.length - 1]?.price;
              if (firstPrice && lastPrice) {
                const perf = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
                const perfNum = parseFloat(perf);
                return (
                  <span style={{ float: 'right', textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#f44336' }}>
                      {perfNum >= 0 ? '+' : ''}{perf}%
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#9fa3a8', marginTop: '2px' }}>
                      {lastPrice.toFixed(4)} EUR
                    </div>
                  </span>
                );
              }
              return null;
            })()}
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#9fa3a8', marginBottom: '10px' }}>
            Évolution du dollar US en euro (1 USD = x EUR)
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={usdEurHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis
                dataKey={isIntradayPeriod ? "datetime" : "date"}
                stroke="#9fa3a8"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => {
                  if (isOneDayPeriod) {
                    const parts = value.split(' ');
                    return parts[1] || value;
                  }
                  const tickInterval = Math.floor(usdEurHistory.length / 6);
                  if (index % tickInterval === 0 || index === usdEurHistory.length - 1) {
                    return isIntradayPeriod ? value.split(' ')[0] : value;
                  }
                  return '';
                }}
              />
              <YAxis stroke="#9fa3a8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #61dafb', borderRadius: '4px' }}
                labelStyle={{ color: '#61dafb' }}
                itemStyle={{ color: '#e91e63' }}
                formatter={(value) => [`${value.toFixed(4)} EUR`, '1 USD']}
              />
              <Line type="monotone" dataKey="price" stroke="#e91e63" strokeWidth={2} dot={false} name="USD/EUR" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default GraphiquesChL;
