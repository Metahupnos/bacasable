import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function PortfolioFiducenter() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eurUsdRate, setEurUsdRate] = useState(null);
  const [eurChfRate, setEurChfRate] = useState(null);
  const [eurGbpRate, setEurGbpRate] = useState(null);
  const [eurCadRate, setEurCadRate] = useState(null);
  const [activeTab, setActiveTab] = useState('actions');
  const [showTransactions, setShowTransactions] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [loading1Y, setLoading1Y] = useState(false);

  // Portefeuille Fiducenter 65/35 - Positions au 31/12/2025
  // Source: Relevé Quintet Private Bank - Fiducenter Asset Management
  // Valeur totale: 2,597,498 EUR | Performance 2025: +17.08%

  const stocks = [
    // === ENERGIE (5.44%) ===
    { symbol: 'SHELL.AS', name: 'Shell PLC', units: 750, buyPrice: 24.6083, currency: 'EUR', sector: 'Energie', country: 'NL', buyDate: '2022-05-19' },
    { symbol: 'TE.PA', name: 'Technip Energies', units: 1200, buyPrice: 10.1343, currency: 'EUR', sector: 'Energie', country: 'FR', buyDate: '2025-07-17' },
    { symbol: 'VIRI.PA', name: 'Viridien', units: 347, buyPrice: 0, currency: 'EUR', sector: 'Energie', country: 'FR', buyDate: '2025-07-17' },
    { symbol: 'BP.L', name: 'BP', units: 4000, buyPrice: 3.7457, currency: 'GBP', sector: 'Energie', country: 'GB', buyDate: '2022-07-14' },
    { symbol: 'LNG', name: 'Cheniere Energy', units: 150, buyPrice: 131.2851, currency: 'USD', sector: 'Energie', country: 'US', buyDate: '2022-03-02' },

    // === MATERIAUX (6.01%) ===
    { symbol: 'AI.PA', name: 'Air Liquide', units: 132, buyPrice: 132.403, currency: 'EUR', sector: 'Materiaux', country: 'FR', buyDate: '2025-07-17' },
    { symbol: 'BEKB.BR', name: 'Bekaert', units: 680, buyPrice: 32.9703, currency: 'EUR', sector: 'Materiaux', country: 'BE', buyDate: '2024-12-19' },
    { symbol: 'HEI.DE', name: 'Heidelberg Materials', units: 130, buyPrice: 165.2481, currency: 'EUR', sector: 'Materiaux', country: 'DE', buyDate: '2025-03-13' },
    { symbol: 'ABX.TO', name: 'Barrick Mining', units: 1200, buyPrice: 21.0789, currency: 'CAD', sector: 'Materiaux', country: 'CA', buyDate: '2025-05-09' },
    { symbol: 'GIVN.SW', name: 'Givaudan', units: 5, buyPrice: 3785.392, currency: 'CHF', sector: 'Materiaux', country: 'CH', buyDate: '2022-03-02' },
    { symbol: 'GLEN.L', name: 'Glencore PLC', units: 4000, buyPrice: 4.2131, currency: 'GBP', sector: 'Materiaux', country: 'GB', buyDate: '2024-01-18' },

    // === INDUSTRIE (8.20%) ===
    { symbol: 'CRI.PA', name: 'Chargeurs', units: 1686, buyPrice: 17.2061, currency: 'EUR', sector: 'Industrie', country: 'FR', buyDate: '2025-07-17' },
    { symbol: 'DBG.PA', name: 'Derichebourg', units: 3600, buyPrice: 4.8715, currency: 'EUR', sector: 'Industrie', country: 'FR', buyDate: '2025-07-17' },
    { symbol: 'DHL.DE', name: 'Deutsche Post', units: 420, buyPrice: 40.5795, currency: 'EUR', sector: 'Industrie', country: 'DE', buyDate: '2022-05-03' },
    { symbol: 'EXENS.PA', name: 'Exosens', units: 300, buyPrice: 44.0833, currency: 'EUR', sector: 'Industrie', country: 'FR', buyDate: '2025-10-07' },
    { symbol: 'LDO.MI', name: 'Leonardo', units: 1000, buyPrice: 8.8533, currency: 'EUR', sector: 'Industrie', country: 'IT', buyDate: '2025-07-17' },
    { symbol: 'ABBN.SW', name: 'ABB Ltd', units: 600, buyPrice: 28.3376, currency: 'CHF', sector: 'Industrie', country: 'CH', buyDate: '2025-01-30' },
    { symbol: 'ACLN.SW', name: 'Accelleron Industries', units: 30, buyPrice: 20.2373, currency: 'CHF', sector: 'Industrie', country: 'CH', buyDate: '2023-01-16' },
    { symbol: 'CHG.L', name: 'Chemring Group', units: 5000, buyPrice: 3.5019, currency: 'GBP', sector: 'Industrie', country: 'GB', buyDate: '2024-03-15' },
    { symbol: 'VLTO', name: 'Veralto', units: 23, buyPrice: 85.4004, currency: 'USD', sector: 'Industrie', country: 'US', buyDate: '2023-10-02' },
    { symbol: 'VRT', name: 'Vertiv Holdings', units: 140, buyPrice: 84.0738, currency: 'USD', sector: 'Industrie', country: 'US', buyDate: '2025-03-07' },

    // === CONSOMMATION DISCRETIONNAIRE (2.69%) ===
    { symbol: 'PRX.AS', name: 'Prosus NV', units: 806, buyPrice: 20.9505, currency: 'EUR', sector: 'Conso. Discret.', country: 'NL', buyDate: '2023-09-14' },
    { symbol: 'TRI.PA', name: 'Trigano', units: 155, buyPrice: 120.5213, currency: 'EUR', sector: 'Conso. Discret.', country: 'FR', buyDate: '2025-07-17' },

    // === SANTE (2.85%) ===
    { symbol: 'BIM.PA', name: 'Biomerieux', units: 200, buyPrice: 86.3671, currency: 'EUR', sector: 'Sante', country: 'FR', buyDate: '2025-07-17' },
    { symbol: 'BNTX', name: 'BioNTech SE (ADR)', units: 110, buyPrice: 168.1273, currency: 'USD', sector: 'Sante', country: 'US', buyDate: '2022-03-30' },
    { symbol: 'NOVN.SW', name: 'Novartis', units: 225, buyPrice: 76.1504, currency: 'CHF', sector: 'Sante', country: 'CH', buyDate: '2023-10-04' },
    { symbol: 'SDZ.SW', name: 'Sandoz Group', units: 45, buyPrice: 20.8004, currency: 'CHF', sector: 'Sante', country: 'CH', buyDate: '2023-10-04' },
    { symbol: 'DHR', name: 'Danaher', units: 70, buyPrice: 224.5944, currency: 'USD', sector: 'Sante', country: 'US', buyDate: '2023-10-02' },

    // === FINANCE (9.54%) ===
    { symbol: 'SAN.MC', name: 'Banco Santander', units: 6000, buyPrice: 2.9014, currency: 'EUR', sector: 'Finance', country: 'ES', buyDate: '2025-07-21' },
    { symbol: 'EXV1.DE', name: 'iShares STOXX Europe 600 Banks', units: 4000, buyPrice: 8.5048, currency: 'EUR', sector: 'Finance', country: 'DE', buyDate: '2023-08-18' },
    { symbol: 'NN.AS', name: 'NN Group', units: 550, buyPrice: 34.2455, currency: 'EUR', sector: 'Finance', country: 'NL', buyDate: '2023-07-13' },
    { symbol: 'C', name: 'Citigroup', units: 345, buyPrice: 54.6894, currency: 'USD', sector: 'Finance', country: 'US', buyDate: '2022-03-14' },
    { symbol: 'COIN', name: 'Coinbase', units: 70, buyPrice: 185.0596, currency: 'USD', sector: 'Finance', country: 'US', buyDate: '2025-03-17' },

    // === TECHNOLOGIES (8.96%) ===
    { symbol: 'ASML.AS', name: 'ASML Holding', units: 30, buyPrice: 589.5833, currency: 'EUR', sector: 'Technologie', country: 'NL', buyDate: '2022-05-12' },
    { symbol: 'IFX.DE', name: 'Infineon Technologies', units: 670, buyPrice: 30.0373, currency: 'EUR', sector: 'Technologie', country: 'DE', buyDate: '2024-04-22' },
    { symbol: 'SMHN.DE', name: 'Suss Microtec SE', units: 500, buyPrice: 39.508, currency: 'EUR', sector: 'Technologie', country: 'DE', buyDate: '2025-04-11' },
    { symbol: 'MSFT', name: 'Microsoft', units: 100, buyPrice: 295.9447, currency: 'USD', sector: 'Technologie', country: 'US', buyDate: '2022-03-02' },
    { symbol: 'NVDA', name: 'Nvidia Corp', units: 750, buyPrice: 23.7795, currency: 'USD', sector: 'Technologie', country: 'US', buyDate: '2024-11-21' },

    // === SERVICES DE COMMUNICATION (1.89%) ===
    { symbol: 'CLNX.MC', name: 'Cellnex Telecom', units: 430, buyPrice: 40.7594, currency: 'EUR', sector: 'Communication', country: 'ES', buyDate: '2025-07-21' },
    { symbol: 'GOOGL', name: 'Alphabet A', units: 140, buyPrice: 134.8263, currency: 'USD', sector: 'Communication', country: 'US', buyDate: '2022-07-18' },

    // === IMMOBILIER (0.95%) ===
    { symbol: 'VGP.BR', name: 'VGP', units: 250, buyPrice: 122.377, currency: 'EUR', sector: 'Immobilier', country: 'BE', buyDate: '2023-02-15' },
  ];

  // Fonds (ETF et OPCVM) - Non trackables via Yahoo Finance
  const funds = [
    { name: 'Carmignac Emergents F EUR', isin: 'LU0992626480', units: 247.775, valueEUR: 54397, sector: 'Fonds Actions' },
    { name: 'Alquity Indian Sub Y Cap', isin: 'LU1070052342', units: 260, valueEUR: 39884, sector: 'Fonds Actions' },
    { name: 'FAM UCITS TF A Ret Inv', isin: 'LU2649132177', units: 600, valueEUR: 80064, sector: 'Fonds Actions' },
    { name: 'Independance EUR Small IC', isin: 'LU1832175001', units: 275, valueEUR: 63918, sector: 'Fonds Actions' },
    { name: 'First US Eq Mod Buf A ETF', isin: 'IE000P0FL8E3', units: 1700, valueEUR: 55650, sector: 'Fonds Actions' },
    { name: 'iShares MSCI China ETF', isin: 'US46434V5140', units: 1050, valueEUR: 30913, sector: 'Fonds Actions' },
    { name: 'SPDR Russell 2000 US SM', isin: 'IE00BJ38QD84', units: 370, valueEUR: 22870, sector: 'Fonds Actions' },
    { name: 'Carmignac Credit F', isin: 'LU1932489690', units: 814.258, valueEUR: 126894, sector: 'Fonds Obligations' },
    { name: 'DPAM L Bd EM Mk Sus-F', isin: 'LU0907928062', units: 270, valueEUR: 44904, sector: 'Fonds Obligations' },
    { name: 'FAM Elite Bd A Ret Inv', isin: 'LU2649131955', units: 60, valueEUR: 65468, sector: 'Fonds Obligations' },
    { name: 'IVO EMC Dbt R € Cap', isin: 'LU1165644672', units: 310, valueEUR: 46565, sector: 'Fonds Obligations' },
    { name: 'Octo Credit Value C', isin: 'FR0013192622', units: 55, valueEUR: 67455, sector: 'Fonds Obligations' },
    { name: 'Twelve Securis Credit', isin: 'IE0006A83VD3', units: 520, valueEUR: 52047, sector: 'Fonds Obligations' },
    { name: 'Pareto Nordic Corp Bd B', isin: 'LU1311574799', units: 400, valueEUR: 57629, sector: 'Fonds Obligations' },
  ];

  // Obligations directes
  const bonds = [
    { name: 'VGP 3.5% MAR26', isin: 'BE0002611896', nominal: 50000, valueEUR: 49996, yield: 3.83, maturity: '2026-03-19' },
    { name: 'Fresenius 3.875% SEP27', isin: 'XS2530444624', nominal: 50000, valueEUR: 50937, yield: 2.57, maturity: '2027-09-20' },
    { name: 'Mercedes-Benz 3% FEB27', isin: 'DE000A3LBMY2', nominal: 50000, valueEUR: 50318, yield: 2.42, maturity: '2027-02-23' },
    { name: 'HLD Europe 3.85% JUL27', isin: 'XS2360856517', nominal: 50000, valueEUR: 50063, yield: 3.81, maturity: '2027-07-16' },
    { name: 'MTU Aero 3.875% SEP31', isin: 'XS2887896574', nominal: 50000, valueEUR: 51703, yield: 3.19, maturity: '2031-09-18' },
    { name: 'NordLB 4.875% JUL28', isin: 'DE000NLB4RS5', nominal: 50000, valueEUR: 52556, yield: 2.74, maturity: '2028-07-11' },
    { name: 'Coface 5.75% NOV33', isin: 'FR001400M8W6', nominal: 100000, valueEUR: 110737, yield: 4.04, maturity: '2033-11-28' },
  ];

  // Transactions 2025 pour historique
  const transactions2025 = [
    { date: '2025-02-13', type: 'SELL', ticker: 'LDO.MI', name: 'Leonardo', qty: -1000, price: 30.13, currency: 'EUR', amountEUR: 30094, pnl: 21241 },
    { date: '2025-03-07', type: 'SELL', ticker: 'DOCU', name: 'Docusign', qty: -160, price: 78.81, currency: 'USD', amountEUR: 11574, pnl: -5535 },
    { date: '2025-03-07', type: 'BUY', ticker: 'VRT', name: 'Vertiv Holdings A', qty: 140, price: 83.88, currency: 'USD', amountEUR: -10827 },
    { date: '2025-03-12', type: 'SELL', ticker: 'PAH3.DE', name: 'Porsche Hldg', qty: -530, price: 38.22, currency: 'EUR', amountEUR: 20232, pnl: -15120 },
    { date: '2025-03-13', type: 'BUY', ticker: 'HEI.DE', name: 'Heidelberg Materials', qty: 130, price: 165.05, currency: 'EUR', amountEUR: -21482 },
    { date: '2025-03-17', type: 'SELL', ticker: 'PYPL', name: 'PayPal Holdings', qty: -180, price: 69.09, currency: 'USD', amountEUR: 11363, pnl: -5933 },
    { date: '2025-03-17', type: 'BUY', ticker: 'COIN', name: 'Coinbase A', qty: 70, price: 184.67, currency: 'USD', amountEUR: -11863 },
    { date: '2025-04-10', type: 'SELL', ticker: 'PLUG', name: 'Plug Power', qty: -935, price: 1.18, currency: 'USD', amountEUR: 962, pnl: -16812 },
    { date: '2025-04-11', type: 'SELL', ticker: 'HLAG.DE', name: 'Hapag-Lloyd AG', qty: -110, price: 127.30, currency: 'EUR', amountEUR: 13978, pnl: -4747 },
    { date: '2025-04-11', type: 'BUY', ticker: 'SMHN.DE', name: 'Suss Microtec SE', qty: 300, price: 29.28, currency: 'EUR', amountEUR: -8809 },
    { date: '2025-04-14', type: 'BUY', ticker: 'ZPRR.L', name: 'SPDR Russell2000', qty: 370, price: 54.41, currency: 'USD', amountEUR: -17738 },
    { date: '2025-06-04', type: 'SELL', ticker: 'HACK', name: 'Amplify Cybersecurity', qty: -1000, price: 83.68, currency: 'USD', amountEUR: 73184, pnl: 21966 },
    { date: '2025-07-15', type: 'SELL', ticker: 'TE.PA', name: 'Technip Energies', qty: -600, price: 36.96, currency: 'EUR', amountEUR: 22149, pnl: 16069 },
    { date: '2025-10-07', type: 'BUY', ticker: 'EXENS.PA', name: 'Exosens', qty: 300, price: 44.00, currency: 'EUR', amountEUR: -13225 },
    { date: '2025-12-18', type: 'BUY', ticker: 'SECURIS', name: 'Twelve Securis Credit', qty: 520, price: 100.00, currency: 'EUR', amountEUR: -52052 },
  ];

  // Performance historique
  const historicalPerformance = [
    { year: 2022, startValue: 1986234, endValue: 1765851, perf: -8.44, cumulative: -8.44 },
    { year: 2023, startValue: 1765851, endValue: 1973689, perf: 12.97, cumulative: 3.44 },
    { year: 2024, startValue: 1973689, endValue: 2244114, perf: 14.94, cumulative: 18.89 },
    { year: 2025, startValue: 2244114, endValue: 2597498, perf: 17.08, cumulative: 39.20 },
  ];

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // 5 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

      // Récupérer les taux de change
      const fxPairs = ['EURUSD=X', 'EURCHF=X', 'EURGBP=X', 'EURCAD=X'];
      for (const pair of fxPairs) {
        try {
          const fxResponse = await axios.get(`${apiBase}/api/finance/${pair}`);
          const rate = fxResponse.data.chart.result[0].meta.regularMarketPrice;
          if (pair === 'EURUSD=X') setEurUsdRate(rate);
          if (pair === 'EURCHF=X') setEurChfRate(rate);
          if (pair === 'EURGBP=X') setEurGbpRate(rate);
          if (pair === 'EURCAD=X') setEurCadRate(rate);
        } catch (err) {
          console.error(`Erreur taux ${pair}:`, err);
        }
      }

      const promises = stocks.map(async (stock) => {
        try {
          const url = `${apiBase}/api/finance/${stock.symbol}`;
          const response = await axios.get(url);
          const data = response.data.chart.result[0];
          let currentPrice = data.meta.regularMarketPrice;

          // Les actions UK (.L) sont cotées en pence, convertir en GBP
          if (stock.symbol.endsWith('.L') && currentPrice > 100) {
            currentPrice = currentPrice / 100;
          }

          let previousClose = data.meta.chartPreviousClose || data.meta.previousClose;

          // Les actions UK (.L) - previousClose aussi en pence, convertir en GBP
          if (stock.symbol.endsWith('.L') && previousClose > 100) {
            previousClose = previousClose / 100;
          }

          const changePercent1D = previousClose
            ? ((currentPrice - previousClose) / previousClose * 100)
            : (data.meta.regularMarketChangePercent || 0);

          // Fetch 5D historical data
          let changePercent5D = null;
          try {
            const hist5DUrl = `${apiBase}/api/history/${stock.symbol}/5d`;
            const hist5DResponse = await axios.get(hist5DUrl);
            const hist5DData = hist5DResponse.data.chart.result[0];
            const prices5D = hist5DData.indicators.quote[0].close;
            let price5DAgo = prices5D[0];

            if (stock.symbol.endsWith('.L') && price5DAgo > 100) {
              price5DAgo = price5DAgo / 100;
            }

            if (price5DAgo && currentPrice) {
              changePercent5D = ((currentPrice - price5DAgo) / price5DAgo * 100);
            }
          } catch (err) {
            console.error(`Erreur 5D ${stock.symbol}:`, err);
          }

          // Fetch 1M historical data
          let changePercent1M = null;
          try {
            const hist1MUrl = `${apiBase}/api/history/${stock.symbol}/1mo`;
            const hist1MResponse = await axios.get(hist1MUrl);
            const hist1MData = hist1MResponse.data.chart.result[0];
            const prices1M = hist1MData.indicators.quote[0].close;
            let price1MAgo = prices1M[0];

            if (stock.symbol.endsWith('.L') && price1MAgo > 100) {
              price1MAgo = price1MAgo / 100;
            }

            if (price1MAgo && currentPrice) {
              changePercent1M = ((currentPrice - price1MAgo) / price1MAgo * 100);
            }
          } catch (err) {
            console.error(`Erreur 1M ${stock.symbol}:`, err);
          }

          // Fetch 3M historical data
          let changePercent3M = null;
          try {
            const hist3MUrl = `${apiBase}/api/history/${stock.symbol}/3mo`;
            const hist3MResponse = await axios.get(hist3MUrl);
            const hist3MData = hist3MResponse.data.chart.result[0];
            const prices3M = hist3MData.indicators.quote[0].close;
            let price3MAgo = prices3M[0];

            if (stock.symbol.endsWith('.L') && price3MAgo > 100) {
              price3MAgo = price3MAgo / 100;
            }

            if (price3MAgo && currentPrice) {
              changePercent3M = ((currentPrice - price3MAgo) / price3MAgo * 100);
            }
          } catch (err) {
            console.error(`Erreur 3M ${stock.symbol}:`, err);
          }

          // Fetch 1Y historical data
          let changePercent1Y = null;
          try {
            const histUrl = `${apiBase}/api/history/${stock.symbol}/1y`;
            const histResponse = await axios.get(histUrl);
            const histData = histResponse.data.chart.result[0];
            const prices = histData.indicators.quote[0].close;
            let price1YAgo = prices[0];

            // UK stocks - convert pence to GBP
            if (stock.symbol.endsWith('.L') && price1YAgo > 100) {
              price1YAgo = price1YAgo / 100;
            }

            if (price1YAgo && currentPrice) {
              changePercent1Y = ((currentPrice - price1YAgo) / price1YAgo * 100);
            }
          } catch (err) {
            console.error(`Erreur 1Y ${stock.symbol}:`, err);
          }

          return {
            ...stock,
            currentPrice: currentPrice,
            previousClose: previousClose,
            changePercent1D: changePercent1D,
            changePercent5D: changePercent5D,
            changePercent1M: changePercent1M,
            changePercent3M: changePercent3M,
            changePercent1Y: changePercent1Y,
          };
        } catch (err) {
          console.error(`Erreur pour ${stock.symbol}:`, err);
          return {
            ...stock,
            currentPrice: null,
            error: 'Erreur'
          };
        }
      });

      const results = await Promise.all(promises);
      setPortfolio(results);
      setError(null);
    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const convertToEUR = (amount, currency) => {
    if (!amount) return null;
    switch (currency) {
      case 'USD': return eurUsdRate ? amount / eurUsdRate : null;
      case 'CHF': return eurChfRate ? amount / eurChfRate : null;
      case 'GBP': return eurGbpRate ? amount / eurGbpRate : null;
      case 'CAD': return eurCadRate ? amount / eurCadRate : null;
      default: return amount;
    }
  };

  const getTotalActionsEUR = () => {
    return portfolio.reduce((sum, stock) => {
      const currentValueEUR = convertToEUR(stock.currentPrice * stock.units, stock.currency);
      return sum + (currentValueEUR || 0);
    }, 0);
  };

  const getTotalFundsEUR = () => {
    return funds.reduce((sum, fund) => sum + fund.valueEUR, 0);
  };

  const getTotalBondsEUR = () => {
    return bonds.reduce((sum, bond) => sum + bond.valueEUR, 0);
  };

  const getTotalPortfolioEUR = () => {
    return getTotalActionsEUR() + getTotalFundsEUR() + getTotalBondsEUR() + 157730; // + liquidités
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getSectorTotals = () => {
    const sectors = {};
    portfolio.forEach(stock => {
      const valueEUR = convertToEUR(stock.currentPrice * stock.units, stock.currency) || 0;
      if (!sectors[stock.sector]) sectors[stock.sector] = 0;
      sectors[stock.sector] += valueEUR;
    });
    return sectors;
  };

  // Fonction de tri
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedPortfolio = () => {
    if (!sortConfig.key) return portfolio;

    const totalActions = getTotalActionsEUR();

    return [...portfolio].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'sector':
          aValue = a.sector;
          bValue = b.sector;
          break;
        case 'country':
          aValue = a.country;
          bValue = b.country;
          break;
        case 'buyDate':
          aValue = a.buyDate;
          bValue = b.buyDate;
          break;
        case 'units':
          aValue = a.units;
          bValue = b.units;
          break;
        case 'buyPrice':
          aValue = a.buyPrice;
          bValue = b.buyPrice;
          break;
        case 'currentPrice':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'valueEUR':
          aValue = convertToEUR(a.currentPrice * a.units, a.currency) || 0;
          bValue = convertToEUR(b.currentPrice * b.units, b.currency) || 0;
          break;
        case 'weight':
          aValue = (convertToEUR(a.currentPrice * a.units, a.currency) || 0) / totalActions * 100;
          bValue = (convertToEUR(b.currentPrice * b.units, b.currency) || 0) / totalActions * 100;
          break;
        case 'perf':
          aValue = a.currentPrice && a.buyPrice > 0 ? ((a.currentPrice - a.buyPrice) / a.buyPrice * 100) : -999;
          bValue = b.currentPrice && b.buyPrice > 0 ? ((b.currentPrice - b.buyPrice) / b.buyPrice * 100) : -999;
          break;
        case 'perf1D':
          aValue = a.changePercent1D || 0;
          bValue = b.changePercent1D || 0;
          break;
        case 'perf5D':
          aValue = a.changePercent5D || 0;
          bValue = b.changePercent5D || 0;
          break;
        case 'perf1M':
          aValue = a.changePercent1M || 0;
          bValue = b.changePercent1M || 0;
          break;
        case 'perf3M':
          aValue = a.changePercent3M || 0;
          bValue = b.changePercent3M || 0;
          break;
        case 'perf1Y':
          aValue = a.changePercent1Y || 0;
          bValue = b.changePercent1Y || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const SortHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label} {sortConfig.key === sortKey
        ? (sortConfig.direction === 'asc' ? '▲' : '▼')
        : <span style={{ opacity: 0.3 }}>▼</span>}
    </th>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="nav-buttons">
          <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
          <button onClick={fetchPrices} className="nav-button">Actualiser</button>
          <button onClick={() => navigate('/fiducenter/charts')} className="nav-button">Graphiques</button>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginTop: '20px' }}>
          Portfolio Fiducenter 65/35
          {!loading && (
            <span style={{ fontSize: '1rem', color: '#61dafb', marginLeft: '10px' }}>
              ({formatNumber(getTotalPortfolioEUR())} EUR)
            </span>
          )}
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>
          Gestion: Fiducenter Asset Management | Banque: Quintet Private Bank
        </p>

        {/* Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => { setActiveTab('actions'); setShowTransactions(false); }}
            className={`nav-button ${activeTab === 'actions' ? 'active' : ''}`}
            style={{ marginRight: '10px', backgroundColor: activeTab === 'actions' ? '#61dafb' : '#333' }}
          >
            Actions ({stocks.length})
          </button>
          <button
            onClick={() => { setActiveTab('funds'); setShowTransactions(false); }}
            className={`nav-button ${activeTab === 'funds' ? 'active' : ''}`}
            style={{ marginRight: '10px', backgroundColor: activeTab === 'funds' ? '#61dafb' : '#333' }}
          >
            Fonds ({funds.length})
          </button>
          <button
            onClick={() => { setActiveTab('bonds'); setShowTransactions(false); }}
            className={`nav-button ${activeTab === 'bonds' ? 'active' : ''}`}
            style={{ marginRight: '10px', backgroundColor: activeTab === 'bonds' ? '#61dafb' : '#333' }}
          >
            Obligations ({bonds.length})
          </button>
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="nav-button"
            style={{ backgroundColor: showTransactions ? '#ff9800' : '#333' }}
          >
            Transactions 2025
          </button>
        </div>

        {/* Performance historique */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ color: '#4caf50', marginBottom: '10px' }}>Performance Historique</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {historicalPerformance.map(h => (
              <div key={h.year} style={{ textAlign: 'center', padding: '10px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{h.year}</div>
                <div style={{ color: h.perf >= 0 ? '#4caf50' : '#f44336', fontSize: '1.1rem' }}>
                  {formatPercent(h.perf)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                  Cumulé: {formatPercent(h.cumulative)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading && <p>Chargement des données...</p>}
        {error && <p className="error">{error}</p>}

        {/* Transactions */}
        {showTransactions && (
          <table className="portfolio-table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Titre</th>
                <th>Qté</th>
                <th>Prix</th>
                <th>Montant EUR</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {transactions2025.map((tx, idx) => (
                <tr key={idx}>
                  <td>{tx.date}</td>
                  <td style={{ color: tx.type === 'BUY' ? '#4caf50' : '#f44336' }}>{tx.type}</td>
                  <td>{tx.name}</td>
                  <td>{tx.qty}</td>
                  <td>{formatNumber(tx.price)} {tx.currency}</td>
                  <td style={{ color: tx.amountEUR > 0 ? '#4caf50' : '#f44336' }}>
                    {formatNumber(tx.amountEUR)}
                  </td>
                  <td style={{ color: tx.pnl > 0 ? '#4caf50' : tx.pnl < 0 ? '#f44336' : '#888' }}>
                    {tx.pnl ? formatNumber(tx.pnl) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Actions */}
        {!loading && activeTab === 'actions' && portfolio.length > 0 && !showTransactions && (
          <table className="portfolio-table">
            <thead>
              <tr>
                <SortHeader label="Action" sortKey="symbol" />
                <SortHeader label="Secteur" sortKey="sector" />
                <SortHeader label="Pays" sortKey="country" />
                <SortHeader label="Date Achat" sortKey="buyDate" />
                <SortHeader label="Qté" sortKey="units" />
                <SortHeader label="Achat" sortKey="buyPrice" />
                <SortHeader label="Actuel" sortKey="currentPrice" />
                <SortHeader label="Valeur EUR" sortKey="valueEUR" />
                <SortHeader label="Poids %" sortKey="weight" />
                <SortHeader label="+/- %" sortKey="perf" />
                <SortHeader label="1D" sortKey="perf1D" />
                <SortHeader label="5D" sortKey="perf5D" />
                <SortHeader label="1M" sortKey="perf1M" />
                <SortHeader label="3M" sortKey="perf3M" />
                <SortHeader label="1Y" sortKey="perf1Y" />
              </tr>
            </thead>
            <tbody>
              {getSortedPortfolio().map((stock, index) => {
                const currentValueEUR = convertToEUR(stock.currentPrice * stock.units, stock.currency);
                const totalActions = getTotalActionsEUR();
                const weight = currentValueEUR && totalActions ? (currentValueEUR / totalActions * 100) : 0;
                const diffPercent = stock.currentPrice && stock.buyPrice > 0
                  ? ((stock.currentPrice - stock.buyPrice) / stock.buyPrice * 100)
                  : null;

                return (
                  <tr key={index}>
                    <td>
                      <a
                        href={`https://finance.yahoo.com/quote/${stock.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#61dafb', textDecoration: 'none' }}
                      >
                        <strong>{stock.symbol}</strong>
                      </a><br/>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{stock.name}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{stock.sector}</td>
                    <td style={{ fontSize: '0.8rem' }}>{stock.country}</td>
                    <td style={{ fontSize: '0.8rem' }}>{stock.buyDate}</td>
                    <td>{stock.units}</td>
                    <td>{formatNumber(stock.buyPrice)} {stock.currency}</td>
                    <td>{stock.currentPrice ? formatNumber(stock.currentPrice) : 'N/A'} {stock.currency}</td>
                    <td>{currentValueEUR ? formatNumber(currentValueEUR) : 'N/A'}</td>
                    <td style={{ color: '#61dafb' }}>{weight.toFixed(2)}%</td>
                    <td style={{ color: diffPercent > 0 ? '#4caf50' : diffPercent < 0 ? '#f44336' : '#888' }}>
                      {diffPercent !== null ? formatPercent(diffPercent) : (stock.buyPrice === 0 ? 'Spin-off' : 'N/A')}
                    </td>
                    <td style={{ color: stock.changePercent1D > 0 ? '#4caf50' : stock.changePercent1D < 0 ? '#f44336' : '#888' }}>
                      {stock.changePercent1D !== undefined ? formatPercent(stock.changePercent1D) : 'N/A'}
                    </td>
                    <td style={{ color: stock.changePercent5D > 0 ? '#4caf50' : stock.changePercent5D < 0 ? '#f44336' : '#888' }}>
                      {stock.changePercent5D !== null ? formatPercent(stock.changePercent5D) : 'N/A'}
                    </td>
                    <td style={{ color: stock.changePercent1M > 0 ? '#4caf50' : stock.changePercent1M < 0 ? '#f44336' : '#888' }}>
                      {stock.changePercent1M !== null ? formatPercent(stock.changePercent1M) : 'N/A'}
                    </td>
                    <td style={{ color: stock.changePercent3M > 0 ? '#4caf50' : stock.changePercent3M < 0 ? '#f44336' : '#888' }}>
                      {stock.changePercent3M !== null ? formatPercent(stock.changePercent3M) : 'N/A'}
                    </td>
                    <td style={{ color: stock.changePercent1Y > 0 ? '#4caf50' : stock.changePercent1Y < 0 ? '#f44336' : '#888' }}>
                      {stock.changePercent1Y !== null ? formatPercent(stock.changePercent1Y) : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#1a1a2e' }}>
                <td colSpan="7">Total Actions</td>
                <td>{formatNumber(getTotalActionsEUR())} EUR</td>
                <td>100%</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Fonds */}
        {activeTab === 'funds' && !showTransactions && (
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Fonds</th>
                <th>ISIN</th>
                <th>Parts</th>
                <th>Valeur EUR</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((fund, idx) => (
                <tr key={idx}>
                  <td>{fund.name}</td>
                  <td style={{ fontSize: '0.8rem' }}>{fund.isin}</td>
                  <td>{formatNumber(fund.units)}</td>
                  <td>{formatNumber(fund.valueEUR)}</td>
                  <td>{fund.sector}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#1a1a2e' }}>
                <td colSpan="3">Total Fonds</td>
                <td>{formatNumber(getTotalFundsEUR())} EUR</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Obligations */}
        {activeTab === 'bonds' && !showTransactions && (
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Obligation</th>
                <th>ISIN</th>
                <th>Nominal</th>
                <th>Valeur EUR</th>
                <th>Rendement</th>
                <th>Maturité</th>
              </tr>
            </thead>
            <tbody>
              {bonds.map((bond, idx) => (
                <tr key={idx}>
                  <td>{bond.name}</td>
                  <td style={{ fontSize: '0.8rem' }}>{bond.isin}</td>
                  <td>{formatNumber(bond.nominal)}</td>
                  <td>{formatNumber(bond.valueEUR)}</td>
                  <td style={{ color: '#4caf50' }}>{bond.yield}%</td>
                  <td>{bond.maturity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 'bold', backgroundColor: '#1a1a2e' }}>
                <td colSpan="3">Total Obligations</td>
                <td>{formatNumber(getTotalBondsEUR())} EUR</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        )}

        {/* Résumé allocation */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a1a2e', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '10px' }}>Allocation</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ color: '#61dafb' }}>Actions</div>
              <div>{formatNumber(getTotalActionsEUR())} EUR</div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>~60%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ color: '#4caf50' }}>Obligations</div>
              <div>{formatNumber(getTotalBondsEUR())} EUR</div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>~16%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ color: '#ff9800' }}>Fonds</div>
              <div>{formatNumber(getTotalFundsEUR())} EUR</div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>~18%</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ color: '#9c27b0' }}>Liquidités</div>
              <div>157 730 EUR</div>
              <div style={{ fontSize: '0.9rem', color: '#888' }}>~6%</div>
            </div>
          </div>
        </div>

      </header>
    </div>
  );
}

export default PortfolioFiducenter;
