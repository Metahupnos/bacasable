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

const PROXY_URL = 'http://localhost:4001';

// ═══════════════════════════════════════════════════════════════════════════
// SCREENERS FINVIZ - Deux variantes disponibles
// ═══════════════════════════════════════════════════════════════════════════
// Wide Mode: Finviz sans sh_relvol_o0.75 (univers large)
// Momentum Mode: Finviz avec sh_relvol_o0.75 (pré-filtre RelVol > 0.75)
// Filtre interne: toujours RelVol > 0.8
// ═══════════════════════════════════════════════════════════════════════════
const getScreeners = (wideMode) => ({
  healthcare: {
    name: 'Healthcare Top Performers',
    filters: wideMode
      ? 'sec_healthcare,sh_avgvol_o1000,sh_price_o10'
      : 'sec_healthcare,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75',
    sort: '-perf1w',
    color: '#e91e63',
    order: 1
  },
  technology: {
    name: 'Technology Top Performers',
    filters: wideMode
      ? 'sec_technology,sh_avgvol_o1000,sh_price_o10'
      : 'sec_technology,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75',
    sort: '-perf1w',
    color: '#673ab7',
    order: 2
  },
  financial: {
    name: 'Financial Top Performers',
    filters: wideMode
      ? 'sec_financial,sh_avgvol_o1000,sh_price_o10'
      : 'sec_financial,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75',
    sort: '-perf1w',
    color: '#2196f3',
    order: 3
  },
  energy: {
    name: 'Energy Top Performers',
    filters: wideMode
      ? 'sec_energy,sh_avgvol_o1000,sh_price_o10'
      : 'sec_energy,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75',
    sort: '-perf1w',
    color: '#ff9800',
    order: 4
  },
  materials: {
    name: 'Materials Top Performers',
    filters: wideMode
      ? 'sec_basicmaterials,sh_avgvol_o1000,sh_price_o10'
      : 'sec_basicmaterials,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75',
    sort: '-perf1w',
    color: '#795548',
    order: 5
  },
  allSectors: {
    name: 'All Sectors - Weekly Gainers',
    filters: wideMode
      ? 'sh_avgvol_o1000,sh_price_o10'
      : 'sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75',
    sort: '-perf1w',
    color: '#4caf50',
    order: 6
  }
});

