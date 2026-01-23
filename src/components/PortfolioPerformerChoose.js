import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import '../App.css';

const PROXY_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

// ═══════════════════════════════════════════════════════════════════════════
// UNIVERS FIXE - Decision Tracker
// ═══════════════════════════════════════════════════════════════════════════

// A. POSITIONS OUVERTES (en portefeuille)
// entry = prix d'exécution, entryDate = date achat
const POSITIONS = [
  { ticker: 'GOOGL', name: 'Alphabet Inc.', entry: 292.86, qty: 350, entryDate: '20-11-2025' },
  { ticker: 'CRWV', name: 'Coreweave Inc.', entry: 101.37, qty: 500, entryDate: '16-01-2026' },
  { ticker: 'GLXY', name: 'Galaxy Digital', entry: 34.01, qty: 1500, entryDate: '16-01-2026' },
  { ticker: 'RDW', name: 'Redwire Corp.', entry: 10.90, qty: 5000, entryDate: '09-01-2026' },
  { ticker: 'SMSN.L', name: 'Samsung GDR', entry: 2076.33, qty: 58, entryDate: '29-12-2025', yahooTicker: 'SMSNL.XC' },
  { ticker: 'SNDK', name: 'Sandisk Corp.', entry: 382.14, qty: 150, entryDate: '09-01-2026' },
  { ticker: 'WDC', name: 'Western Digital', entry: 199.37, qty: 300, entryDate: '09-01-2026' }
];

// B. WATCHLIST ACTIVE (ENTRY possibles)
const WATCHLIST_ACTIVE = [
  { ticker: 'UMAC', name: 'Unusual Machines' },
  { ticker: 'IMSR', name: 'IMSurge Inc.' },
  { ticker: 'PCT', name: 'PureCycle Tech.' },
  { ticker: 'LGN', name: 'Legence Corp.' },
  { ticker: 'MRNA', name: 'Moderna Inc.' },
  { ticker: 'CWH', name: 'Camping World' },
  { ticker: 'BHVN', name: 'Biohaven Ltd.' }
];

// C. WATCHLIST PASSIVE (idées / plus tard)
const WATCHLIST_PASSIVE = [
  { ticker: 'ASTX', name: 'Astrix Pharma' },
  { ticker: 'FNGR', name: 'FingerMotion Inc.' },
  { ticker: 'ASTS', name: 'AST SpaceMobile' },
  { ticker: 'RKLB', name: 'Rocket Lab USA' },
  { ticker: 'BE', name: 'Bloom Energy' }
];

// D. WATCHLIST FIDUCENTER 65/35
const WATCHLIST_FIDUCENTER = [
  // Energie
  { ticker: 'SHEL.AS', name: 'Shell PLC', yahooTicker: 'SHELL.AS' },
  { ticker: 'TE.PA', name: 'Technip Energies' },
  { ticker: 'BP.L', name: 'BP' },
  { ticker: 'LNG', name: 'Cheniere Energy' },
  // Materiaux
  { ticker: 'AI.PA', name: 'Air Liquide' },
  { ticker: 'BEKB.BR', name: 'Bekaert' },
  { ticker: 'HEI.DE', name: 'Heidelberg Materials' },
  { ticker: 'ABX.TO', name: 'Barrick Mining' },
  { ticker: 'GLEN.L', name: 'Glencore PLC' },
  // Industrie
  { ticker: 'CRI.PA', name: 'Chargeurs' },
  { ticker: 'DBG.PA', name: 'Derichebourg' },
  { ticker: 'DHL.DE', name: 'Deutsche Post' },
  { ticker: 'LDO.MI', name: 'Leonardo' },
  { ticker: 'CHG.L', name: 'Chemring Group' },
  { ticker: 'VRT', name: 'Vertiv Holdings' },
  // Conso. Discret.
  { ticker: 'PRX.AS', name: 'Prosus NV' },
  { ticker: 'TRI.PA', name: 'Trigano' },
  // Santé
  { ticker: 'BIM.PA', name: 'Biomerieux' },
  { ticker: 'BNTX', name: 'BioNTech SE' },
  { ticker: 'DHR', name: 'Danaher' },
  // Finance
  { ticker: 'SAN.MC', name: 'Banco Santander' },
  { ticker: 'EXV1.DE', name: 'iShares STOXX 600 Banks' },
  { ticker: 'NN.AS', name: 'NN Group' },
  { ticker: 'C', name: 'Citigroup' },
  { ticker: 'COIN', name: 'Coinbase' },
  // Tech
  { ticker: 'ASML.AS', name: 'ASML Holding' },
  { ticker: 'IFX.DE', name: 'Infineon' },
  { ticker: 'MSFT', name: 'Microsoft' },
  { ticker: 'NVDA', name: 'Nvidia' },
  // Communication
  { ticker: 'CLNX.MC', name: 'Cellnex Telecom' },
  { ticker: 'GOOGL', name: 'Alphabet' },
  // Immobilier
  { ticker: 'VGP.BR', name: 'VGP' }
];