function PortfolioPerformer() {
  const navigate = useNavigate();
  const [selectedScreener, setSelectedScreener] = useState('healthcare');
  const [wideMode, setWideMode] = useState(false); // Momentum mode par défaut (Finviz avec RelVol)
  const [viewMode, setViewMode] = useState('setups'); // 'setups' par défaut (générateur d'ENTRY)
  const [showHelp, setShowHelp] = useState(false); // Panneau d'aide

  // Générer les screeners selon le mode
  const SCREENERS = getScreeners(wideMode);
  const [, setTickers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingTicker, setLoadingTicker] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'perfWeek', direction: 'desc' });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION TRADING (anti-surtrading)
  // ═══════════════════════════════════════════════════════════════════════════
  const [tradingConfig] = useState({
    maxOpenPositions: 2,      // Max positions simultanées
    maxDailyEntries: 2,       // Max entrées par jour
    // Liquidité dynamique selon prix:
    // - Price < 20$: $AvgVol >= 8M
    // - Price >= 20$: $AvgVol >= 12M
    // - OU AvgVol >= 800K (filet de sécurité)
    minAvgVolumeSafety: 800000,     // Filet de sécurité: 800K shares
    minDollarVolumeLow: 8000000,    // Pour actions < 20$: $8M
    minDollarVolumeHigh: 12000000,  // Pour actions >= 20$: $12M
    priceThreshold: 20              // Seuil de prix pour switch
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET REGIME - Filtre global basé sur SPY (S&P 500)
  // ═══════════════════════════════════════════════════════════════════════════
  // ON: SPY > MM200 → trading normal
  // CAUTION: MM50 < SPY < MM200 → size -1%
  // OFF: SPY < MM50 → ENTRY_ZONE devient WATCH
  // ═══════════════════════════════════════════════════════════════════════════
  const [marketRegime, setMarketRegime] = useState({
    status: 'ON',        // ON, CAUTION, OFF
    spyPrice: null,
    spyMM50: null,
    spyMM200: null,
    lastUpdate: null
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE JOURNAL (persisté en localStorage)
  // ═══════════════════════════════════════════════════════════════════════════
  const JOURNAL_KEY = 'portfolioPerformer_tradeJournal';

  // Charger le journal depuis localStorage
  const loadJournal = () => {
    try {
      const saved = localStorage.getItem(JOURNAL_KEY);
      return saved ? JSON.parse(saved) : { trades: [], openPositions: [] };
    } catch {
      return { trades: [], openPositions: [] };
    }
  };

  // Sauvegarder le journal
  const saveJournal = (journal) => {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal));
  };

  const [journal, setJournal] = useState(loadJournal);

  // Positions actuellement ouvertes
  const openPositions = journal.openPositions || [];

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER: Compter les trades ouverts aujourd'hui
  // ═══════════════════════════════════════════════════════════════════════════
  const getTodayOpenedCount = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return journal.trades.filter(t =>
      t.timestamp && t.timestamp.startsWith(today)
    ).length;
  };

  // Vérifier si un secteur a déjà une position ouverte
  const isSectorFull = (sector) => {
    if (!sector || sector === 'allSectors') return false; // Pas de limite pour "All Sectors"
    return journal.trades.some(t => t.status === 'OPEN' && t.sector === sector);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // OUVRIR UNE POSITION - Avec sécurités anti-surtrading
  // ═══════════════════════════════════════════════════════════════════════════
  const openTrade = (tickerData, sector = null) => {
    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ SÉCURITÉ 1: Vérifier si le ticker est déjà en position                 │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (openPositions.includes(tickerData.ticker)) {
      alert(`❌ Position déjà ouverte sur ${tickerData.ticker}`);
      return null;
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ SÉCURITÉ 2: Vérifier si maxOpenPositions est atteint                   │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (openPositions.length >= tradingConfig.maxOpenPositions) {
      alert(`❌ Maximum de ${tradingConfig.maxOpenPositions} position(s) atteint`);
      return null;
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ SÉCURITÉ 3: Vérifier si maxDailyEntries est atteint                    │
    // └─────────────────────────────────────────────────────────────────────────┘
    const todayCount = getTodayOpenedCount();
    if (todayCount >= tradingConfig.maxDailyEntries) {
      alert(`❌ Maximum de ${tradingConfig.maxDailyEntries} entrée(s) par jour atteint (${todayCount} aujourd'hui)`);
      return null;
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ SÉCURITÉ 4 (P5): Vérifier limite par secteur (max 1 position/secteur) │
    // └─────────────────────────────────────────────────────────────────────────┘
    const effectiveSector = sector || selectedScreener;
    if (effectiveSector && effectiveSector !== 'allSectors' && isSectorFull(effectiveSector)) {
      const sectorName = SCREENERS[effectiveSector]?.name || effectiveSector;
      alert(`❌ Position déjà ouverte dans le secteur ${sectorName}`);
      return null;
    }

    // Créer le trade
    const trade = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ticker: tickerData.ticker,
      sector: effectiveSector,  // P5: Stocker le secteur
      type: tickerData.tradeType?.type || 'Unknown',
      setupScore: tickerData.momentumScore,
      overExt: tickerData.overextension?.score || 0,
      sizePct: tickerData.positionSize?.pct || 0,
      entryPrice: tickerData.price,
      stopPriceInitial: tickerData.stopTP?.stopPrice,
      stopPriceCurrent: tickerData.stopTP?.stopPrice,
      tp1Price: tickerData.stopTP?.tp1Price,
      tp2Price: tickerData.stopTP?.tp2Price,
      tp1Done: false,
      exitPrice: null,
      exitReason: null,
      rMultiple: null,
      status: 'OPEN',
      notes: '',
      // Time Stop tracking (P2)
      highestPrice: tickerData.price,           // Plus haut atteint depuis entrée
      highestPriceDate: new Date().toISOString() // Date du plus haut
    };

    const newJournal = {
      ...journal,
      openPositions: [...journal.openPositions, tickerData.ticker],
      trades: [...journal.trades, trade]
    };
    setJournal(newJournal);
    saveJournal(newJournal);
    return trade;
  };

  // Fermer une position
  const closeTrade = (ticker, exitPrice, exitReason) => {
    const updatedTrades = journal.trades.map(trade => {
      if (trade.ticker === ticker && trade.status === 'OPEN') {
        // Calcul du R multiple
        // Si TP1 fait: pondérer 50% au prix TP1, 50% au prix final
        let effectiveExitPrice = exitPrice;
        if (trade.tp1Done && trade.tp1Price) {
          effectiveExitPrice = (trade.tp1Price + exitPrice) / 2;
        }

        const riskPerShare = trade.entryPrice - trade.stopPriceInitial;
        const profitPerShare = effectiveExitPrice - trade.entryPrice;
        const rMultiple = riskPerShare !== 0 ? profitPerShare / riskPerShare : 0;

        return {
          ...trade,
          exitPrice,
          exitReason,
          rMultiple: Math.round(rMultiple * 100) / 100,
          status: 'CLOSED',
          closedAt: new Date().toISOString()
        };
      }
      return trade;
    });

    const newJournal = {
      ...journal,
      openPositions: journal.openPositions.filter(t => t !== ticker),
      trades: updatedTrades
    };
    setJournal(newJournal);
    saveJournal(newJournal);
  };

  // Obtenir la position ouverte pour un ticker
  const getOpenPosition = (ticker) => {
    return journal.trades.find(t => t.ticker === ticker && t.status === 'OPEN');
  };

  // Mettre à jour une position (TP1 hit, ajuster stop, etc.)
  const updatePosition = (ticker, updates) => {
    const updatedTrades = journal.trades.map(trade => {
      if (trade.ticker === ticker && trade.status === 'OPEN') {
        return { ...trade, ...updates, updatedAt: new Date().toISOString() };
      }
      return trade;
    });

    const newJournal = { ...journal, trades: updatedTrades };
    setJournal(newJournal);
    saveJournal(newJournal);
  };

  // Marquer TP1 comme atteint et remonter le stop à break-even
  const handleTp1Hit = (ticker) => {
    const position = getOpenPosition(ticker);
    if (position && !position.tp1Done) {
      updatePosition(ticker, {
        tp1Done: true,
        stopPriceCurrent: position.entryPrice, // Break-even
        tp1HitAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME STOP CONFIGURATION (P2 - Anti-trades morts)
  // ═══════════════════════════════════════════════════════════════════════════
  const TIME_STOP_CONFIG = {
    warningDays: 7,     // Jours sans nouveau high avant WARNING
    exitDays: 14        // Jours sans nouveau high avant EXIT_TIME
  };

  // Calculer le nombre de jours ouvrés entre deux dates
  const getWorkingDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      // Exclure samedi (6) et dimanche (0)
      if (day !== 0 && day !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Mettre à jour le plus haut atteint pour une position
  const updateHighestPrice = (ticker, currentPrice) => {
    const position = getOpenPosition(ticker);
    if (!position || currentPrice == null) return false;

    // Si nouveau high, mettre à jour
    if (currentPrice > (position.highestPrice || position.entryPrice)) {
      updatePosition(ticker, {
        highestPrice: currentPrice,
        highestPriceDate: new Date().toISOString()
      });
      return true;
    }
    return false;
  };

  // Calculer le status Time Stop pour une position
  const getTimeStopStatus = (ticker) => {
    const position = getOpenPosition(ticker);
    if (!position) return null;

    const now = new Date();
    const highDate = position.highestPriceDate
      ? new Date(position.highestPriceDate)
      : new Date(position.timestamp);

    const daysWithoutNewHigh = getWorkingDaysBetween(highDate, now);
    const entryDate = new Date(position.timestamp);
    const daysInTrade = getWorkingDaysBetween(entryDate, now);

    // EXIT_TIME: Plus de 14 jours ouvrés sans nouveau high
    if (daysWithoutNewHigh >= TIME_STOP_CONFIG.exitDays) {
      return {
        status: 'EXIT_TIME',
        color: '#ff0000',
        icon: '⏰',
        daysWithoutNewHigh,
        daysInTrade,
        message: `${daysWithoutNewHigh}j sans new high → SORTIR`
      };
    }

    // WARNING: Plus de 7 jours ouvrés sans nouveau high
    if (daysWithoutNewHigh >= TIME_STOP_CONFIG.warningDays) {
      return {
        status: 'WARNING',
        color: '#ff9800',
        icon: '⏳',
        daysWithoutNewHigh,
        daysInTrade,
        message: `${daysWithoutNewHigh}j sans new high`
      };
    }

    // OK: Trade actif, pas de time stop
    return {
      status: 'OK',
      color: '#4caf50',
      icon: '✓',
      daysWithoutNewHigh,
      daysInTrade,
      message: daysInTrade > 0 ? `J+${daysInTrade}` : 'Nouveau'
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VÉRIFIER LE STATUS D'UNE POSITION - Avec null-guards et Time Stop
  // ═══════════════════════════════════════════════════════════════════════════
  const checkPositionStatus = (ticker, currentPrice) => {
    const position = getOpenPosition(ticker);
    if (!position) return null;

    // Null-guards: vérifier que les prix sont définis
    if (currentPrice == null) return null;

    // Mettre à jour le plus haut si nouveau high
    updateHighestPrice(ticker, currentPrice);

    // Vérifier si stop touché (seulement si stopPriceCurrent est défini)
    if (position.stopPriceCurrent != null && currentPrice <= position.stopPriceCurrent) {
      return { action: 'STOP', reason: position.tp1Done ? 'STOP_BE' : 'STOP', price: currentPrice };
    }

    // Vérifier si TP2 touché (seulement si tp2Price est défini)
    if (position.tp2Price != null && currentPrice >= position.tp2Price) {
      return { action: 'CLOSE', reason: 'TP2', price: currentPrice };
    }

    // Vérifier si TP1 touché (seulement si tp1Price est défini et pas encore fait)
    if (!position.tp1Done && position.tp1Price != null && currentPrice >= position.tp1Price) {
      return { action: 'TP1_HIT', reason: 'TP1', price: currentPrice };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ TIME STOP - Vérifier si le trade est "mort"                            │
    // │ EXIT_TIME après 14 jours sans nouveau high                             │
    // └─────────────────────────────────────────────────────────────────────────┘
    const timeStop = getTimeStopStatus(ticker);
    if (timeStop?.status === 'EXIT_TIME') {
      return { action: 'TIME_EXIT', reason: 'TIME_STOP', price: currentPrice, timeStop };
    }

    return null;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCULER LES STATISTIQUES - Avec tri chronologique pour maxDrawdown
  // ═══════════════════════════════════════════════════════════════════════════
  const getJournalStats = () => {
    const closedTrades = journal.trades.filter(t => t.status === 'CLOSED');
    if (closedTrades.length === 0) return null;

    // Trier par date de clôture pour un calcul correct du drawdown
    const sortedTrades = [...closedTrades].sort((a, b) => {
      const dateA = a.closedAt || a.timestamp || '';
      const dateB = b.closedAt || b.timestamp || '';
      return dateA.localeCompare(dateB);
    });

    const wins = sortedTrades.filter(t => t.rMultiple > 0);
    const losses = sortedTrades.filter(t => t.rMultiple <= 0);

    const totalR = sortedTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0);
    const avgR = totalR / sortedTrades.length;
    const winRate = (wins.length / sortedTrades.length) * 100;

    const grossProfit = wins.reduce((sum, t) => sum + (t.rMultiple || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.rMultiple || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit;

    // Max drawdown (série de pertes consécutives en R) - sur trades triés chronologiquement
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    sortedTrades.forEach(t => {
      if ((t.rMultiple || 0) < 0) {
        currentDrawdown += t.rMultiple;
        maxDrawdown = Math.min(maxDrawdown, currentDrawdown);
      } else {
        currentDrawdown = 0;
      }
    });

    return {
      totalTrades: sortedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: Math.round(winRate),
      avgR: Math.round(avgR * 100) / 100,
      totalR: Math.round(totalR * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100
    };
  };

  // Couleurs pour les lignes du graphique
  const CHART_COLORS = ['#e91e63', '#673ab7', '#2196f3', '#ff9800', '#4caf50', '#00bcd4', '#f44336', '#9c27b0', '#009688', '#ffeb3b'];

  // Filtre "Trader Only" - critères stricts pour momentum trading
  // ═══════════════════════════════════════════════════════════════════════════
  // FILTRE TRADER - Version détaillée avec conditions individuelles
  // ═══════════════════════════════════════════════════════════════════════════
  // Seuil RelVol fixe pour le filtre interne (Finviz gère le pré-filtre)
  const relVolThreshold = 0.8;

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTRE TRADER - P4: Utilise RelVol3D pour confirmation volume
  // ═══════════════════════════════════════════════════════════════════════════
  const getFilterDetails = (data) => {
    // P4: Utiliser RelVol3D (moyenne 3 jours) au lieu de RelVol (jour unique)
    // Fallback sur relVolume si relVolume3D n'est pas disponible
    const effectiveRelVol = data.relVolume3D ?? data.relVolume;

    const conditions = {
      j: { label: 'J>0', ok: data.perf1D > 0, value: data.perf1D?.toFixed(1) + '%' },
      j1: { label: 'J-1>0', ok: data.perf2D > 0, value: data.perf2D?.toFixed(1) + '%' },
      week: { label: 'Week>5%', ok: data.perfWeek > 5, value: data.perfWeek?.toFixed(1) + '%' },
      month: { label: 'Month>10%', ok: data.perfMonth > 10, value: data.perfMonth?.toFixed(1) + '%' },
      relVol: {
        label: `RelVol3D>${relVolThreshold}`,
        ok: effectiveRelVol > relVolThreshold,
        value: effectiveRelVol?.toFixed(2) + (data.relVolume3D ? ' (3j)' : '')
      },
      volM: { label: 'VolM<30%', ok: data.volMonth !== null && data.volMonth < 30, value: data.volMonth?.toFixed(1) + '%' }
    };

    const allPass = Object.values(conditions).every(c => c.ok);
    const failedConditions = Object.entries(conditions).filter(([, c]) => !c.ok).map(([key]) => key);

    return {
      passes: allPass,
      conditions,
      failedConditions
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NEXT TRIGGER - Ce qu'il faut attendre pour passer ENTRY
  // ═══════════════════════════════════════════════════════════════════════════
  const getNextTrigger = (data, filterDetails, exitSignal) => {
    const triggers = [];

    // ExitSig doit être NONE
    if (exitSignal.signal === 'WARNING') {
      triggers.push('ExitSig → NONE');
    }
    if (exitSignal.signal === 'EXIT') {
      triggers.push('ExitSig 🚨 → NONE');
    }

    // Conditions du filtre qui échouent
    if (!filterDetails.conditions.j.ok || !filterDetails.conditions.j1.ok) {
      triggers.push('2 jours verts');
    }
    if (!filterDetails.conditions.relVol.ok) {
      triggers.push(`RelVol > ${relVolThreshold}`);
    }
    if (!filterDetails.conditions.week.ok) {
      triggers.push('Week > 5%');
    }
    if (!filterDetails.conditions.month.ok) {
      triggers.push('Month > 10%');
    }
    if (!filterDetails.conditions.volM.ok) {
      triggers.push('VolM < 30%');
    }

    return triggers.length > 0 ? triggers.join(' | ') : '—';
  };

  // Calcul du Momentum Score (0-100)
  const calculateMomentumScore = (data) => {
    // Vérifier seulement Week et Month (J et J-1 peuvent être 0/null avant ouverture marché)
    if (data.perfWeek == null || data.perfMonth == null) return null;

    // Utiliser 0 comme défaut pour J et J-1 si null (marché pas encore ouvert)
    const perf1D = data.perf1D ?? 0;
    const perf2D = data.perf2D ?? 0;

    // Normalisation du Rel Vol (plafonné à 2)
    const relVolNormalized = Math.min(data.relVolume || 1, 2) / 2 * 100;

    // Normalisation de la volatilité inversée (moins = mieux, plafonné à 50%)
    const volMNormalized = data.volMonth ? Math.max(0, 100 - (data.volMonth / 50 * 100)) : 50;

    // Normalisation des performances (plafonné entre -50 et +50 pour éviter les outliers)
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    const weekNorm = clamp(data.perfWeek, -50, 50) + 50; // 0-100
    const monthNorm = clamp(data.perfMonth, -50, 50) + 50; // 0-100
    const jNorm = clamp(perf1D + perf2D, -20, 20) + 20; // 0-40, puis *2.5 pour 0-100
    const jNormalized = jNorm * 2.5;

    // Calcul du score pondéré
    const score =
      0.30 * weekNorm +
      0.25 * monthNorm +
      0.20 * jNormalized +
      0.15 * relVolNormalized +
      0.10 * volMNormalized;

    return Math.round(Math.max(0, Math.min(100, score)));
  };

  // Détection "Late Move" - mouvement tardif, potentiellement risqué
  // Month > 100% ET volatilité week > volatilité month (accélération récente)
  const isLateMove = (data) => {
    return data.perfMonth > 100 &&
           data.volWeek !== null &&
           data.volMonth !== null &&
           data.volWeek > data.volMonth;
  };

  // Déterminer le Trade Type
  const getTradeType = (data) => {
    // Breakout: forte accélération récente avec volume
    // J et J-1 forts (>3%), RelVol élevé (>1.5), distance MM20 > 5%
    if (data.perf1D > 3 && data.perf2D > 2 && data.relVolume > 1.5 && data.distanceMM20 > 5) {
      return { type: 'Breakout', color: '#ff9800', icon: '🚀' };
    }

    // Rebound: rebond après correction
    // J positif, mais J-2 ou J-3 négatifs, proche de MM20 (<5%)
    if (data.perf1D > 0 && (data.perf3D < 0 || data.perf4D < 0) &&
        data.distanceMM20 !== null && Math.abs(data.distanceMM20) < 5) {
      return { type: 'Rebound', color: '#2196f3', icon: '↩️' };
    }

    // Continuation: tendance régulière
    // Week et Month positifs, volatilité modérée, proche de MM20
    if (data.perfWeek > 0 && data.perfMonth > 0 &&
        data.volMonth !== null && data.volMonth < 25 &&
        data.distanceMM20 !== null && data.distanceMM20 < 15) {
      return { type: 'Continuation', color: '#4caf50', icon: '📈' };
    }

    // Par défaut: Momentum (cas général)
    return { type: 'Momentum', color: '#9c27b0', icon: '⚡' };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1: OVEREXTENSION SCORE
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateOverextension = (data) => {
    const mm20 = data.distanceMM20 ?? 0;
    const mm50 = data.distanceMM50 ?? 0;

    // Score RAW = (MM20 × 0.6) + (MM50 × 0.4)
    const rawScore = (mm20 * 0.6) + (mm50 * 0.4);

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ CLAMP EXPLICITE: max(0, rawScore)                                      │
    // │ Raison: On ne pénalise PAS quand le prix est SOUS les moyennes.        │
    // │ Un rebound sous MM20 reste à OverExt=0, c'est voulu.                   │
    // │ On ne favorise pas artificiellement, on refuse juste de pénaliser.     │
    // └─────────────────────────────────────────────────────────────────────────┘
    const score = Math.max(0, rawScore);

    // Flag selon le score
    let flag, flagColor, flagIcon;
    if (score > 100) {
      flag = 'NO_TRADE';
      flagColor = '#ff0000';
      flagIcon = '⛔';
    } else if (score > 80) {
      flag = 'NO_FULL';
      flagColor = '#ff5722';
      flagIcon = '⛔';
    } else if (score >= 50) {
      flag = 'LATE';
      flagColor = '#ff9800';
      flagIcon = '⚠️';
    } else {
      flag = 'OK';
      flagColor = '#4caf50';
      flagIcon = '✓';
    }

    return { score: Math.round(score), flag, flagColor, flagIcon };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2: POSITION SIZE RECOMMANDÉE
  // ═══════════════════════════════════════════════════════════════════════════
  const calculatePositionSize = (data, overextension) => {
    // Taille de base selon Trade Type
    let basePct;
    switch (data.tradeType?.type) {
      case 'Breakout':
        basePct = 3;
        break;
      case 'Momentum':
        basePct = 4.5;
        break;
      case 'Rebound':
        basePct = 6;
        break;
      default:
        basePct = 4; // Continuation ou autre
    }

    // Pénalités
    let penalty = 0;
    if (overextension.flag === 'LATE') penalty += 1;
    if (overextension.flag === 'NO_FULL' || overextension.flag === 'NO_TRADE') penalty += 2;
    if (data.volMonth > 25) penalty += 1;

    // Calcul final avec limites [2%, 6%]
    const finalPct = Math.max(2, Math.min(6, basePct - penalty));

    return { pct: finalPct, base: basePct, penalty };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3: STOP LOSS & TAKE PROFIT EN R (P3)
  // ═══════════════════════════════════════════════════════════════════════════
  // TP1 = 1.5R (vendre 50%, remonter stop à break-even)
  // TP2 = 3R (vendre les 50% restants)
  // R = Entry - Stop (risque par action)
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateStopTP = (data) => {
    const price = data.price;
    if (!price) return { stopPct: null, stopPrice: null, tp1Price: null, tp2Price: null, tp1R: null, tp2R: null };

    // Stop Loss selon Trade Type
    let stopPct;
    switch (data.tradeType?.type) {
      case 'Breakout':
        stopPct = -6;
        break;
      case 'Momentum':
        stopPct = -5;
        break;
      case 'Rebound':
        stopPct = -4;
        break;
      default:
        stopPct = -5; // Continuation
    }

    // Calcul du stop price
    const stopPrice = price * (1 + stopPct / 100);

    // Calcul du risque R (en dollars par action)
    const riskPerShare = price - stopPrice;  // R = Entry - Stop

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ TP DYNAMIQUES EN R                                                     │
    // │ TP1 = Entry + 1.5R → Vendre 50%, remonter stop à break-even           │
    // │ TP2 = Entry + 3R   → Vendre les 50% restants                          │
    // └─────────────────────────────────────────────────────────────────────────┘
    const tp1R = 1.5;
    const tp2R = 3.0;
    const tp1Price = price + (riskPerShare * tp1R);
    const tp2Price = price + (riskPerShare * tp2R);

    // Calcul des % pour affichage
    const tp1Pct = ((tp1Price - price) / price) * 100;
    const tp2Pct = ((tp2Price - price) / price) * 100;

    return {
      stopPct,
      stopPrice,
      tp1Price,
      tp2Price,
      tp1R,
      tp2R,
      tp1Pct,
      tp2Pct,
      riskPerShare
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4: EXIT SIGNAL
  // ═══════════════════════════════════════════════════════════════════════════
  // 🚨 EXIT = Signal de sortie immédiate (ou interdiction d'entrée)
  // ⚠️ WARNING = Pré-signal, prudence requise
  // NONE = Pas de signal de sortie
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateExitSignal = (data) => {
    // Gestion des valeurs nulles (marché pas encore ouvert)
    const perf1D = data.perf1D ?? 0;
    const perf2D = data.perf2D ?? 0;

    // EXIT si: J < 0 ET J-1 < 0 (deux jours rouges consécutifs)
    const twoRedDays = (perf1D < 0 && perf2D < 0);

    // EXIT si: Close < MM20 (sous la moyenne mobile)
    const belowMM20 = data.distanceMM20 !== null && data.distanceMM20 < 0;

    // WARNING si: RelVol3D < 0.8 (volume en baisse) - P4: utiliser moyenne 3 jours
    const effectiveRelVol = data.relVolume3D ?? data.relVolume ?? 1;
    const lowVolume = effectiveRelVol < 0.8;

    // WARNING si: J < 0 mais J-1 > 0 (premier jour rouge)
    const firstRedDay = (perf1D < 0 && perf2D >= 0);

    // Déterminer le signal
    if (twoRedDays || belowMM20) {
      const reasons = [];
      if (twoRedDays) reasons.push('2 jours rouges');
      if (belowMM20) reasons.push('Sous MM20');
      return { signal: 'EXIT', color: '#ff0000', icon: '🚨', label: '🚨', reason: reasons.join(' + ') };
    }
    if (lowVolume || firstRedDay) {
      const reasons = [];
      if (lowVolume) reasons.push('RelVol < 0.8');
      if (firstRedDay) reasons.push('1er jour rouge');
      return { signal: 'WARNING', color: '#ff9800', icon: '⚠️', label: '⚠️', reason: reasons.join(' + ') };
    }
    return { signal: 'NONE', color: '#666', icon: '—', label: 'NONE', reason: 'Pas de signal' };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 5: TRADE STATE (verrou mental)
  // HIÉRARCHIE STRICTE CORRIGÉE - NE PAS MODIFIER L'ORDRE
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. IN_POSITION / EXIT_ONLY (position ouverte)
  // 2. EXIT_SIGNAL (bloquant)
  // 3. OVEREXT_NO_TRADE >100 (bloquant)
  // 4. ILLIQUID (bloquant - prérequis marché)
  // 5. FILTER_FAIL → WATCH si Score>=75, sinon NO_TRADE
  // 6. MAX_POSITIONS → WATCH
  // 7. WARNING_* → WATCH
  // 8. OK → ENTRY_ZONE
  // ═══════════════════════════════════════════════════════════════════════════
  const calculateTradeState = (data, overextension, exitSignal, config = {}) => {
    const { isMaxPositionsReached, isIlliquid, isInPosition, momentumScore, timeStopStatus } = config;

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 0: Position ouverte → IN_POSITION ou EXIT_ONLY                │
    // │ Raison: Si on a déjà une position, on gère la sortie                   │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (isInPosition) {
      // Time Stop EXIT_TIME → EXIT_ONLY (priorité sur exitSignal)
      if (timeStopStatus?.status === 'EXIT_TIME') {
        return {
          state: 'EXIT_ONLY',
          color: '#ff0000',
          icon: '⏰',
          reason: 'TIME_STOP',
          reasonText: `SORTIR - ${timeStopStatus.message}`,
          timeStop: timeStopStatus
        };
      }
      if (exitSignal.signal === 'EXIT') {
        return { state: 'EXIT_ONLY', color: '#ff0000', icon: '🚨', reason: 'EXIT_SIGNAL', reasonText: 'SORTIR - Signal EXIT actif' };
      }
      // Time Stop WARNING → prudence accrue
      if (timeStopStatus?.status === 'WARNING') {
        return {
          state: 'IN_POSITION',
          color: '#ff9800',
          icon: '⏳',
          reason: 'TIME_WARNING',
          reasonText: `Prudence - ${timeStopStatus.message}`,
          timeStop: timeStopStatus
        };
      }
      if (exitSignal.signal === 'WARNING') {
        return { state: 'IN_POSITION', color: '#ff9800', icon: '⚠️', reason: 'WARNING', reasonText: 'Position ouverte - Prudence' };
      }
      // Position OK avec timeStop info
      return {
        state: 'IN_POSITION',
        color: '#2196f3',
        icon: '📊',
        reason: 'HOLDING',
        reasonText: timeStopStatus?.daysInTrade > 0 ? `Position J+${timeStopStatus.daysInTrade}` : 'Position en cours',
        timeStop: timeStopStatus
      };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 1: ExitSignal = EXIT → NO_TRADE (override total)              │
    // │ Raison: Si le signal dit de sortir, AUCUNE entrée permise              │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (exitSignal.signal === 'EXIT') {
      return { state: 'NO_TRADE', color: '#ff0000', icon: '🚨', reason: 'EXIT_SIGNAL', reasonText: 'Signal de sortie actif' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 2: OverExtFlag = NO_TRADE → NO_TRADE                          │
    // │ Raison: Titre trop étiré (>100%), entrée interdite                     │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (overextension.flag === 'NO_TRADE') {
      return { state: 'NO_TRADE', color: '#ff0000', icon: '⛔', reason: 'OVEREXT_NO_TRADE', reasonText: 'OverExt > 100%' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 3: Illiquide → NO_TRADE (BLOQUANT)                            │
    // │ Raison: La liquidité est un prérequis de marché.                       │
    // │ Si pas de marché, rien d'autre n'a de sens.                            │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (isIlliquid) {
      return { state: 'NO_TRADE', color: '#666', icon: '💧', reason: 'ILLIQUID', reasonText: 'Volume insuffisant' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 4: Filtre Trader ✗                                            │
    // │ - Si Score >= 75 → WATCH (candidat watchlist, attendre conditions)     │
    // │ - Sinon → NO_TRADE                                                     │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (!data.passesFilter) {
      if (momentumScore >= 75) {
        return { state: 'WATCH', color: '#ff9800', icon: '👁️', reason: 'WATCH_CANDIDATE', reasonText: 'Filtre KO mais Score élevé - Candidat watchlist' };
      }
      return { state: 'NO_TRADE', color: '#666', icon: '🚫', reason: 'FILTER_FAIL', reasonText: 'Filtre trader non passé' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 5: Max positions atteint → WATCH                              │
    // │ Raison: Anti-surtrading, surveiller mais ne pas entrer                 │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (isMaxPositionsReached) {
      return { state: 'WATCH', color: '#9c27b0', icon: '🔒', reason: 'MAX_POSITIONS', reasonText: 'Max positions atteint' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 5b (P5): Secteur déjà occupé → WATCH                          │
    // │ Raison: Diversification forcée, max 1 position par secteur             │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (config.isSectorFull) {
      return { state: 'WATCH', color: '#795548', icon: '🏭', reason: 'SECTOR_FULL', reasonText: 'Secteur déjà occupé' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 6: Warning signals → WATCH (pas NO_TRADE)                     │
    // │ Raison: Prudence requise, mais pas bloquant                            │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (exitSignal.signal === 'WARNING') {
      return { state: 'WATCH', color: '#ff9800', icon: '👁️', reason: 'WARNING_SIGNAL', reasonText: 'Signal de prudence' };
    }
    if (overextension.flag === 'NO_FULL') {
      return { state: 'WATCH', color: '#ff5722', icon: '⚠️', reason: 'OVEREXT_NO_FULL', reasonText: 'OverExt > 80%' };
    }
    if (overextension.flag === 'LATE') {
      return { state: 'WATCH', color: '#ff9800', icon: '👁️', reason: 'OVEREXT_LATE', reasonText: 'OverExt 50-80%' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 7: Market Regime OFF → WATCH                                  │
    // │ Raison: Marché baissier (SPY < MM50), pas d'entrées                    │
    // └─────────────────────────────────────────────────────────────────────────┘
    if (config.marketRegimeOff) {
      return { state: 'WATCH', color: '#9c27b0', icon: '🐻', reason: 'MARKET_OFF', reasonText: 'Marché baissier - Pas d\'entrées' };
    }

    // ┌─────────────────────────────────────────────────────────────────────────┐
    // │ PRIORITÉ 8: Tout OK → ENTRY_ZONE                                       │
    // │ Raison: Tous les critères sont validés, entrée autorisée               │
    // └─────────────────────────────────────────────────────────────────────────┘
    return { state: 'ENTRY_ZONE', color: '#4caf50', icon: '✅', reason: 'OK', reasonText: 'Entrée autorisée' };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CALCUL LIQUIDITÉ DYNAMIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  // - Price < 20$: $AvgVol >= 8M
  // - Price >= 20$: $AvgVol >= 12M
  // - OU AvgVol >= 800K (filet de sécurité)
  // ═══════════════════════════════════════════════════════════════════════════
  const checkLiquidity = (price, avgVolume) => {
    const dollarAvgVolume = (price || 0) * (avgVolume || 0);

    // Filet de sécurité: volume en actions suffisant
    if (avgVolume >= tradingConfig.minAvgVolumeSafety) {
      return { isIlliquid: false, dollarAvgVolume, reason: 'VOL_OK' };
    }

    // Seuil dynamique selon le prix
    const minDollarVol = price < tradingConfig.priceThreshold
      ? tradingConfig.minDollarVolumeLow
      : tradingConfig.minDollarVolumeHigh;

    if (dollarAvgVolume >= minDollarVol) {
      return { isIlliquid: false, dollarAvgVolume, reason: 'DOLLAR_VOL_OK' };
    }

    return {
      isIlliquid: true,
      dollarAvgVolume,
      reason: `$AvgVol ${(dollarAvgVolume/1000000).toFixed(1)}M < ${(minDollarVol/1000000)}M`
    };
  };

  // Obtenir tous les tickers avec leurs scores (pour le tableau)
  const getAllScoredData = () => {
    // Phase 1: Calculs de base pour tous les tickers
    const baseData = performanceData
      .map(data => {
        // Calculs de base
        const momentumScore = calculateMomentumScore(data);
        const lateMove = isLateMove(data);
        const tradeType = getTradeType(data);
        const filterDetails = getFilterDetails(data);
        const passesFilter = filterDetails.passes;

        // Calcul liquidité dynamique selon prix
        const liquidity = checkLiquidity(data.price, data.avgVolume);
        const isIlliquid = liquidity.isIlliquid;
        const dollarAvgVolume = liquidity.dollarAvgVolume;

        // Enrichir data avec tradeType pour les calculs suivants
        const enrichedData = { ...data, tradeType, passesFilter };

        // Étape 1: Overextension
        const overextension = calculateOverextension(data);

        // Étape 2: Position Size (provisoire, sera ajusté après tradeState)
        const positionSize = calculatePositionSize(enrichedData, overextension);

        // Étape 3: Stop/TP
        const stopTP = calculateStopTP(enrichedData);

        // Étape 4: Exit Signal
        const exitSignal = calculateExitSignal(data);

        // NextTrigger pour les WATCH
        const nextTrigger = getNextTrigger(data, filterDetails, exitSignal);

        return {
          ...data,
          momentumScore,
          lateMove,
          tradeType,
          passesFilter,
          filterDetails,
          nextTrigger,
          overextension,
          positionSize,
          stopTP,
          exitSignal,
          dollarAvgVolume,
          isIlliquid,
          liquidityReason: liquidity.reason
        };
      })
      .filter(data => {
        if (data.momentumScore === null) return false;
        // En mode Setups: filtre OverExt < 90
        if (viewMode === 'setups' && data.overextension?.score >= 90) return false;
        return true;
      })
      .sort((a, b) => b.momentumScore - a.momentumScore);

    // Phase 2: Appliquer maxPositions et finaliser tradeState
    const isMaxPositionsReached = openPositions.length >= tradingConfig.maxOpenPositions;

    return baseData.map((data, index) => {
      const rank = index + 1;
      const isInPosition = openPositions.includes(data.ticker);

      // Time Stop status (seulement pour positions ouvertes)
      const timeStopStatus = isInPosition ? getTimeStopStatus(data.ticker) : null;

      // Étape 5: Trade State (avec toutes les configs)
      // P5: Vérifier si le secteur est déjà occupé
      const sectorIsFull = !isInPosition && isSectorFull(selectedScreener);

      const tradeState = calculateTradeState(
        data,
        data.overextension,
        data.exitSignal,
        {
          isMaxPositionsReached: isMaxPositionsReached && !isInPosition, // Pas bloquant si déjà en position
          isIlliquid: data.isIlliquid,
          rank,
          isInPosition,
          momentumScore: data.momentumScore,
          marketRegimeOff: marketRegime.status === 'OFF',
          timeStopStatus,  // P2: Time Stop info
          isSectorFull: sectorIsFull  // P5: Limite par secteur
        }
      );

      // ═══════════════════════════════════════════════════════════════════════
      // RÈGLE FINALE: Position Size selon State
      // - ENTRY_ZONE → Afficher taille recommandée
      // - IN_POSITION → Afficher taille (déjà en position)
      // - Autres → Size = 0 (bloqué)
      // ═══════════════════════════════════════════════════════════════════════
      // Position size avec pénalité CAUTION (-1%)
      let finalPositionSize;
      if (tradeState.state === 'ENTRY_ZONE' || tradeState.state === 'IN_POSITION' || tradeState.state === 'EXIT_ONLY') {
        const sizePct = data.positionSize.pct || 0;
        const cautionPenalty = marketRegime.status === 'CAUTION' ? 1 : 0;
        finalPositionSize = {
          ...data.positionSize,
          pct: Math.max(1, sizePct - cautionPenalty),
          cautionAdjusted: cautionPenalty > 0
        };
      } else {
        finalPositionSize = { ...data.positionSize, pct: 0, blocked: true };
      }

      return {
        ...data,
        rank,
        isInPosition,
        positionSize: finalPositionSize,
        tradeState,
        timeStopStatus  // P2: Time Stop info pour affichage
      };
    });
  };

  // Obtenir les Best Picks filtrés et scorés (tous ceux qui passent le filtre)
  const getBestPicks = () => {
    return getAllScoredData()
      .filter(data => data.passesFilter);
  };

  // Fonction pour récupérer les tickers depuis Finviz (avec pagination)
  const fetchFinvizTickers = useCallback(async () => {
    const screener = SCREENERS[selectedScreener];
    // Demander plus de tickers pour allSectors (100), moins pour les secteurs (30)
    const tickerLimit = selectedScreener === 'allSectors' ? 100 : 30;
    try {
      const response = await axios.get(`${PROXY_URL}/api/finviz/screener`, {
        params: {
          filters: screener.filters,
          sort: screener.sort,
          limit: tickerLimit
        },
        timeout: 60000 // Timeout plus long pour la pagination
      });
      return response.data.tickers;
    } catch (err) {
      console.error('Erreur Finviz:', err);
      throw new Error('Impossible de récupérer les tickers depuis Finviz');
    }
  }, [selectedScreener, SCREENERS]);

  // Fonction pour calculer les performances depuis les données Yahoo
  const calculatePerformance = (prices, timestamps, days) => {
    if (!prices || prices.length < 2) return null;

    const currentPrice = prices[prices.length - 1];
    const now = Date.now() / 1000;

    if (days === 'ytd') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
      let startIdx = timestamps.findIndex(t => t >= yearStart);
      if (startIdx === -1 || startIdx >= prices.length) return null;
      const startPrice = prices[startIdx];
      return ((currentPrice - startPrice) / startPrice) * 100;
    }

    const targetTime = now - (days * 24 * 60 * 60);
    let closestIdx = 0;
    let minDiff = Math.abs(timestamps[0] - targetTime);

    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    const startPrice = prices[closestIdx];
    if (!startPrice || startPrice === 0) return null;
    return ((currentPrice - startPrice) / startPrice) * 100;
  };

  // Fonction pour calculer la volatilité
  const calculateVolatility = (prices, days) => {
    if (!prices || prices.length < days) return null;
    const recentPrices = prices.slice(-days);
    const returns = [];

    for (let i = 1; i < recentPrices.length; i++) {
      if (recentPrices[i - 1] !== 0) {
        returns.push((recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1]);
      }
    }

    if (returns.length === 0) return null;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKET REGIME - Récupérer SPY et calculer le régime
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchMarketRegime = async () => {
    try {
      const response = await axios.get(`${PROXY_URL}/api/history/SPY/max`, {
        timeout: 15000
      });

      const data = response.data;
      if (!data?.chart?.result?.[0]) {
        console.warn('Impossible de récupérer SPY pour Market Regime');
        return;
      }

      const result = data.chart.result[0];
      const closes = result.indicators?.quote?.[0]?.close || [];

      if (closes.length < 200) {
        console.warn('Pas assez de données SPY pour calculer MM200');
        return;
      }

      // Prix actuel SPY
      const spyPrice = closes[closes.length - 1];

      // Calculer MM50 et MM200
      const last50 = closes.slice(-50).filter(p => p != null);
      const last200 = closes.slice(-200).filter(p => p != null);

      const spyMM50 = last50.length >= 50
        ? last50.reduce((a, b) => a + b, 0) / last50.length
        : null;
      const spyMM200 = last200.length >= 200
        ? last200.reduce((a, b) => a + b, 0) / last200.length
        : null;

      // Déterminer le régime
      let status = 'ON';
      if (spyPrice && spyMM50 && spyMM200) {
        if (spyPrice < spyMM50) {
          status = 'OFF';  // Bear market - pas d'entrées
        } else if (spyPrice < spyMM200) {
          status = 'CAUTION';  // Correction - réduire la taille
        } else {
          status = 'ON';  // Bull market - trading normal
        }
      }

      setMarketRegime({
        status,
        spyPrice: spyPrice?.toFixed(2),
        spyMM50: spyMM50?.toFixed(2),
        spyMM200: spyMM200?.toFixed(2),
        lastUpdate: new Date().toLocaleTimeString()
      });

      console.log(`📊 Market Regime: ${status} (SPY: $${spyPrice?.toFixed(2)}, MM50: $${spyMM50?.toFixed(2)}, MM200: $${spyMM200?.toFixed(2)})`);
    } catch (err) {
      console.error('Erreur Market Regime:', err.message);
    }
  };

  // Fonction pour récupérer les données Yahoo pour un ticker
  const fetchYahooData = async (symbol) => {
    try {
      const response = await axios.get(`${PROXY_URL}/api/history/${symbol}/max`, {
        timeout: 15000
      });

      const data = response.data;
      if (!data?.chart?.result?.[0]) return null;

      const result = data.chart.result[0];
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
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      const change = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
      const volume = meta.regularMarketVolume || 0;

      // Volume moyen (50 jours)
      const allVolumes = (quotes.volume || []).filter(v => v !== null);
      const recentVolumes = allVolumes.slice(-50);
      const avgVolume = recentVolumes.length > 0
        ? recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
        : 0;

      // ┌─────────────────────────────────────────────────────────────────────────┐
      // │ P4: RelVol moyen sur 3 jours (confirmation volume)                     │
      // │ Évite les faux signaux sur un pic de volume isolé                      │
      // └─────────────────────────────────────────────────────────────────────────┘
      const last3Volumes = allVolumes.slice(-3);
      const relVolume3D = avgVolume > 0 && last3Volumes.length >= 3
        ? (last3Volumes.reduce((sum, v) => sum + (v / avgVolume), 0) / 3)
        : null;

      // Calculer les rendements journaliers sur les 30 derniers jours ouvrés
      const last30Prices = validPrices.slice(-31); // 31 pour avoir 30 rendements
      const last30Timestamps = validTimestamps.slice(-31);
      const dailyReturns = [];

      for (let i = 1; i < last30Prices.length; i++) {
        if (last30Prices[i - 1] !== 0) {
          const returnPct = ((last30Prices[i] - last30Prices[i - 1]) / last30Prices[i - 1]) * 100;
          const date = new Date(last30Timestamps[i] * 1000);
          dailyReturns.push({
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            timestamp: last30Timestamps[i],
            return: returnPct,
            price: last30Prices[i]
          });
        }
      }

      // Rendements journaliers individuels (J, J-1, J-2, J-3, J-4, J-5)
      const len = validPrices.length;
      const perf1D = len >= 2 ? ((validPrices[len-1] - validPrices[len-2]) / validPrices[len-2]) * 100 : null;
      const perf2D = len >= 3 ? ((validPrices[len-2] - validPrices[len-3]) / validPrices[len-3]) * 100 : null;
      const perf3D = len >= 4 ? ((validPrices[len-3] - validPrices[len-4]) / validPrices[len-4]) * 100 : null;
      const perf4D = len >= 5 ? ((validPrices[len-4] - validPrices[len-5]) / validPrices[len-5]) * 100 : null;
      const perf5D = len >= 6 ? ((validPrices[len-5] - validPrices[len-6]) / validPrices[len-6]) * 100 : null;
      const perf6D = len >= 7 ? ((validPrices[len-6] - validPrices[len-7]) / validPrices[len-7]) * 100 : null;

      // Calcul MM20 (Moyenne Mobile 20 jours)
      const last20Prices = validPrices.slice(-20);
      const mm20 = last20Prices.length >= 20
        ? last20Prices.reduce((a, b) => a + b, 0) / 20
        : null;
      const distanceMM20 = mm20 ? ((currentPrice - mm20) / mm20) * 100 : null;

      // Calcul MM50 (Moyenne Mobile 50 jours)
      const last50Prices = validPrices.slice(-50);
      const mm50 = last50Prices.length >= 50
        ? last50Prices.reduce((a, b) => a + b, 0) / 50
        : null;
      const distanceMM50 = mm50 ? ((currentPrice - mm50) / mm50) * 100 : null;

      // Calcul volatilités pour comparaison
      const volWeek = calculateVolatility(validPrices, 5);
      const volMonth = calculateVolatility(validPrices, 21);

      return {
        ticker: symbol,
        dailyReturns,
        price: currentPrice,
        change: change,
        volume: volume,
        avgVolume: avgVolume,
        relVolume: avgVolume > 0 ? volume / avgVolume : 0,
        relVolume3D,  // P4: RelVol moyen sur 3 jours
        perf1D,  // Aujourd'hui (J)
        perf2D,  // Hier (J-1)
        perf3D,  // Avant-hier (J-2)
        perf4D,  // J-3
        perf5D,  // J-4
        perf6D,  // J-5
        perfWeek: calculatePerformance(validPrices, validTimestamps, 7),
        perfMonth: calculatePerformance(validPrices, validTimestamps, 30),
        perfQuart: calculatePerformance(validPrices, validTimestamps, 90),
        perfHalf: calculatePerformance(validPrices, validTimestamps, 180),
        perfYTD: calculatePerformance(validPrices, validTimestamps, 'ytd'),
        perfYear: calculatePerformance(validPrices, validTimestamps, 365),
        perf3Y: calculatePerformance(validPrices, validTimestamps, 365 * 3),
        perf5Y: calculatePerformance(validPrices, validTimestamps, 365 * 5),
        perf10Y: calculatePerformance(validPrices, validTimestamps, 365 * 10),
        volWeek,
        volMonth,
        mm20,
        distanceMM20,
        mm50,
        distanceMM50
      };
    } catch (err) {
      console.error(`Erreur Yahoo pour ${symbol}:`, err);
      return null;
    }
  };

  // Fonction principale pour charger les données
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPerformanceData([]);

    try {
      // 0. Récupérer le régime de marché (SPY)
      await fetchMarketRegime();

      // 1. Récupérer les tickers depuis Finviz
      const fetchedTickers = await fetchFinvizTickers();
      setTickers(fetchedTickers);

      // 2. Récupérer les données de performance pour chaque ticker
      // et filtrer ceux avec rendements positifs sur toutes les périodes
      const allResults = [];
      const filteredResults = [];

      for (const ticker of fetchedTickers) {
        // Arrêter si on a assez de tickers valides (100 pour All Sectors, 6 pour les autres)
        const maxTickers = selectedScreener === 'allSectors' ? 100 : 6;
        if (filteredResults.length >= maxTickers) break;

        setLoadingTicker(ticker);
        const data = await fetchYahooData(ticker);

        if (data) {
          allResults.push(data);

          // Vérifier si tous les rendements sont positifs selon le screener
          let isAllPositive;

          if (selectedScreener === 'allSectors') {
            // Pour All Sectors: J et J-1 positifs (ou null si marché fermé) + Week et Month positifs
            const perf1DOk = data.perf1D === null || data.perf1D >= 0;
            const perf2DOk = data.perf2D === null || data.perf2D >= 0;
            isAllPositive =
              perf1DOk &&
              perf2DOk &&
              data.perfWeek > 0 &&
              data.perfMonth > 0;
          } else {
            // Pour les autres: Week, Month, Quart, Half, YTD positifs
            isAllPositive =
              data.perfWeek > 0 &&
              data.perfMonth > 0 &&
              data.perfQuart > 0 &&
              data.perfHalf > 0 &&
              data.perfYTD > 0;
          }

          if (isAllPositive) {
            filteredResults.push(data);
            setPerformanceData([...filteredResults]);
          }
        }

        // Petit délai pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Si on n'a pas trouvé 6 tickers valides, afficher un message
      if (filteredResults.length < 6) {
        console.log(`Seulement ${filteredResults.length} tickers avec rendements tous positifs trouvés`);
      }

      setLoadingTicker('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFinvizTickers]);

  useEffect(() => {
    loadData();
  }, [selectedScreener, wideMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Formatage des valeurs
  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    const className = value >= 0 ? 'positive' : 'negative';
    return <span className={className}>{value.toFixed(2)}%</span>;
  };

  const formatVolume = (value) => {
    if (!value) return '-';
    if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
    return value.toFixed(0);
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return value.toFixed(decimals);
  };

  // Fonction de tri
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Données triées
  // ═══════════════════════════════════════════════════════════════════════════
  // DONNÉES TRIÉES - Selon le mode (Gainers vs Setups)
  // ═══════════════════════════════════════════════════════════════════════════
  const sortedData = (() => {
    if (viewMode === 'setups') {
      // MODE SETUPS: Filtrer + Trier par MM20 proche de 0
      // Conditions: Week > 3%, Month > 10%, ExitSig ≠ EXIT, MM50 < 20%
      // Note: OverExt < 90 est appliqué dans getAllScoredData() pour le dashboard
      return [...performanceData]
        .filter(row => {
          const exitSig = calculateExitSignal(row);
          // MM50 < 20% ou null (pas assez d'historique)
          const mm50Ok = row.distanceMM50 === null || row.distanceMM50 < 20;
          // ExitSig: accepter NONE et WARNING (rejeter seulement EXIT)
          const exitSigOk = exitSig.signal !== 'EXIT';
          return row.perfWeek > 3 &&
                 row.perfMonth > 10 &&
                 exitSigOk &&
                 mm50Ok;
        })
        .sort((a, b) => {
          // Tri par MM20 le plus proche de 0 (ascendant)
          const aMM20 = Math.abs(a.distanceMM20 ?? Infinity);
          const bMM20 = Math.abs(b.distanceMM20 ?? Infinity);
          return aMM20 - bMM20;
        });
    } else {
      // MODE GAINERS: Tri classique par colonne
      return [...performanceData].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? -Infinity;
        const bVal = b[sortConfig.key] ?? -Infinity;
        return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
  })();

  // Composant pour l'en-tête triable
  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label}
      <span style={{ marginLeft: '4px', fontSize: '0.7rem' }}>
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'desc' ? '▼' : '▲'
        ) : (
          <span style={{ opacity: 0.3 }}>▼</span>
        )}
      </span>
    </th>
  );

  const screener = SCREENERS[selectedScreener];

  return (
    <div className="App">
      <header className="App-header">
        {/* Navigation */}
        <div className="nav-buttons">
          <button
            className="nav-button"
            onClick={() => setShowHelp(!showHelp)}
            style={{
              backgroundColor: showHelp ? '#4caf50' : undefined,
              color: showHelp ? '#fff' : undefined,
              fontWeight: 'bold',
              minWidth: '32px'
            }}
            title="Aide - Guide des paramètres"
          >
            ?
          </button>
          <button className="nav-button" onClick={() => navigate('/')}>
            Accueil
          </button>
        </div>

        <h1 style={{ marginBottom: '10px', color: screener.color }}>
          Portfolio Performer
        </h1>
        <p className="subtitle">
          {screener.name}
          {viewMode === 'setups' && (
            <span style={{ color: '#4caf50', marginLeft: '10px' }}>
              — Mode Setups ({sortedData.length} trades potentiels)
            </span>
          )}
        </p>

        {/* Indicateur Market Regime */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '8px 16px',
          marginBottom: '15px',
          backgroundColor: marketRegime.status === 'ON' ? 'rgba(76, 175, 80, 0.15)' :
                          marketRegime.status === 'CAUTION' ? 'rgba(255, 152, 0, 0.15)' :
                          'rgba(244, 67, 54, 0.15)',
          border: `2px solid ${marketRegime.status === 'ON' ? '#4caf50' :
                              marketRegime.status === 'CAUTION' ? '#ff9800' : '#f44336'}`,
          borderRadius: '8px'
        }}>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: marketRegime.status === 'ON' ? '#4caf50' :
                   marketRegime.status === 'CAUTION' ? '#ff9800' : '#f44336'
          }}>
            {marketRegime.status === 'ON' ? '🐂' : marketRegime.status === 'CAUTION' ? '⚠️' : '🐻'}
          </span>
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 'bold',
              color: marketRegime.status === 'ON' ? '#4caf50' :
                     marketRegime.status === 'CAUTION' ? '#ff9800' : '#f44336'
            }}>
              Market Regime: {marketRegime.status}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9fa3a8' }}>
              SPY: ${marketRegime.spyPrice || '...'} | MM50: ${marketRegime.spyMM50 || '...'} | MM200: ${marketRegime.spyMM200 || '...'}
            </div>
          </div>
          {marketRegime.status === 'OFF' && (
            <span style={{ fontSize: '0.7rem', color: '#f44336', marginLeft: 'auto' }}>
              ⛔ Entrées bloquées
            </span>
          )}
          {marketRegime.status === 'CAUTION' && (
            <span style={{ fontSize: '0.7rem', color: '#ff9800', marginLeft: 'auto' }}>
              ⚠️ Size -1%
            </span>
          )}
        </div>

        {/* Panneau d'aide */}
        {showHelp && (
          <div style={{
            backgroundColor: '#1a1d21',
            border: '2px solid #4caf50',
            borderRadius: '12px',
            padding: '20px 30px',
            marginBottom: '20px',
            maxWidth: '900px',
            textAlign: 'left',
            fontSize: '0.85rem',
            lineHeight: '1.6',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#4caf50', marginTop: 0, borderBottom: '1px solid #3a3f47', paddingBottom: '10px' }}>
              Guide des Paramètres
            </h2>

            {/* MODES */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Modes de vue</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#673ab7', fontWeight: 'bold', width: '120px' }}>Weekly Gainers</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Scan momentum classique. Trié par performance. Pour trouver des <strong style={{ color: '#ff9800' }}>idées / WATCH</strong>.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#4caf50', fontWeight: 'bold' }}>Setups</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Générateur d'entrées. Filtré + trié par MM20 proche de 0. Pour trouver des <strong style={{ color: '#4caf50' }}>TRADES</strong>.</td>
                </tr>
              </tbody>
            </table>

            {/* FILTRES SETUPS */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Filtres du mode Setups</h3>
            <div style={{ backgroundColor: '#252830', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.8rem' }}>
              <code style={{ color: '#4caf50' }}>Week &gt; 3%</code> + <code style={{ color: '#4caf50' }}>Month &gt; 10%</code> + <code style={{ color: '#4caf50' }}>ExitSig ≠ EXIT</code> + <code style={{ color: '#4caf50' }}>MM50 &lt; 20%</code> + <code style={{ color: '#4caf50' }}>OverExt &lt; 90</code>
              <br /><span style={{ color: '#666', fontSize: '0.75rem' }}>→ Tri par |MM20| ascendant (le plus proche de la moyenne en premier)</span>
            </div>

            {/* WIDE MODE */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Wide Mode (checkbox)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', width: '120px' }}>☐ Décoché</td>
                  <td style={{ padding: '8px', color: '#ff9800' }}>Finviz pré-filtre RelVol &gt; 0.75 (momentum pur, moins de résultats)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px' }}>☑ Coché</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Finviz sans filtre RelVol (univers plus large)</td>
                </tr>
              </tbody>
            </table>

            {/* MARKET REGIME */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Market Regime (SPY)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#4caf50', fontWeight: 'bold', width: '100px' }}>🐂 ON</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>SPY &gt; MM200 → Trading normal</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#ff9800', fontWeight: 'bold' }}>⚠️ CAUTION</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>MM50 &lt; SPY &lt; MM200 → Size -1% automatique</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#f44336', fontWeight: 'bold' }}>🐻 OFF</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>SPY &lt; MM50 → ENTRY_ZONE devient WATCH (pas d'entrées)</td>
                </tr>
              </tbody>
            </table>

            {/* INDICATEURS CLÉS */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Indicateurs clés</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold', width: '80px' }}>MM20</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Distance à la moyenne mobile 20 jours. <span style={{ color: '#4caf50' }}>&lt;5% = safe</span>, <span style={{ color: '#ff9800' }}>5-10% = attention</span>, <span style={{ color: '#ff6b6b' }}>&gt;10% = étiré</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>MM50</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Distance à la moyenne mobile 50 jours. Tendance moyen terme. <span style={{ color: '#ff6b6b' }}>&gt;20% = structure étirée</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>OverExt</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Score de sur-extension (0-100). <span style={{ color: '#4caf50' }}>&lt;50 = OK</span>, <span style={{ color: '#ff9800' }}>50-80 = prudence</span>, <span style={{ color: '#ff6b6b' }}>&gt;80 = danger</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>RelVol3D</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Volume relatif moyen sur 3 jours (P4). Évite faux signaux sur pic isolé. <span style={{ color: '#4caf50' }}>&gt;0.8 = OK</span>, <span style={{ color: '#ff6b6b' }}>&lt;0.8 = faible</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>VolM</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Volatilité mensuelle (%). <span style={{ color: '#4caf50' }}>&lt;25% = stable</span>, <span style={{ color: '#ff6b6b' }}>&gt;40% = très volatile</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>J / J-1</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Performance d'aujourd'hui / hier. <span style={{ color: '#4caf50' }}>2 jours verts = momentum confirmé</span></td>
                </tr>
              </tbody>
            </table>

            {/* ÉTATS DE TRADE */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>États de décision (colonne État)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', backgroundColor: '#1b3d1b', color: '#4caf50', fontWeight: 'bold', width: '120px' }}>ENTRY_ZONE</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Tous les feux au vert. Trade possible maintenant.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', backgroundColor: '#3d3d1f', color: '#ffd700', fontWeight: 'bold' }}>WATCH</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Intéressant mais pas encore prêt. Attendre le déclencheur (voir NextTrigger).</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', backgroundColor: '#3d1f1f', color: '#ff6b6b', fontWeight: 'bold' }}>NO_TRADE</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Ne pas trader. Critères non remplis.</td>
                </tr>
              </tbody>
            </table>

            {/* EXIT SIGNAL */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Signaux de sortie (ExitSig)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#666', width: '80px' }}>NONE</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Pas de signal. OK pour entrer.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#ff9800' }}>⚠️ WARNING</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Prudence : 1 jour rouge OU volume faible (&lt;0.8)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#ff0000' }}>🚨 EXIT</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Sortir : 2 jours rouges consécutifs OU prix sous MM20</td>
                </tr>
              </tbody>
            </table>

            {/* TIME STOP */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Time Stop (anti-trades morts)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#4caf50', width: '100px' }}>J+X</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Nombre de jours ouvrés en position. Affiché après l'état.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#ff9800' }}>⏳ 7j+</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>WARNING : 7+ jours ouvrés sans nouveau plus haut. Trade "mort"?</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#ff0000' }}>⏰ 14j+</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>EXIT_TIME : 14+ jours sans nouveau high → Sortir (capital bloqué)</td>
                </tr>
              </tbody>
            </table>
            <div style={{ backgroundColor: '#252830', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.8rem' }}>
              <span style={{ color: '#9fa3a8' }}>Le système suit automatiquement le plus haut atteint depuis l'entrée. Si le prix ne dépasse pas ce niveau pendant trop longtemps, le trade est considéré comme "mort" et doit être clôturé pour libérer le capital.</span>
            </div>

            {/* MONEY MANAGEMENT */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Money Management</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold', width: '80px' }}>Size%</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Taille de position recommandée (% du capital)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>Stop%</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Distance du stop loss en %. Basé sur ATR (volatilité).</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>Stop$</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Prix du stop loss en dollars</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>TP1 (1.5R)</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Entry + 1.5 × R. Vendre 50%, remonter stop au break-even.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>TP2 (3R)</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Entry + 3 × R. Vendre les 50% restants.</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #3a3f47' }}>
                  <td style={{ padding: '8px', color: '#61dafb', fontWeight: 'bold' }}>R</td>
                  <td style={{ padding: '8px', color: '#9fa3a8' }}>Risque par action = Entry - Stop. Ex: Entry $100, Stop $95 → R = $5</td>
                </tr>
              </tbody>
            </table>

            {/* FILTRE TRADER */}
            <h3 style={{ color: '#61dafb', marginBottom: '10px' }}>Filtre Trader (colonne Filtre)</h3>
            <div style={{ backgroundColor: '#252830', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.8rem' }}>
              <code style={{ color: '#4caf50' }}>J &gt; 0</code> + <code style={{ color: '#4caf50' }}>J-1 &gt; 0</code> + <code style={{ color: '#4caf50' }}>Week &gt; 5%</code> + <code style={{ color: '#4caf50' }}>Month &gt; 10%</code> + <code style={{ color: '#4caf50' }}>RelVol3D &gt; 0.8</code> + <code style={{ color: '#4caf50' }}>VolM &lt; 30%</code>
              <br /><span style={{ color: '#666', fontSize: '0.75rem' }}>→ RelVol3D = moyenne volume relatif sur 3 jours (P4 - confirmation volume)</span>
            </div>

            {/* RÈGLE MENTALE */}
            <div style={{ backgroundColor: '#1b3d1b', padding: '15px', borderRadius: '8px', border: '1px solid #4caf50' }}>
              <strong style={{ color: '#4caf50' }}>Règle mentale :</strong>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', color: '#9fa3a8' }}>
                <li><strong style={{ color: '#673ab7' }}>Weekly Gainers</strong> = idées / WATCH</li>
                <li><strong style={{ color: '#4caf50' }}>Setups</strong> = trades exécutables</li>
                <li>Ne trader que les <strong style={{ color: '#4caf50' }}>ENTRY_ZONE</strong></li>
                <li>Max 2 positions ouvertes, max 2 entrées/jour</li>
                <li><strong style={{ color: '#795548' }}>Max 1 position par secteur</strong> (P5 - diversification)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Onglets Gainers / Setups */}
        <div style={{
          display: 'flex',
          gap: '0',
          marginBottom: '20px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #3a3f47'
        }}>
          <button
            onClick={() => setViewMode('gainers')}
            style={{
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: viewMode === 'gainers' ? 'bold' : 'normal',
              backgroundColor: viewMode === 'gainers' ? '#673ab7' : '#1e2228',
              color: viewMode === 'gainers' ? '#fff' : '#9fa3a8',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Weekly Gainers
          </button>
          <button
            onClick={() => setViewMode('setups')}
            style={{
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: viewMode === 'setups' ? 'bold' : 'normal',
              backgroundColor: viewMode === 'setups' ? '#4caf50' : '#1e2228',
              color: viewMode === 'setups' ? '#fff' : '#9fa3a8',
              border: 'none',
              borderLeft: '1px solid #3a3f47',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Setups
          </button>
        </div>

        {/* Sélecteur de screener */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Object.entries(SCREENERS)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedScreener(key)}
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                backgroundColor: selectedScreener === key ? value.color : '#1e2228',
                color: selectedScreener === key ? '#fff' : '#9fa3a8',
                border: `2px solid ${value.color}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {value.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Toggle Wide/Momentum Mode */}
        <div style={{
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          backgroundColor: '#1e2228',
          borderRadius: '6px',
          border: '1px solid #3a3f47'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            color: '#e6e6e6',
            fontSize: '0.85rem'
          }}>
            <input
              type="checkbox"
              checked={wideMode}
              onChange={(e) => setWideMode(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#4caf50'
              }}
            />
            <span style={{ fontWeight: wideMode ? 'bold' : 'normal', color: wideMode ? '#4caf50' : '#9fa3a8' }}>
              Wide Mode
            </span>
          </label>
          <span style={{ color: '#666', fontSize: '0.75rem' }}>|</span>
          <span style={{
            fontSize: '0.75rem',
            color: wideMode ? '#9fa3a8' : '#ff9800',
            fontWeight: !wideMode ? 'bold' : 'normal'
          }}>
            {wideMode ? 'Finviz: sans RelVol (univers large)' : 'Finviz: RelVol > 0.75 (momentum)'}
          </span>
        </div>

        {error && <p className="error">{error}</p>}

        {loading && (
          <p style={{ color: '#61dafb' }}>
            Chargement... {loadingTicker && `(${loadingTicker})`}
          </p>
        )}

        {/* Tableau des performances */}
        {performanceData.length > 0 && sortedData.length === 0 && viewMode === 'setups' && (
          <div style={{
            padding: '20px',
            backgroundColor: '#3d3d1f',
            borderRadius: '8px',
            marginBottom: '20px',
            maxWidth: '800px'
          }}>
            <p style={{ color: '#ffd700', margin: 0 }}>
              ⚠️ Aucun ticker ne passe les filtres Setups (Week &gt; 3%, Month &gt; 10%, ExitSig ≠ EXIT, MM50 &lt; 20%).
              <br />
              <span style={{ fontSize: '0.85rem', color: '#9fa3a8' }}>
                Basculez sur "Weekly Gainers" pour voir tous les tickers, ou changez de secteur.
              </span>
            </p>
          </div>
        )}
        {performanceData.length > 0 && sortedData.length > 0 && (
          <div style={{ overflowX: 'auto', width: '95%', maxWidth: '1600px' }}>
            <table className="portfolio-table" style={{ fontSize: '0.75rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '30px' }}>No.</th>
                  <th style={{ textAlign: 'left' }}>Ticker</th>
                  <SortableHeader label="J" sortKey="perf1D" />
                  <SortableHeader label="J-1" sortKey="perf2D" />
                  <SortableHeader label="J-2" sortKey="perf3D" />
                  <SortableHeader label="J-3" sortKey="perf4D" />
                  <SortableHeader label="J-4" sortKey="perf5D" />
                  <SortableHeader label="J-5" sortKey="perf6D" />
                  <SortableHeader label="Week" sortKey="perfWeek" />
                  <SortableHeader label="Month" sortKey="perfMonth" />
                  <SortableHeader label="Quart" sortKey="perfQuart" />
                  <SortableHeader label="Half" sortKey="perfHalf" />
                  <SortableHeader label="YTD" sortKey="perfYTD" />
                  <SortableHeader label="Year" sortKey="perfYear" />
                  <SortableHeader label="3Y" sortKey="perf3Y" />
                  <SortableHeader label="5Y" sortKey="perf5Y" />
                  <SortableHeader label="10Y" sortKey="perf10Y" />
                  <SortableHeader label="Vol W" sortKey="volWeek" />
                  <SortableHeader label="Vol M" sortKey="volMonth" />
                  <SortableHeader label="Avg Vol" sortKey="avgVolume" />
                  <SortableHeader label="Rel Vol" sortKey="relVolume" />
                  <SortableHeader label="Price" sortKey="price" />
                  <SortableHeader label="Volume" sortKey="volume" />
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, index) => (
                  <tr key={row.ticker}>
                    <td style={{ textAlign: 'center' }}>
                      <a
                        href={`https://finance.yahoo.com/quote/${row.ticker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#61dafb', textDecoration: 'none' }}
                      >
                        {index + 1}
                      </a>
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <a
                        href={`https://finviz.com/quote.ashx?t=${row.ticker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="etf-symbol-link"
                        style={{ fontWeight: 'bold', color: screener.color }}
                      >
                        {row.ticker}
                      </a>
                    </td>
                    <td>{formatPercent(row.perf1D)}</td>
                    <td>{formatPercent(row.perf2D)}</td>
                    <td>{formatPercent(row.perf3D)}</td>
                    <td>{formatPercent(row.perf4D)}</td>
                    <td>{formatPercent(row.perf5D)}</td>
                    <td>{formatPercent(row.perf6D)}</td>
                    <td>{formatPercent(row.perfWeek)}</td>
                    <td>{formatPercent(row.perfMonth)}</td>
                    <td>{formatPercent(row.perfQuart)}</td>
                    <td>{formatPercent(row.perfHalf)}</td>
                    <td>{formatPercent(row.perfYTD)}</td>
                    <td>{formatPercent(row.perfYear)}</td>
                    <td>{formatPercent(row.perf3Y)}</td>
                    <td>{formatPercent(row.perf5Y)}</td>
                    <td>{formatPercent(row.perf10Y)}</td>
                    <td>{formatPercent(row.volWeek)}</td>
                    <td>{formatPercent(row.volMonth)}</td>
                    <td>{formatVolume(row.avgVolume)}</td>
                    <td>{formatNumber(row.relVolume)}</td>
                    <td style={{ fontWeight: 'bold' }}>${formatNumber(row.price)}</td>
                    <td>{formatVolume(row.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Graphiques des rendements journaliers - Un par ticker */}
        {performanceData.length > 0 && (
          <div style={{
            width: '95%',
            maxWidth: '1600px',
            marginTop: '30px'
          }}>
            <h3 style={{ color: '#61dafb', marginBottom: '20px', textAlign: 'center' }}>
              Rendements Journaliers - 30 Derniers Jours Ouvrés
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: '20px'
            }}>
              {performanceData.map((tickerData, index) => (
                <div
                  key={tickerData.ticker}
                  style={{
                    padding: '15px',
                    backgroundColor: '#1e2228',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                    border: `2px solid ${CHART_COLORS[index % CHART_COLORS.length]}`
                  }}
                >
                  <h4 style={{
                    color: CHART_COLORS[index % CHART_COLORS.length],
                    marginBottom: '10px',
                    textAlign: 'center',
                    fontSize: '1.1rem'
                  }}>
                    {tickerData.ticker}
                    <span style={{ color: '#9fa3a8', fontSize: '0.8rem', marginLeft: '10px' }}>
                      (${tickerData.price?.toFixed(2)})
                    </span>
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart
                      data={tickerData.dailyReturns || []}
                      margin={{ top: 5, right: 45, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#9fa3a8"
                        tick={{ fill: '#9fa3a8', fontSize: 9 }}
                        interval={Math.floor((tickerData.dailyReturns?.length || 1) / 6)}
                        axisLine={{ stroke: '#3a3f47' }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#61dafb"
                        tick={{ fill: '#61dafb', fontSize: 10 }}
                        tickFormatter={(value) => `$${value.toFixed(0)}`}
                        domain={['auto', 'auto']}
                        axisLine={{ stroke: '#61dafb' }}
                        width={45}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#9fa3a8"
                        tick={{ fill: '#9fa3a8', fontSize: 10 }}
                        tickFormatter={(value) => `${value.toFixed(0)}%`}
                        domain={['auto', 'auto']}
                        axisLine={{ stroke: '#3a3f47' }}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e2228',
                          border: '1px solid #3a3f47',
                          borderRadius: '6px',
                          color: '#e6e6e6',
                          fontSize: '0.85rem'
                        }}
                        formatter={(value, name) => {
                          if (name === 'price') {
                            return [<span style={{ color: '#61dafb' }}>${value.toFixed(2)}</span>, 'Prix'];
                          }
                          const color = value >= 0 ? '#4caf50' : '#ff6b6b';
                          return [<span style={{ color }}>{value.toFixed(2)}%</span>, 'Rendement'];
                        }}
                        labelStyle={{ color: '#61dafb' }}
                        itemStyle={{ color: '#e6e6e6' }}
                      />
                      <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeWidth={1} />
                      <Bar yAxisId="right" dataKey="return" radius={[2, 2, 0, 0]}>
                        {(tickerData.dailyReturns || []).map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={entry.return >= 0 ? '#4caf50' : '#ff6b6b'}
                          />
                        ))}
                      </Bar>
                      <Line
                        yAxisId="left"
                        type="linear"
                        dataKey="price"
                        stroke="#61dafb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3, fill: '#61dafb' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tableau récapitulatif des scores - TRADING DASHBOARD */}
        {performanceData.length > 0 && (
          <div style={{
            width: '98%',
            maxWidth: '1800px',
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#1a1d21',
            borderRadius: '12px',
            border: '2px solid #61dafb'
          }}>
            <h3 style={{
              color: '#61dafb',
              marginBottom: '15px',
              textAlign: 'center',
              fontSize: '1.2rem'
            }}>
              📊 Trading Dashboard - Analyse Complète
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="portfolio-table" style={{ fontSize: '0.6rem', width: '100%' }}>
                <thead>
                  <tr style={{ backgroundColor: '#252a31' }}>
                    <th colSpan="5" style={{ backgroundColor: '#1e3a5f', color: '#61dafb', textAlign: 'center' }}>TICKER</th>
                    <th colSpan="4" style={{ backgroundColor: '#3d1f1f', color: '#ff6b6b', textAlign: 'center' }}>OVEREXTENSION</th>
                    <th colSpan="3" style={{ backgroundColor: '#1f3d1f', color: '#4caf50', textAlign: 'center' }}>POSITION</th>
                    <th colSpan="4" style={{ backgroundColor: '#3d3d1f', color: '#ffd700', textAlign: 'center' }}>STOP / TP</th>
                    <th colSpan="5" style={{ backgroundColor: '#3d1f3d', color: '#e91e63', textAlign: 'center' }}>DÉCISION</th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center', width: '25px' }}>#</th>
                    <th style={{ textAlign: 'left' }}>Ticker</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }} title={`Filtre Trader: J>0, J-1>0, Week>5%, Month>10%, RelVol>${relVolThreshold}, VolM<30%`}>Filtre</th>
                    <th style={{ textAlign: 'center' }}>Liq</th>
                    <th style={{ textAlign: 'center' }}>MM20</th>
                    <th style={{ textAlign: 'center' }}>MM50</th>
                    <th style={{ textAlign: 'center' }}>OverExt</th>
                    <th style={{ textAlign: 'center' }}>Flag</th>
                    <th style={{ textAlign: 'center' }}>Type</th>
                    <th style={{ textAlign: 'center' }}>Size%</th>
                    <th style={{ textAlign: 'center' }}>Price</th>
                    <th style={{ textAlign: 'center' }}>Stop%</th>
                    <th style={{ textAlign: 'center' }}>Stop$</th>
                    <th style={{ textAlign: 'center' }}>TP1</th>
                    <th style={{ textAlign: 'center' }}>TP2</th>
                    <th style={{ textAlign: 'center' }} title="ExitSignal: NONE/⚠️/🚨">ExitSig</th>
                    <th style={{ textAlign: 'center' }}>State</th>
                    <th style={{ textAlign: 'center' }}>Reason</th>
                    <th style={{ textAlign: 'center' }} title="Ce qu'il faut attendre pour ENTRY">NextTrigger</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllScoredData().map((row, index) => (
                    <tr
                      key={row.ticker}
                      style={{
                        backgroundColor: row.tradeState.state === 'ENTRY_ZONE' ? 'rgba(76, 175, 80, 0.15)' :
                                        row.tradeState.state === 'IN_POSITION' ? 'rgba(33, 150, 243, 0.2)' :
                                        row.tradeState.state === 'EXIT_ONLY' ? 'rgba(255, 0, 0, 0.25)' :
                                        row.tradeState.state === 'WATCH' ? 'rgba(255, 152, 0, 0.1)' : 'transparent',
                        opacity: row.tradeState.state === 'NO_TRADE' ? 0.5 : 1
                      }}
                    >
                      {/* # - Lien Yahoo Finance */}
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        <a
                          href={`https://finance.yahoo.com/quote/${row.ticker}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#61dafb', textDecoration: 'none' }}
                          title={`Voir ${row.ticker} sur Yahoo Finance`}
                        >
                          {index + 1}
                        </a>
                      </td>

                      {/* Ticker */}
                      <td style={{ textAlign: 'left' }}>
                        <a
                          href={`https://finviz.com/quote.ashx?t=${row.ticker}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: screener.color, fontWeight: 'bold', textDecoration: 'none' }}
                        >
                          {row.ticker}
                        </a>
                      </td>

                      {/* Momentum Score */}
                      <td style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        color: row.momentumScore >= 70 ? '#4caf50' : row.momentumScore >= 50 ? '#ffd700' : '#ff9800'
                      }}>
                        {row.momentumScore}
                      </td>

                      {/* Filtre Trader - avec détail des conditions */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{ color: row.passesFilter ? '#4caf50' : '#ff6b6b', cursor: 'help' }}
                          title={row.filterDetails ? Object.values(row.filterDetails.conditions)
                            .map(c => `${c.ok ? '✓' : '✗'} ${c.label}: ${c.value}`)
                            .join('\n') : ''}
                        >
                          {row.passesFilter ? '✓' : '✗'}
                        </span>
                      </td>

                      {/* Liquidity */}
                      <td style={{ textAlign: 'center' }}>
                        {row.isIlliquid ? (
                          <span style={{ color: '#ff6b6b' }} title={`AvgVol: ${(row.avgVolume/1000000).toFixed(1)}M | $AvgVol: ${(row.dollarAvgVolume/1000000).toFixed(1)}M | ${row.liquidityReason}`}>💧</span>
                        ) : (
                          <span style={{ color: '#4caf50' }} title={`AvgVol: ${(row.avgVolume/1000000).toFixed(1)}M | $AvgVol: ${(row.dollarAvgVolume/1000000).toFixed(1)}M`}>✓</span>
                        )}
                      </td>

                      {/* MM20 */}
                      <td style={{
                        textAlign: 'center',
                        color: row.distanceMM20 > 10 ? '#ff6b6b' : row.distanceMM20 > 5 ? '#ffd700' : '#4caf50'
                      }}>
                        {row.distanceMM20 !== null ? `${row.distanceMM20 > 0 ? '+' : ''}${row.distanceMM20.toFixed(1)}%` : '-'}
                      </td>

                      {/* MM50 */}
                      <td style={{
                        textAlign: 'center',
                        color: row.distanceMM50 > 15 ? '#ff6b6b' : row.distanceMM50 > 8 ? '#ffd700' : '#4caf50'
                      }}>
                        {row.distanceMM50 !== null ? `${row.distanceMM50 > 0 ? '+' : ''}${row.distanceMM50.toFixed(1)}%` : '-'}
                      </td>

                      {/* OverExt Score */}
                      <td style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: row.overextension.flagColor
                      }}>
                        {row.overextension.score}
                      </td>

                      {/* OverExt Flag */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: row.overextension.flagColor,
                          color: '#fff',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontSize: '0.55rem',
                          fontWeight: 'bold'
                        }}>
                          {row.overextension.flagIcon} {row.overextension.flag}
                        </span>
                      </td>

                      {/* Trade Type */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: row.tradeType.color,
                          color: '#fff',
                          padding: '2px 5px',
                          borderRadius: '6px',
                          fontSize: '0.55rem'
                        }}>
                          {row.tradeType.icon}
                        </span>
                      </td>

                      {/* Position Size */}
                      <td style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: row.positionSize.blocked ? '#666' :
                               row.positionSize.pct >= 5 ? '#4caf50' :
                               row.positionSize.pct >= 3 ? '#ffd700' : '#ff9800',
                        textDecoration: row.positionSize.blocked ? 'line-through' : 'none',
                        opacity: row.positionSize.blocked ? 0.5 : 1
                      }}>
                        {row.positionSize.blocked ? '—' : `${row.positionSize.pct}%`}
                      </td>

                      {/* Price */}
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#61dafb' }}>
                        ${row.price?.toFixed(2)}
                      </td>

                      {/* Stop % */}
                      <td style={{ textAlign: 'center', color: '#ff6b6b' }}>
                        {row.stopTP.stopPct}%
                      </td>

                      {/* Stop $ */}
                      <td style={{ textAlign: 'center', color: '#ff6b6b', fontWeight: 'bold' }}>
                        ${row.stopTP.stopPrice?.toFixed(2)}
                      </td>

                      {/* TP1 */}
                      <td style={{ textAlign: 'center', color: '#4caf50' }}>
                        ${row.stopTP.tp1Price?.toFixed(2)}
                      </td>

                      {/* TP2 */}
                      <td style={{ textAlign: 'center', color: '#4caf50', fontWeight: 'bold' }}>
                        ${row.stopTP.tp2Price?.toFixed(2)}
                      </td>

                      {/* Exit Signal */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            backgroundColor: row.exitSignal.signal === 'NONE' ? 'transparent' : row.exitSignal.color,
                            color: row.exitSignal.signal === 'NONE' ? '#666' : '#fff',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '0.55rem',
                            fontWeight: 'bold',
                            animation: row.exitSignal.signal === 'EXIT' ? 'blink 1s infinite' : 'none'
                          }}
                          title={row.exitSignal.reason}
                        >
                          {row.exitSignal.label}
                        </span>
                      </td>

                      {/* Trade State */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          backgroundColor: row.tradeState.color,
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.5rem',
                          fontWeight: 'bold'
                        }}>
                          {row.tradeState.icon} {row.tradeState.state}
                        </span>
                      </td>

                      {/* Reason (diagnostic) */}
                      <td style={{
                        textAlign: 'center',
                        fontSize: '0.5rem',
                        color: row.tradeState.state === 'EXIT_ONLY' ? '#ff0000' :
                               row.tradeState.state === 'IN_POSITION' ? '#2196f3' :
                               row.tradeState.state === 'NO_TRADE' ? '#ff6b6b' :
                               row.tradeState.state === 'WATCH' ? '#ff9800' :
                               row.tradeState.state === 'ENTRY_ZONE' ? '#4caf50' : '#9fa3a8'
                      }}
                        title={row.tradeState.reasonText}
                      >
                        {row.tradeState.reason}
                      </td>

                      {/* NextTrigger - Ce qu'il faut attendre pour ENTRY */}
                      <td style={{
                        textAlign: 'center',
                        fontSize: '0.45rem',
                        color: row.tradeState.state === 'WATCH' ? '#ff9800' :
                               row.tradeState.state === 'ENTRY_ZONE' ? '#4caf50' : '#666',
                        maxWidth: '120px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                        title={row.nextTrigger}
                      >
                        {row.tradeState.state === 'ENTRY_ZONE' ? '✓ READY' :
                         row.tradeState.state === 'IN_POSITION' ? '📊 IN_POS' :
                         row.nextTrigger}
                      </td>

                      {/* Action (Trade) */}
                      <td style={{ textAlign: 'center' }}>
                        {row.tradeState.state === 'IN_POSITION' || row.tradeState.state === 'EXIT_ONLY' ? (
                          // Position ouverte → boutons de gestion
                          (() => {
                            const pos = getOpenPosition(row.ticker);
                            const status = checkPositionStatus(row.ticker, row.price);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                {/* Indicateur TP1 */}
                                {pos?.tp1Done && (
                                  <span style={{ fontSize: '0.45rem', color: '#4caf50', fontWeight: 'bold' }}>
                                    ✓ TP1 (BE)
                                  </span>
                                )}
                                {/* Alerte auto si condition atteinte */}
                                {status && status.action === 'TP1_HIT' && !pos?.tp1Done && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`TP1 atteint pour ${row.ticker}!\n\nPrix: $${row.price?.toFixed(2)}\nTP1: $${pos?.tp1Price?.toFixed(2)}\n\nRemonter le stop à break-even?`)) {
                                        handleTp1Hit(row.ticker);
                                      }
                                    }}
                                    style={{
                                      backgroundColor: '#4caf50',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '2px 4px',
                                      fontSize: '0.45rem',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      animation: 'blink 1s infinite'
                                    }}
                                  >
                                    🎯 TP1!
                                  </button>
                                )}
                                {/* Bouton Close */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const suggestedReason = status?.reason || (row.tradeState.state === 'EXIT_ONLY' ? 'SIGNAL' : 'MANUAL');
                                    const exitPrice = prompt(`Fermer ${row.ticker}\n\nEntry: $${pos?.entryPrice?.toFixed(2)}\nStop actuel: $${pos?.stopPriceCurrent?.toFixed(2)}\nPrix actuel: $${row.price?.toFixed(2)}\n\nPrix de sortie:`, row.price?.toFixed(2));
                                    if (exitPrice) {
                                      const reason = prompt('Raison (STOP/STOP_BE/TP1/TP2/SIGNAL/MANUAL):', suggestedReason);
                                      closeTrade(row.ticker, parseFloat(exitPrice), reason || 'MANUAL');
                                    }
                                  }}
                                  style={{
                                    backgroundColor: row.tradeState.state === 'EXIT_ONLY' ? '#ff0000' : '#ff6b6b',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    fontSize: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    animation: row.tradeState.state === 'EXIT_ONLY' ? 'blink 1s infinite' : 'none'
                                  }}
                                >
                                  {row.tradeState.state === 'EXIT_ONLY' ? '🚨 EXIT' : '✕ Close'}
                                </button>
                              </div>
                            );
                          })()
                        ) : row.tradeState.state === 'ENTRY_ZONE' ? (
                          // ENTRY_ZONE → bouton Open
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Ouvrir position sur ${row.ticker}?\n\nType: ${row.tradeType?.type}\nScore: ${row.momentumScore}\n\nEntry: $${row.price?.toFixed(2)}\nStop: $${row.stopTP?.stopPrice?.toFixed(2)} (${row.stopTP?.stopPct}%)\nTP1: $${row.stopTP?.tp1Price?.toFixed(2)} (+8%)\nTP2: $${row.stopTP?.tp2Price?.toFixed(2)} (+20%)\nSize: ${row.positionSize?.pct}%`)) {
                                openTrade(row);
                              }
                            }}
                            style={{
                              backgroundColor: '#4caf50',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.5rem',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            + Open
                          </button>
                        ) : row.tradeState.state === 'WATCH' ? (
                          // WATCH → bouton Watch (ajouter à la watchlist)
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://finviz.com/quote.ashx?t=${row.ticker}`, '_blank');
                            }}
                            style={{
                              backgroundColor: '#ff9800',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.5rem',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                            title={row.tradeState.reasonText}
                          >
                            👁 Watch
                          </button>
                        ) : (
                          // NO_TRADE → bouton disabled avec raison
                          <button
                            disabled
                            style={{
                              backgroundColor: '#333',
                              color: '#666',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '0.45rem',
                              cursor: 'not-allowed',
                              fontWeight: 'bold'
                            }}
                            title={row.tradeState.reasonText}
                          >
                            {row.tradeState.icon}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Légende complète */}
            <div style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#1e2228',
              borderRadius: '6px',
              fontSize: '0.55rem',
              color: '#9fa3a8'
            }}>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#61dafb' }}>Hiérarchie:</strong>
                <span style={{ marginLeft: '5px' }}>0. IN_POSITION → 1. EXIT_SIGNAL → 2. OVEREXT&gt;100 → 3. ILLIQUID → 4. FILTER (WATCH si Score≥75) → 5. MAX_POS → 6. WARNINGS → 7. OK</span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#61dafb' }}>State:</strong>
                <span style={{ marginLeft: '5px', backgroundColor: '#2196f3', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>📊 IN_POS</span>
                <span style={{ marginLeft: '4px', backgroundColor: '#ff0000', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>🚨 EXIT_ONLY</span>
                <span style={{ marginLeft: '4px', backgroundColor: '#4caf50', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>✅ ENTRY</span>
                <span style={{ marginLeft: '4px', backgroundColor: '#ff9800', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>👁️ WATCH</span>
                <span style={{ marginLeft: '4px', backgroundColor: '#666', color: '#fff', padding: '1px 4px', borderRadius: '3px' }}>🚫 NO_TRADE</span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#61dafb' }}>Liq:</strong>
                <span style={{ marginLeft: '5px', color: '#4caf50' }}>✓</span>=OK
                <span style={{ marginLeft: '4px', color: '#ff6b6b' }}>💧</span>=Illiquide
                <span style={{ marginLeft: '4px' }}>(Price&lt;$20: $AvgVol≥8M | Price≥$20: $AvgVol≥12M | OU AvgVol≥800K)</span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#61dafb' }}>ExitSig:</strong>
                <span style={{ marginLeft: '5px', color: '#666' }}>NONE</span>=OK
                <span style={{ marginLeft: '4px', color: '#ff9800' }}>⚠️</span>=Warning (1er jour rouge, RelVol&lt;0.8)
                <span style={{ marginLeft: '4px', color: '#ff0000' }}>🚨</span>=EXIT (2 jours rouges, sous MM20)
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#4caf50' }}>✅ ENTRY_ZONE =</strong>
                <span style={{ marginLeft: '5px' }}>Filtre ✓ ET Liq ✓ ET OverExt &lt;80 ET ExitSig NONE ET MaxPos OK</span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#ff9800' }}>👁️ WATCH =</strong>
                <span style={{ marginLeft: '5px' }}>(Filtre ✗ + Score≥75) OU (OverExt 50-80) OU (ExitSig ⚠️) OU (MaxPos atteint)</span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#ff6b6b' }}>🚫 NO_TRADE =</strong>
                <span style={{ marginLeft: '5px' }}>ExitSig 🚨 OU OverExt &gt;100 OU Liq 💧 OU (Filtre ✗ + Score&lt;75)</span>
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong style={{ color: '#61dafb' }}>Config:</strong> Max positions: {tradingConfig.maxOpenPositions} | Size: Breakout 3% / Momentum 4.5% / Rebound 6% (pénalités: OverExt⚠️-1%, ⛔-2%, VolM&gt;25%-1%)
              </div>
              <div>
                <strong style={{ color: '#61dafb' }}>Money Mgmt:</strong> TP1 +8% → Stop → Break-even | TP2 +20% → Close | R = (Exit - Entry) / (Entry - Stop)
              </div>
            </div>
          </div>
        )}

        {/* Section Journal & Stats */}
        <div style={{
          width: '98%',
          maxWidth: '1800px',
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#1a1d21',
          borderRadius: '12px',
          border: '2px solid #9c27b0'
        }}>
          <h3 style={{
            color: '#9c27b0',
            marginBottom: '10px',
            textAlign: 'center',
            fontSize: '1rem'
          }}>
            📒 Trade Journal & Performance
          </h3>

          {/* Stats R */}
          {getJournalStats() && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              marginBottom: '15px'
            }}>
              {[
                { label: 'Trades', value: getJournalStats().totalTrades, color: '#61dafb' },
                { label: 'Win Rate', value: `${getJournalStats().winRate}%`, color: getJournalStats().winRate >= 50 ? '#4caf50' : '#ff6b6b' },
                { label: 'Avg R', value: getJournalStats().avgR, color: getJournalStats().avgR >= 0 ? '#4caf50' : '#ff6b6b' },
                { label: 'Total R', value: getJournalStats().totalR, color: getJournalStats().totalR >= 0 ? '#4caf50' : '#ff6b6b' },
                { label: 'Profit Factor', value: getJournalStats().profitFactor, color: getJournalStats().profitFactor >= 1 ? '#4caf50' : '#ff6b6b' },
                { label: 'Max DD', value: `${getJournalStats().maxDrawdown}R`, color: '#ff9800' }
              ].map(stat => (
                <div key={stat.label} style={{
                  backgroundColor: '#252a31',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.6rem', color: '#9fa3a8' }}>{stat.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Open Positions */}
          {openPositions.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: '#61dafb', marginBottom: '8px' }}>
                <strong>📊 Positions ouvertes ({openPositions.length}/{tradingConfig.maxOpenPositions}):</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {journal.trades.filter(t => t.status === 'OPEN').map(trade => {
                  // Trouver les données actuelles du ticker
                  const currentData = performanceData.find(d => d.ticker === trade.ticker);
                  const currentPrice = currentData?.price || trade.entryPrice;
                  const pnlPct = ((currentPrice - trade.entryPrice) / trade.entryPrice * 100);
                  const riskPerShare = trade.entryPrice - trade.stopPriceInitial;
                  const currentR = riskPerShare !== 0 ? (currentPrice - trade.entryPrice) / riskPerShare : 0;

                  return (
                    <div key={trade.id} style={{
                      backgroundColor: '#252a31',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.55rem',
                      border: `2px solid ${pnlPct >= 0 ? '#4caf50' : '#ff6b6b'}`,
                      minWidth: '180px'
                    }}>
                      {/* Header: Ticker + Type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '0.7rem' }}>{trade.ticker}</span>
                        <span style={{
                          backgroundColor: trade.type === 'Breakout' ? '#ff9800' :
                                          trade.type === 'Rebound' ? '#2196f3' :
                                          trade.type === 'Continuation' ? '#4caf50' : '#9c27b0',
                          color: '#fff',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          fontSize: '0.5rem'
                        }}>
                          {trade.type}
                        </span>
                      </div>

                      {/* Entry + Current */}
                      <div style={{ marginBottom: '3px' }}>
                        <span style={{ color: '#9fa3a8' }}>Entry: </span>
                        <span style={{ color: '#61dafb' }}>${trade.entryPrice?.toFixed(2)}</span>
                        <span style={{ color: '#9fa3a8', marginLeft: '8px' }}>Now: </span>
                        <span style={{ color: pnlPct >= 0 ? '#4caf50' : '#ff6b6b', fontWeight: 'bold' }}>
                          ${currentPrice?.toFixed(2)}
                        </span>
                      </div>

                      {/* P/L */}
                      <div style={{ marginBottom: '3px' }}>
                        <span style={{ color: '#9fa3a8' }}>P/L: </span>
                        <span style={{
                          color: pnlPct >= 0 ? '#4caf50' : '#ff6b6b',
                          fontWeight: 'bold',
                          fontSize: '0.65rem'
                        }}>
                          {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </span>
                        <span style={{
                          color: currentR >= 0 ? '#4caf50' : '#ff6b6b',
                          marginLeft: '8px'
                        }}>
                          ({currentR >= 0 ? '+' : ''}{currentR.toFixed(2)}R)
                        </span>
                      </div>

                      {/* Stop + TP1 status */}
                      <div style={{ marginBottom: '3px' }}>
                        <span style={{ color: '#ff6b6b' }}>
                          Stop: ${trade.stopPriceCurrent?.toFixed(2)}
                          {trade.tp1Done && <span style={{ color: '#4caf50', marginLeft: '4px' }}>(BE)</span>}
                        </span>
                      </div>

                      {/* TP1 + TP2 */}
                      <div>
                        <span style={{ color: trade.tp1Done ? '#4caf50' : '#9fa3a8' }}>
                          TP1: ${trade.tp1Price?.toFixed(2)} {trade.tp1Done ? '✓' : ''}
                        </span>
                        <span style={{ color: '#9fa3a8', marginLeft: '8px' }}>
                          TP2: ${trade.tp2Price?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message si pas de trades */}
          {journal.trades.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '0.7rem' }}>
              Aucun trade enregistré. Utilisez le bouton "+" sur une ligne ENTRY_ZONE pour ouvrir une position.
            </div>
          )}

          {/* Derniers trades fermés */}
          {journal.trades.filter(t => t.status === 'CLOSED').length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.65rem', color: '#9fa3a8', marginBottom: '5px' }}>
                <strong>Derniers trades:</strong>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {journal.trades.filter(t => t.status === 'CLOSED').slice(-5).reverse().map(trade => (
                  <div key={trade.id} style={{
                    backgroundColor: trade.rMultiple >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.55rem'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{trade.ticker}</span>
                    <span style={{
                      marginLeft: '4px',
                      color: trade.rMultiple >= 0 ? '#4caf50' : '#ff6b6b',
                      fontWeight: 'bold'
                    }}>
                      {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                    </span>
                    <span style={{ marginLeft: '4px', color: '#666' }}>({trade.exitReason})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section Best Picks - Momentum Score */}
        {performanceData.length > 0 && getBestPicks().length > 0 && (
          <div style={{
            width: '95%',
            maxWidth: '1200px',
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#1a1d21',
            borderRadius: '12px',
            border: '2px solid #ffd700'
          }}>
            <h3 style={{
              color: '#ffd700',
              marginBottom: '15px',
              textAlign: 'center',
              fontSize: '1.3rem'
            }}>
              🏆 Best Picks - Top Filtered
            </h3>
            <p style={{
              color: '#9fa3a8',
              fontSize: '0.75rem',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              Actions passant le filtre Trader, triées par Momentum Score
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {getBestPicks().map((pick, index) => (
                <div
                  key={pick.ticker}
                  style={{
                    padding: '15px',
                    backgroundColor: '#252a31',
                    borderRadius: '10px',
                    border: `2px solid ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#3a3f47'}`,
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => window.open(`https://finviz.com/quote.ashx?t=${pick.ticker}`, '_blank')}
                >
                  {/* Badge Late Move (warning) */}
                  {pick.lateMove && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#ff5722',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 'bold'
                    }}>
                      ⚠️ LATE
                    </div>
                  )}

                  {/* Trade Type Badge */}
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: pick.tradeType.color,
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}>
                    {pick.tradeType.icon} {pick.tradeType.type}
                  </div>

                  {/* Médaille pour top 3 */}
                  {index < 3 && (
                    <div style={{ fontSize: '1.3rem', marginBottom: '3px' }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}

                  {/* Ticker */}
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: screener.color,
                    marginBottom: '5px'
                  }}>
                    {pick.ticker}
                  </div>

                  {/* Score */}
                  <div style={{
                    fontSize: '1.8rem',
                    fontWeight: 'bold',
                    color: pick.momentumScore >= 70 ? '#4caf50' : pick.momentumScore >= 50 ? '#ffd700' : '#ff9800',
                    marginBottom: '5px'
                  }}>
                    {pick.momentumScore}
                  </div>

                  {/* Distance MM20 */}
                  <div style={{
                    fontSize: '0.7rem',
                    marginBottom: '8px',
                    padding: '3px 6px',
                    backgroundColor: pick.distanceMM20 > 10 ? '#5d3a3a' : pick.distanceMM20 > 5 ? '#5d5a3a' : '#3a5d3a',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    MM20: <span style={{
                      color: pick.distanceMM20 > 10 ? '#ff6b6b' : pick.distanceMM20 > 5 ? '#ffd700' : '#4caf50',
                      fontWeight: 'bold'
                    }}>
                      {pick.distanceMM20 > 0 ? '+' : ''}{pick.distanceMM20?.toFixed(1)}%
                    </span>
                  </div>

                  {/* Trade State Badge */}
                  <div style={{
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      backgroundColor: pick.tradeState.color,
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: 'bold'
                    }}>
                      {pick.tradeState.icon} {pick.tradeState.state}
                    </span>
                  </div>

                  {/* Position Size */}
                  <div style={{
                    fontSize: '0.75rem',
                    marginBottom: '6px',
                    color: pick.positionSize.blocked ? '#666' : '#61dafb',
                    fontWeight: 'bold',
                    opacity: pick.positionSize.blocked ? 0.5 : 1
                  }}>
                    Position: {pick.positionSize.blocked ? '—' : `${pick.positionSize.pct}%`}
                  </div>

                  {/* Prix et Stop/TP */}
                  <div style={{
                    fontSize: '0.6rem',
                    backgroundColor: '#1e2228',
                    padding: '6px',
                    borderRadius: '4px',
                    marginBottom: '6px'
                  }}>
                    <div style={{ color: '#61dafb', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      ${pick.price?.toFixed(2)}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ color: '#ff6b6b' }}>Stop: ${pick.stopTP.stopPrice?.toFixed(2)}</span>
                      <span style={{ color: '#666', margin: '0 4px' }}>|</span>
                      <span style={{ color: '#4caf50' }}>TP1: ${pick.stopTP.tp1Price?.toFixed(2)}</span>
                    </div>
                    <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                      TP2: ${pick.stopTP.tp2Price?.toFixed(2)}
                    </div>
                  </div>

                  {/* OverExt Flag */}
                  <div style={{
                    fontSize: '0.55rem',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      backgroundColor: pick.overextension.flagColor,
                      color: '#fff',
                      padding: '2px 5px',
                      borderRadius: '3px'
                    }}>
                      {pick.overextension.flagIcon} OverExt: {pick.overextension.score}
                    </span>
                  </div>

                  {/* Détails performances */}
                  <div style={{ fontSize: '0.55rem', color: '#9fa3a8' }}>
                    <div>J: <span className="positive">{pick.perf1D?.toFixed(1)}%</span> | J-1: <span className="positive">{pick.perf2D?.toFixed(1)}%</span></div>
                    <div>Week: <span className="positive">{pick.perfWeek?.toFixed(1)}%</span> | Month: <span className="positive">{pick.perfMonth?.toFixed(1)}%</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Légende complète */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#1e2228',
              borderRadius: '6px',
              fontSize: '0.65rem',
              color: '#9fa3a8'
            }}>
              {/* Ligne 1: Score */}
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#ffd700' }}>Score:</strong>
                <span style={{ marginLeft: '8px' }}>30% Week + 25% Month + 20% (J+J-1) + 15% RelVol + 10% (1/VolM)</span>
                <span style={{ marginLeft: '10px', color: '#4caf50' }}>≥70 ✓</span>
                <span style={{ marginLeft: '6px', color: '#ffd700' }}>≥50 ~</span>
                <span style={{ marginLeft: '6px', color: '#ff9800' }}>&lt;50 !</span>
              </div>

              {/* Ligne 2: Trade Types */}
              <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#61dafb' }}>Trade Type:</strong>
                <span style={{ marginLeft: '8px', backgroundColor: '#4caf50', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>📈 Continuation</span>
                <span style={{ marginLeft: '6px', backgroundColor: '#ff9800', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>🚀 Breakout</span>
                <span style={{ marginLeft: '6px', backgroundColor: '#2196f3', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>↩️ Rebound</span>
                <span style={{ marginLeft: '6px', backgroundColor: '#9c27b0', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>⚡ Momentum</span>
              </div>

              {/* Ligne 3: Indicateurs */}
              <div>
                <strong style={{ color: '#61dafb' }}>Indicateurs:</strong>
                <span style={{ marginLeft: '8px' }}>
                  <span style={{ color: '#4caf50' }}>MM20 &lt;5%</span> safe |
                  <span style={{ color: '#ffd700', marginLeft: '4px' }}>5-10%</span> attention |
                  <span style={{ color: '#ff6b6b', marginLeft: '4px' }}>&gt;10%</span> étiré
                </span>
                <span style={{ marginLeft: '12px', backgroundColor: '#ff5722', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>⚠️ LATE</span>
                <span style={{ marginLeft: '4px' }}>= Month &gt;100% + VolW↑</span>
              </div>
            </div>
          </div>
        )}

        {/* Message si aucun Best Pick */}
        {performanceData.length > 0 && getBestPicks().length === 0 && (
          <div style={{
            width: '95%',
            maxWidth: '1200px',
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#1a1d21',
            borderRadius: '12px',
            border: '2px solid #666',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#666', marginBottom: '10px' }}>
              🏆 Best Picks - Momentum Score
            </h3>
            <p style={{ color: '#9fa3a8', fontSize: '0.85rem' }}>
              Aucune action ne passe le filtre Trader actuellement.
            </p>
            <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '10px' }}>
              Critères: J &gt; 0 | J-1 &gt; 0 | Week &gt; 5% | Month &gt; 10% | RelVol3D &gt; 0.8 | VolM &lt; 30%
            </p>
          </div>
        )}

        {/* Boutons */}
        <div className="button-container">
          <button className="refresh-button" onClick={loadData} disabled={loading}>
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>

        {/* Info */}
        <p style={{ marginTop: '20px', fontSize: '0.75rem', color: '#666' }}>
          Données: Finviz + Yahoo Finance | All: 100 tickers, Secteurs: 6 | Filtre: J&gt;0, J-1&gt;0, Week&gt;5%, Month&gt;10%, RelVol3D&gt;0.8, VolM&lt;30%
        </p>
      </header>
    </div>
  );
}

export default PortfolioPerformer;