// Storage key pour les stops (Entry est hardcodé)
const STOPS_KEY = 'decisionTracker_stops';

function PortfolioPerformerChoose() {
  const navigate = useNavigate();
  const [data, setData] = useState({ positions: [], watchActive: [], watchPassive: [], watchFiducenter: [] });
  const [loading, setLoading] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [stopConfig, setStopConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STOPS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sauvegarder les stops
  const saveStopConfig = (ticker, stop) => {
    const newConfig = { ...stopConfig, [ticker]: parseFloat(stop) || null };
    localStorage.setItem(STOPS_KEY, JSON.stringify(newConfig));
    setStopConfig(newConfig);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULS - Mêmes briques que Performer
  // ═══════════════════════════════════════════════════════════════════════════

  const calculateOverextension = (distanceMM20, distanceMM50) => {
    const mm20 = distanceMM20 ?? 0;
    const mm50 = distanceMM50 ?? 0;
    const score = Math.max(0, (mm20 * 0.6) + (mm50 * 0.4));

    let flag, color;
    if (score > 100) { flag = 'NO_TRADE'; color = '#ff0000'; }
    else if (score > 80) { flag = 'NO_FULL'; color = '#ff5722'; }
    else if (score >= 50) { flag = 'LATE'; color = '#ff9800'; }
    else { flag = 'OK'; color = '#4caf50'; }

    return { score: Math.round(score), flag, color };
  };

  const calculateExitSignal = (perf1D, perf2D, distanceMM20, relVol) => {
    const j = perf1D ?? 0;
    const j1 = perf2D ?? 0;

    const twoRedDays = (j < 0 && j1 < 0);
    const belowMM20 = distanceMM20 !== null && distanceMM20 < 0;
    const lowVolume = relVol < 0.8;
    const firstRedDay = (j < 0 && j1 >= 0);

    if (twoRedDays || belowMM20) {
      return { signal: 'EXIT', icon: '🚨', color: '#ff0000' };
    }
    if (lowVolume || firstRedDay) {
      return { signal: 'WARNING', icon: '⚠️', color: '#ff9800' };
    }
    return { signal: 'NONE', icon: '✓', color: '#4caf50' };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DÉCISION - Logique centrale
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateDecision = (row, category) => {
    const { perf1D, perf2D, distanceMM20, relVol, price, overext, exitSig, entry, stop } = row;
    const j = perf1D ?? 0;
    const j1 = perf2D ?? 0;

    // ═══════════════════════════════════════════════════════════════════════
    // POSITIONS OUVERTES
    // ═══════════════════════════════════════════════════════════════════════
    if (category === 'position') {
      // EXIT immédiat si signal EXIT
      if (exitSig.signal === 'EXIT') {
        return { decision: 'EXIT', icon: '🚨', color: '#ff0000', reason: exitSig.signal };
      }

      // Calcul P/L et R si on a entry/stop
      if (entry && price) {
        const pl = ((price - entry) / entry) * 100;
        row.pl = pl;

        if (stop) {
          const riskPerShare = entry - stop;
          const currentR = riskPerShare !== 0 ? (price - entry) / riskPerShare : 0;
          const distanceToStop = ((price - stop) / price) * 100;

          row.currentR = currentR;
          row.distanceToStop = distanceToStop;

          // TP1 Ready si R >= 1.5
          if (currentR >= 1.5) {
            return { decision: 'TP1 READY', icon: '🎯', color: '#4caf50', reason: `R=${currentR.toFixed(1)}` };
          }

          // EXIT si proche du stop (<2%)
          if (distanceToStop < 2) {
            return { decision: 'EXIT', icon: '🚨', color: '#ff0000', reason: `Stop: ${distanceToStop.toFixed(1)}%` };
          }
        }
      }

      // ADD si conditions favorables (J>0, J-1>0, pas de warning)
      if (j > 0 && j1 > 0 && exitSig.signal === 'NONE' && overext.score < 50) {
        return { decision: 'ADD', icon: '➕', color: '#2196f3', reason: 'Momentum OK' };
      }

      // Par défaut: HOLD
      return { decision: 'HOLD', icon: '⏳', color: '#9c27b0', reason: 'Maintenir' };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WATCHLIST ACTIVE
    // ═══════════════════════════════════════════════════════════════════════
    if (category === 'watchActive') {
      // EXIT signal = DO NOTHING
      if (exitSig.signal === 'EXIT') {
        return { decision: 'DO NOTHING', icon: '🚫', color: '#666', reason: 'Signal EXIT' };
      }

      // OverExt trop haut = DO NOTHING
      if (overext.score >= 80) {
        return { decision: 'DO NOTHING', icon: '🚫', color: '#666', reason: `OverExt=${overext.score}` };
      }

      // Conditions ENTRY: J>0, J-1>0, RelVol>0.8, MM20<10%, OverExt<50
      const entryConditions = j > 0 && j1 > 0 && relVol > 0.8 &&
                              distanceMM20 !== null && distanceMM20 < 10 && distanceMM20 > -5 &&
                              overext.score < 50;

      if (entryConditions && exitSig.signal === 'NONE') {
        return { decision: 'ENTRY', icon: '✅', color: '#4caf50', reason: 'Conditions OK' };
      }

      // Warning mais pas bloquant = WATCH
      if (exitSig.signal === 'WARNING' || overext.score >= 50) {
        return { decision: 'WATCH', icon: '👁️', color: '#ff9800', reason: 'Surveiller' };
      }

      // Par défaut
      return { decision: 'DO NOTHING', icon: '🚫', color: '#666', reason: 'Attendre signal' };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WATCHLIST PASSIVE
    // ═══════════════════════════════════════════════════════════════════════
    // Toujours DO NOTHING sauf si conditions exceptionnelles
    if (j > 2 && j1 > 2 && relVol > 1.5 && exitSig.signal === 'NONE') {
      return { decision: 'PROMOTE', icon: '⬆️', color: '#2196f3', reason: 'Passer en WL active?' };
    }

    return { decision: 'DO NOTHING', icon: '🚫', color: '#666', reason: 'Watchlist passive' };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH YAHOO DATA
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchYahooData = async (tickerInfo) => {
    try {
      // Utiliser yahooTicker si disponible, sinon ticker
      const symbol = tickerInfo.yahooTicker || tickerInfo.ticker;
      const response = await axios.get(`${PROXY_URL}/api/history/${symbol}/max`, {
        timeout: 15000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0];
      const prices = quotes.close || [];

      // Filtrer les valeurs null
      const validPrices = [];
      const validTimestamps = [];
      for (let i = 0; i < prices.length; i++) {
        if (prices[i] !== null) {
          validPrices.push(prices[i]);
          validTimestamps.push(timestamps[i]);
        }
      }

      const currentPrice = meta.regularMarketPrice || validPrices[validPrices.length - 1];
      const volume = meta.regularMarketVolume || 0;

      // Volume moyen (50 jours)
      const allVolumes = (quotes.volume || []).filter(v => v !== null);
      const recentVolumes = allVolumes.slice(-50);
      const avgVolume = recentVolumes.length > 0
        ? recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
        : 1;

      // Rendements journaliers
      const len = validPrices.length;
      const perf1D = len >= 2 ? ((validPrices[len-1] - validPrices[len-2]) / validPrices[len-2]) * 100 : null;
      const perf2D = len >= 3 ? ((validPrices[len-2] - validPrices[len-3]) / validPrices[len-3]) * 100 : null;

      // DailyReturns pour le graphique (30 derniers jours)
      const last30Prices = validPrices.slice(-31);
      const last30Timestamps = validTimestamps.slice(-31);
      const dailyReturns = [];
      for (let i = 1; i < last30Prices.length; i++) {
        if (last30Prices[i - 1] !== 0) {
          const returnPct = ((last30Prices[i] - last30Prices[i - 1]) / last30Prices[i - 1]) * 100;
          const date = new Date(last30Timestamps[i] * 1000);
          dailyReturns.push({
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            return: returnPct,
            price: last30Prices[i]
          });
        }
      }

      // MM20 et MM50
      const last20 = validPrices.slice(-20);
      const mm20 = last20.length >= 20 ? last20.reduce((a, b) => a + b, 0) / 20 : null;
      const distanceMM20 = mm20 ? ((currentPrice - mm20) / mm20) * 100 : null;

      const last50 = validPrices.slice(-50);
      const mm50 = last50.length >= 50 ? last50.reduce((a, b) => a + b, 0) / 50 : null;
      const distanceMM50 = mm50 ? ((currentPrice - mm50) / mm50) * 100 : null;

      const relVol = avgVolume > 0 ? volume / avgVolume : 1;

      return {
        ticker: tickerInfo.ticker,
        name: tickerInfo.name,
        price: currentPrice,
        perf1D,
        perf2D,
        distanceMM20,
        distanceMM50,
        relVol,
        dailyReturns
      };
    } catch (err) {
      console.error(`Erreur pour ${tickerInfo.ticker}:`, err.message);
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════
  const loadData = useCallback(async () => {
    setLoading(true);
    const results = { positions: [], watchActive: [], watchPassive: [], watchFiducenter: [] };

    const processCategory = async (items, category, resultKey) => {
      for (const item of items) {
        setLoadingTicker(item.ticker);
        const yahooData = await fetchYahooData(item);

        if (yahooData) {
          const overext = calculateOverextension(yahooData.distanceMM20, yahooData.distanceMM50);
          const exitSig = calculateExitSignal(
            yahooData.perf1D, yahooData.perf2D,
            yahooData.distanceMM20, yahooData.relVol
          );

          // Ajouter entry/stop/qty/entryDate pour les positions
          const row = {
            ...yahooData,
            overext,
            exitSig,
            entry: item.entry || null,
            stop: stopConfig[item.ticker] || null,
            qty: item.qty || null,
            entryDate: item.entryDate || null
          };

          const decision = calculateDecision(row, category);

          results[resultKey].push({ ...row, decision, category });
        }

        await new Promise(r => setTimeout(r, 250));
      }
    };

    await processCategory(POSITIONS, 'position', 'positions');
    await processCategory(WATCHLIST_ACTIVE, 'watchActive', 'watchActive');
    await processCategory(WATCHLIST_PASSIVE, 'watchPassive', 'watchPassive');
    await processCategory(WATCHLIST_FIDUCENTER, 'watchPassive', 'watchFiducenter');

    setData(results);
    setLoadingTicker('');
    setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    setLoading(false);
  }, [stopConfig]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ═══════════════════════════════════════════════════════════════════════════
  // FORMATAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const fmt = (val, dec = 1) => val !== null && val !== undefined ? val.toFixed(dec) : '-';
  const fmtPct = (val) => {
    if (val === null || val === undefined) return '-';
    const color = val >= 0 ? '#4caf50' : '#f44336';
    return <span style={{ color }}>{val.toFixed(1)}%</span>;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  const renderTable = (items, title, color, showPositionCols = false) => (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{ color, marginBottom: '10px', borderBottom: `2px solid ${color}`, paddingBottom: '5px' }}>
        {title} ({items.length})
      </h3>
      <table className="data-table" style={{ fontSize: '0.85rem', width: '100%' }}>
        <thead>
          <tr>
            <th>Ticker</th>
            <th style={{ backgroundColor: '#2a2a4a', textAlign: 'center', minWidth: '100px' }}>DÉCISION</th>
            <th>Prix</th>
            <th>MM20%</th>
            <th>MM50%</th>
            <th>OverExt</th>
            <th>J</th>
            <th>J-1</th>
            <th>RelVol</th>
            <th>ExitSig</th>
            {showPositionCols && (
              <>
                <th>Qty</th>
                <th>Entry</th>
                <th>Stop</th>
                <th>P/L%</th>
                <th>R</th>
                <th>Dist Stop</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map(row => (
            <tr key={row.ticker}>
              <td>
                <a
                  href={`https://finviz.com/quote.ashx?t=${row.ticker}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#e91e63', fontWeight: 'bold' }}
                >
                  {row.ticker}
                </a>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>{row.name}</div>
              </td>
              <td style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                <span style={{ color: row.decision.color, fontSize: '1.1rem' }}>
                  {row.decision.icon}
                </span>
                <div style={{ fontSize: '0.75rem', color: row.decision.color }}>
                  {row.decision.decision}
                </div>
              </td>
              <td>${fmt(row.price, 2)}</td>
              <td>{fmtPct(row.distanceMM20)}</td>
              <td>{fmtPct(row.distanceMM50)}</td>
              <td>
                <span style={{ color: row.overext.color }}>{row.overext.score}</span>
              </td>
              <td>{fmtPct(row.perf1D)}</td>
              <td>{fmtPct(row.perf2D)}</td>
              <td style={{ color: row.relVol >= 1 ? '#4caf50' : '#888' }}>
                {fmt(row.relVol, 2)}
              </td>
              <td>
                <span style={{ color: row.exitSig.color }}>{row.exitSig.icon}</span>
              </td>
              {showPositionCols && (
                <>
                  <td style={{ color: '#888' }}>{row.qty || '-'}</td>
                  <td style={{ color: '#61dafb' }}>${fmt(row.entry, 2)}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={stopConfig[row.ticker] || ''}
                      onChange={(e) => saveStopConfig(row.ticker, e.target.value)}
                      style={{
                        width: '65px',
                        backgroundColor: '#1a1a2e',
                        color: '#ff9800',
                        border: '1px solid #333',
                        padding: '3px',
                        borderRadius: '3px'
                      }}
                      placeholder="Stop"
                    />
                  </td>
                  <td style={{
                    fontWeight: 'bold',
                    color: row.pl >= 10 ? '#4caf50' : row.pl >= 0 ? '#8bc34a' : '#f44336'
                  }}>
                    {row.pl !== undefined ? `${row.pl >= 0 ? '+' : ''}${row.pl.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{
                    color: row.currentR >= 1.5 ? '#4caf50' : row.currentR >= 0 ? '#ff9800' : '#f44336',
                    fontWeight: 'bold'
                  }}>
                    {row.currentR !== undefined ? `${row.currentR.toFixed(1)}R` : '-'}
                  </td>
                  <td style={{
                    color: row.distanceToStop !== undefined
                      ? (row.distanceToStop < 3 ? '#f44336' : row.distanceToStop < 5 ? '#ff9800' : '#4caf50')
                      : '#666'
                  }}>
                    {row.distanceToStop !== undefined ? `${row.distanceToStop.toFixed(1)}%` : '-'}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="App">
      <header className="App-header">
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => navigate('/')}>Accueil</button>
          <button className="nav-button" onClick={() => navigate('/performer')}>Performer</button>
        </div>

        <h1 style={{ marginBottom: '10px', color: '#e91e63' }}>
          Decision Tracker
        </h1>
        <p className="subtitle">
          Dois-je agir, attendre ou ne rien faire ?
        </p>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 20px',
              backgroundColor: loading ? '#666' : '#e91e63',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? `Chargement ${loadingTicker}...` : 'Rafraîchir'}
          </button>
          {lastUpdate && (
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              MAJ: {lastUpdate}
            </span>
          )}
        </div>

        {/* Légende décisions */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
          fontSize: '0.8rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span>🚨 <span style={{ color: '#ff0000' }}>EXIT</span></span>
          <span>🎯 <span style={{ color: '#4caf50' }}>TP1 READY</span></span>
          <span>➕ <span style={{ color: '#2196f3' }}>ADD</span></span>
          <span>⏳ <span style={{ color: '#9c27b0' }}>HOLD</span></span>
          <span>✅ <span style={{ color: '#4caf50' }}>ENTRY</span></span>
          <span>👁️ <span style={{ color: '#ff9800' }}>WATCH</span></span>
          <span>🚫 <span style={{ color: '#666' }}>DO NOTHING</span></span>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          {renderTable(data.positions, 'A. Positions Ouvertes', '#4caf50', true)}

          {/* Graphiques des positions ouvertes */}
          {data.positions.length > 0 && (
            <div style={{
              marginBottom: '30px',
              padding: '15px',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '8px',
              border: '1px solid #4caf50'
            }}>
              <h3 style={{ color: '#4caf50', marginBottom: '15px', textAlign: 'center' }}>
                Graphiques Positions (30 jours)
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {data.positions.map((row, index) => (
                  <div key={row.ticker} style={{
                    backgroundColor: '#1a1d21',
                    borderRadius: '8px',
                    padding: '15px',
                    border: `1px solid ${row.decision.color}`
                  }}>
                    <h4 style={{
                      color: row.decision.color,
                      marginBottom: '10px',
                      textAlign: 'center',
                      fontSize: '1rem'
                    }}>
                      {row.ticker}
                      <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '8px' }}>
                        ${row.price?.toFixed(2)}
                      </span>
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: row.decision.color + '30',
                        fontSize: '0.75rem'
                      }}>
                        {row.decision.icon} {row.decision.decision}
                      </span>
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart
                        data={row.dailyReturns || []}
                        margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#888"
                          tick={{ fill: '#888', fontSize: 9 }}
                          interval={Math.floor((row.dailyReturns?.length || 1) / 5)}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#61dafb"
                          tick={{ fill: '#61dafb', fontSize: 10 }}
                          tickFormatter={(v) => `$${v.toFixed(0)}`}
                          domain={['auto', 'auto']}
                          width={45}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#888"
                          tick={{ fill: '#888', fontSize: 10 }}
                          tickFormatter={(v) => `${v.toFixed(0)}%`}
                          domain={['auto', 'auto']}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a2e',
                            border: '1px solid #333',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}
                          formatter={(value, name) => {
                            if (name === 'price') return [`$${value.toFixed(2)}`, 'Prix'];
                            const color = value >= 0 ? '#4caf50' : '#f44336';
                            return [<span style={{ color }}>{value.toFixed(2)}%</span>, 'J'];
                          }}
                        />
                        <ReferenceLine yAxisId="right" y={0} stroke="#666" />
                        {/* Ligne pointillée au niveau du prix d'entrée avec label */}
                        {row.entry && (
                          <ReferenceLine
                            yAxisId="left"
                            y={row.entry}
                            stroke="#ff9800"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            label={{
                              value: `${row.entryDate ? row.entryDate.substring(0, 5).replace('-', '/') : ''} @ $${row.entry.toFixed(0)}`,
                              position: 'right',
                              fill: '#ff9800',
                              fontSize: 10,
                              fontWeight: 'bold'
                            }}
                          />
                        )}
                        <Bar yAxisId="right" dataKey="return" radius={[2, 2, 0, 0]}>
                          {(row.dailyReturns || []).map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={entry.return >= 0 ? '#4caf50' : '#f44336'}
                            />
                          ))}
                        </Bar>
                        <Line
                          yAxisId="left"
                          type="linear"
                          dataKey="price"
                          stroke="#61dafb"
                          strokeWidth={2}
                          dot={(props) => {
                            const { cx, cy, index } = props;
                            if (!row.entryDate || !row.dailyReturns) return null;

                            // Convertir entryDate 'DD-MM-YYYY' en 'DD/MM' pour comparer
                            const [day, month] = row.entryDate.split('-');
                            const entryDateFormatted = `${day}/${month}`;

                            // Trouver l'index correspondant à la date d'entrée
                            const entryIdx = row.dailyReturns.findIndex(d => d.date === entryDateFormatted);

                            // Afficher un gros point orange sur le jour d'entrée
                            if (index === entryIdx) {
                              return (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={8}
                                  fill="#ff9800"
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              );
                            }
                            return null;
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    {/* Info P/L sous le graphique */}
                    {row.pl !== undefined && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        marginTop: '8px',
                        fontSize: '0.8rem'
                      }}>
                        <span>
                          Entry: <span style={{ color: '#61dafb' }}>${row.entry?.toFixed(2)}</span>
                        </span>
                        <span>
                          P/L: <span style={{ color: row.pl >= 0 ? '#4caf50' : '#f44336' }}>
                            {row.pl >= 0 ? '+' : ''}{row.pl.toFixed(1)}%
                          </span>
                        </span>
                        {row.currentR !== undefined && (
                          <span>
                            R: <span style={{
                              color: row.currentR >= 1.5 ? '#4caf50' : row.currentR >= 0 ? '#ff9800' : '#f44336'
                            }}>
                              {row.currentR.toFixed(1)}R
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderTable(data.watchActive, 'B. Watchlist Active', '#2196f3', false)}
          {renderTable(data.watchPassive, 'C. Watchlist Passive', '#9c27b0', false)}
          {renderTable(data.watchFiducenter, 'D. Watchlist Fiducenter 65/35', '#00bcd4', false)}
        </div>
      </header>
    </div>
  );
}

export default PortfolioPerformerChoose;
