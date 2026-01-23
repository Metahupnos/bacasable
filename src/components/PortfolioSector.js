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

// Configuration des secteurs
const FINVIZ_BASE = 'https://finviz.com/screener.ashx?v=141&f=sec_';
const FINVIZ_PARAMS = ',sh_avgvol_o2000,sh_price_o10,sh_relvol_o0.75,ta_volatility_wo3&o=-perf4w';

const SECTORS = {
  'basic-materials': {
    name: 'Basic Materials',
    color: '#ff5722',
    description: 'Suivi des valeurs minières et matériaux',
    finvizUrl: `${FINVIZ_BASE}basicmaterials${FINVIZ_PARAMS}`,
    stocks: [
      { symbol: 'HYMC', name: 'Hycroft Mining', description: 'Or/argent spéculatif' },
      { symbol: 'CRML', name: 'Cordia Corporation', description: 'Minéraux' },
      { symbol: 'UAMY', name: 'United States Antimony', description: 'Antimoine USA' },
      { symbol: 'METC', name: 'Ramaco Resources', description: 'Charbon métallurgique' },
      { symbol: 'USAR', name: 'US Gold Corp', description: 'Exploration or USA' },
      { symbol: 'HL', name: 'Hecla Mining', description: 'Argent et or' },
      { symbol: 'AG', name: 'First Majestic Silver', description: 'Producteur argent Mexique' },
      { symbol: 'NGD', name: 'New Gold', description: 'Producteur or Canada' },
      { symbol: 'EXK', name: 'Endeavour Silver', description: 'Producteur argent' },
      { symbol: 'SVM', name: 'Silvercorp Metals', description: 'Argent Chine' },
      { symbol: 'CDE', name: 'Coeur Mining', description: 'Métaux précieux' },
      { symbol: 'CC', name: 'Chemours', description: 'Chimie titane' },
      { symbol: 'ALB', name: 'Albemarle', description: 'Leader mondial lithium' },
      { symbol: 'KGC', name: 'Kinross Gold', description: 'Producteur or majeur' },
      { symbol: 'SBSW', name: 'Sibanye Stillwater', description: 'PGM et or Afrique Sud' },
      { symbol: 'MP', name: 'MP Materials', description: 'Terres rares USA' },
      { symbol: 'PPTA', name: 'Perpetua Resources', description: 'Or/antimoine Idaho' },
      { symbol: 'HBM', name: 'Hudbay Minerals', description: 'Cuivre/zinc Canada' },
      { symbol: 'ALM', name: 'Alma Gold', description: 'Or Afrique' },
      { symbol: 'AA', name: 'Alcoa', description: 'Aluminium majeur' }
    ]
  },
  'healthcare': {
    name: 'Healthcare',
    color: '#e91e63',
    description: 'Suivi des valeurs biotech et healthcare',
    finvizUrl: `${FINVIZ_BASE}healthcare${FINVIZ_PARAMS}`,
    stocks: [
      { symbol: 'CRVS', name: 'Corvus Pharmaceuticals', description: 'Immuno-oncologie' },
      { symbol: 'ERAS', name: 'Erasca', description: 'Oncologie ciblée' },
      { symbol: 'NTLA', name: 'Intellia Therapeutics', description: 'CRISPR thérapie génique' },
      { symbol: 'MRNA', name: 'Moderna', description: 'ARNm vaccins/thérapies' },
      { symbol: 'RVMD', name: 'Revolution Medicines', description: 'Oncologie RAS' },
      { symbol: 'TNGX', name: 'Tango Therapeutics', description: 'Oncologie précision' },
      { symbol: 'TXG', name: '10x Genomics', description: 'Génomique single-cell' },
      { symbol: 'DFTX', name: 'Dfinity Therapeutics', description: 'Biotech' },
      { symbol: 'DAWN', name: 'Day One Biopharmaceuticals', description: 'Oncologie pédiatrique' },
      { symbol: 'NVO', name: 'Novo Nordisk', description: 'Diabète/obésité' },
      { symbol: 'BEAM', name: 'Beam Therapeutics', description: 'Base editing' },
      { symbol: 'OMER', name: 'Omeros', description: 'Biopharma maladies rares' },
      { symbol: 'IMNM', name: 'Immunome', description: 'Immuno-oncologie' },
      { symbol: 'ALKS', name: 'Alkermes', description: 'Neurosciences' },
      { symbol: 'LQDA', name: 'Liquidia', description: 'Hypertension pulmonaire' },
      { symbol: 'BKD', name: 'Brookdale Senior Living', description: 'Soins seniors' },
      { symbol: 'GH', name: 'Guardant Health', description: 'Biopsie liquide oncologie' },
      { symbol: 'XRAY', name: 'Dentsply Sirona', description: 'Équipements dentaires' },
      { symbol: 'ALHC', name: 'Alignment Healthcare', description: 'Medicare Advantage' },
      { symbol: 'PRGO', name: 'Perrigo', description: 'Pharma OTC' }
    ]
  },
  'technology': {
    name: 'Technology',
    color: '#2196f3',
    description: 'Suivi des valeurs technologiques',
    finvizUrl: `${FINVIZ_BASE}technology${FINVIZ_PARAMS}`,
    stocks: [
      { symbol: 'SNDK', name: 'Sandisk', description: 'Stockage mémoire' },
      { symbol: 'SKYT', name: 'SkyWater Technology', description: 'Fonderie semi-conducteurs' },
      { symbol: 'UMAC', name: 'Unusual Machines', description: 'Drones' },
      { symbol: 'ASTS', name: 'AST SpaceMobile', description: 'Satellite télécom' },
      { symbol: 'MU', name: 'Micron Technology', description: 'Mémoire DRAM/NAND' },
      { symbol: 'INTC', name: 'Intel', description: 'Processeurs' },
      { symbol: 'NVTS', name: 'Navitas Semiconductor', description: 'Semi GaN' },
      { symbol: 'ENTG', name: 'Entegris', description: 'Matériaux semi-conducteurs' },
      { symbol: 'TTMI', name: 'TTM Technologies', description: 'PCB haute performance' },
      { symbol: 'ONDS', name: 'Ondas Holdings', description: 'Réseaux sans fil' },
      { symbol: 'WDC', name: 'Western Digital', description: 'Stockage données' },
      { symbol: 'AMKR', name: 'Amkor Technology', description: 'Packaging semi' },
      { symbol: 'LRCX', name: 'Lam Research', description: 'Équipements semi' },
      { symbol: 'AEVA', name: 'Aeva Technologies', description: 'LiDAR' },
      { symbol: 'ALGM', name: 'Allegro MicroSystems', description: 'Semi capteurs' },
      { symbol: 'APLD', name: 'Applied Digital', description: 'Data centers HPC' },
      { symbol: 'AMAT', name: 'Applied Materials', description: 'Équipements semi' },
      { symbol: 'Q', name: 'Quintas Energy', description: 'Tech' },
      { symbol: 'GFS', name: 'GlobalFoundries', description: 'Fonderie semi' },
      { symbol: 'OUST', name: 'Ouster', description: 'LiDAR' }
    ]
  },
  'industrials': {
    name: 'Industrials',
    color: '#9c27b0',
    description: 'Suivi des valeurs industrielles',
    finvizUrl: `${FINVIZ_BASE}industrials${FINVIZ_PARAMS}`,
    stocks: [
      { symbol: 'RCAT', name: 'Red Cat Holdings', description: 'Drones défense' },
      { symbol: 'KTOS', name: 'Kratos Defense', description: 'Défense/drones' },
      { symbol: 'RDW', name: 'Redwire', description: 'Infrastructure spatiale' },
      { symbol: 'EOSE', name: 'Eos Energy', description: 'Stockage énergie' },
      { symbol: 'LUNR', name: 'Intuitive Machines', description: 'Services lunaires' },
      { symbol: 'PL', name: 'Planet Labs', description: 'Imagerie satellite' },
      { symbol: 'PCT', name: 'PureCycle Technologies', description: 'Recyclage plastique' },
      { symbol: 'TTI', name: 'TETRA Technologies', description: 'Services énergie' },
      { symbol: 'SERV', name: 'Serve Robotics', description: 'Robots livraison' },
      { symbol: 'SMR', name: 'NuScale Power', description: 'Nucléaire modulaire' },
      { symbol: 'AMPX', name: 'Amprius Technologies', description: 'Batteries silicium' },
      { symbol: 'FLY', name: 'Fly Leasing', description: 'Leasing avions' },
      { symbol: 'RKLB', name: 'Rocket Lab', description: 'Lanceur spatial' },
      { symbol: 'TREX', name: 'Trex Company', description: 'Terrasses composites' },
      { symbol: 'BLDR', name: 'Builders FirstSource', description: 'Matériaux construction' },
      { symbol: 'KNX', name: 'Knight-Swift', description: 'Transport routier' },
      { symbol: 'VRT', name: 'Vertiv Holdings', description: 'Infrastructure data centers' },
      { symbol: 'SARO', name: 'StandardAero', description: 'Maintenance aéronautique' },
      { symbol: 'QXO', name: 'QXO Inc', description: 'Distribution matériaux' },
      { symbol: 'IR', name: 'Ingersoll Rand', description: 'Équipements industriels' }
    ]
  },
  'energy': {
    name: 'Energy',
    color: '#ff9800',
    description: 'Suivi des valeurs énergétiques',
    finvizUrl: `${FINVIZ_BASE}energy${FINVIZ_PARAMS}`,
    stocks: [
      { symbol: 'CCJ', name: 'Cameco', description: 'Uranium majeur' },
      { symbol: 'UEC', name: 'Uranium Energy', description: 'Uranium exploration' },
      { symbol: 'EC', name: 'Ecopetrol', description: 'Pétrole Colombie' },
      { symbol: 'LBRT', name: 'Liberty Energy', description: 'Services fracturation' },
      { symbol: 'CRK', name: 'Comstock Resources', description: 'Gaz naturel' },
      { symbol: 'HAL', name: 'Halliburton', description: 'Services pétroliers' },
      { symbol: 'BTU', name: 'Peabody Energy', description: 'Charbon' },
      { symbol: 'DVN', name: 'Devon Energy', description: 'Pétrole/gaz indépendant' },
      { symbol: 'UUUU', name: 'Energy Fuels', description: 'Uranium USA' },
      { symbol: 'PBF', name: 'PBF Energy', description: 'Raffinage' },
      { symbol: 'CTRA', name: 'Coterra Energy', description: 'Pétrole/gaz' },
      { symbol: 'BKR', name: 'Baker Hughes', description: 'Services pétroliers' },
      { symbol: 'MUR', name: 'Murphy Oil', description: 'Pétrole offshore' },
      { symbol: 'AESI', name: 'Atlas Energy Solutions', description: 'Sable fracturation' },
      { symbol: 'APA', name: 'APA Corporation', description: 'Pétrole/gaz exploration' },
      { symbol: 'OVV', name: 'Ovintiv', description: 'Pétrole/gaz Canada' },
      { symbol: 'FRO', name: 'Frontline', description: 'Transport pétrolier' },
      { symbol: 'NOG', name: 'Northern Oil and Gas', description: 'Pétrole non-opéré' },
      { symbol: 'AR', name: 'Antero Resources', description: 'Gaz naturel Appalachian' },
      { symbol: 'EXE', name: 'Expand Energy', description: 'Gaz naturel' }
    ]
  },
  'sp500': {
    name: 'S&P 500',
    color: '#ffd700',
    description: 'Top performers du S&P 500',
    finvizUrl: 'https://finviz.com/screener.ashx?v=141&f=idx_sp500,sh_avgvol_o2000,sh_price_o10,sh_relvol_o0.75,ta_volatility_wo3&o=-perf4w',
    stocks: [
      { symbol: 'SNDK', name: 'Sandisk', description: 'Stockage mémoire' },
      { symbol: 'MRNA', name: 'Moderna', description: 'ARNm vaccins' },
      { symbol: 'MU', name: 'Micron Technology', description: 'Mémoire DRAM/NAND' },
      { symbol: 'INTC', name: 'Intel', description: 'Processeurs' },
      { symbol: 'WDC', name: 'Western Digital', description: 'Stockage données' },
      { symbol: 'ALB', name: 'Albemarle', description: 'Lithium' },
      { symbol: 'LRCX', name: 'Lam Research', description: 'Équipements semi' },
      { symbol: 'AMAT', name: 'Applied Materials', description: 'Équipements semi' },
      { symbol: 'Q', name: 'Quintiles', description: 'Services pharma' },
      { symbol: 'BKR', name: 'Baker Hughes', description: 'Services pétroliers' },
      { symbol: 'DOW', name: 'Dow Inc', description: 'Chimie' },
      { symbol: 'HAL', name: 'Halliburton', description: 'Services pétroliers' },
      { symbol: 'BLDR', name: 'Builders FirstSource', description: 'Matériaux construction' },
      { symbol: 'IBKR', name: 'Interactive Brokers', description: 'Courtage' },
      { symbol: 'FCX', name: 'Freeport-McMoRan', description: 'Cuivre' },
      { symbol: 'LYB', name: 'LyondellBasell', description: 'Chimie' },
      { symbol: 'STZ', name: 'Constellation Brands', description: 'Boissons' },
      { symbol: 'AMD', name: 'AMD', description: 'Processeurs/GPU' },
      { symbol: 'MOS', name: 'Mosaic', description: 'Engrais' },
      { symbol: 'TER', name: 'Teradyne', description: 'Test semi-conducteurs' }
    ]
  },
  'all': {
    name: 'All Sectors',
    color: '#00e676',
    description: 'Tous les secteurs combinés - Top performers',
    finvizUrl: 'https://finviz.com/screener.ashx?v=141&f=sh_avgvol_o2000,sh_price_o10,sh_relvol_o0.75,ta_volatility_wo3&o=-perf4w',
    stocks: [
      { symbol: 'ROLR', name: 'Rollins Road', description: 'Immobilier' },
      { symbol: 'CRVS', name: 'Corvus Pharmaceuticals', description: 'Healthcare' },
      { symbol: 'ERAS', name: 'Erasca', description: 'Healthcare' },
      { symbol: 'HYMC', name: 'Hycroft Mining', description: 'Materials' },
      { symbol: 'CRML', name: 'Cordia Corporation', description: 'Materials' },
      { symbol: 'RCAT', name: 'Red Cat Holdings', description: 'Industrials' },
      { symbol: 'SNDK', name: 'Sandisk', description: 'Technology' },
      { symbol: 'UAMY', name: 'United States Antimony', description: 'Materials' },
      { symbol: 'SKYT', name: 'SkyWater Technology', description: 'Technology' },
      { symbol: 'AGQ', name: 'ProShares Ultra Silver', description: 'ETF Argent 2x' },
      { symbol: 'UMAC', name: 'Unusual Machines', description: 'Technology' },
      { symbol: 'METC', name: 'Ramaco Resources', description: 'Materials' },
      { symbol: 'NTLA', name: 'Intellia Therapeutics', description: 'Healthcare' },
      { symbol: 'IMSR', name: 'IMS Holdings', description: 'Financials' },
      { symbol: 'USAR', name: 'US Gold Corp', description: 'Materials' },
      { symbol: 'UUUU', name: 'Energy Fuels', description: 'Energy' },
      { symbol: 'UEC', name: 'Uranium Energy', description: 'Energy' },
      { symbol: 'HL', name: 'Hecla Mining', description: 'Materials' },
      { symbol: 'IRE', name: 'Iridex', description: 'Healthcare' },
      { symbol: 'FIGR', name: 'Figrr', description: 'Financials' }
    ]
  }
};

const CHART_COLORS = ['#ff5722', '#ff9800', '#ffc107', '#8bc34a', '#4caf50', '#00bcd4', '#2196f3', '#9c27b0', '#e91e63'];

function PortfolioSector() {
  const navigate = useNavigate();
  const [selectedSector, setSelectedSector] = useState('basic-materials');
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [constitutionDate, setConstitutionDate] = useState('2025-12-30');
  const [historicalPrices, setHistoricalPrices] = useState({});
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [sortConfig, setSortConfig] = useState({ key: 'performance', direction: 'desc' });

  const sector = SECTORS[selectedSector];
  const stocks = sector.stocks;

  // Convertir date YYYY-MM-DD en timestamp
  const dateToTimestamp = (dateStr) => {
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
  };

  // Trouver le prix de clôture le plus proche de la date cible
  const findClosestPrice = (timestamps, closes, targetTimestamp) => {
    if (!timestamps || !closes || timestamps.length === 0) return null;

    let closestIndex = 0;
    let minDiff = Math.abs(timestamps[0] - targetTimestamp);

    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closes[closestIndex];
  };

  // Récupérer les prix historiques pour la date de constitution et les données de graphique
  const fetchHistoricalPrices = useCallback(async () => {
    const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
    const targetTimestamp = dateToTimestamp(constitutionDate);
    const prices = {};
    const charts = [];

    for (const stock of stocks) {
      try {
        const historyPeriod = chartPeriod === '5Y' ? '5y' : (chartPeriod === '6M' ? '6m' : '1y');
        const response = await axios.get(`${apiBase}/api/history/${stock.symbol}/${historyPeriod}`);
        const data = response.data.chart.result[0];
        const timestamps = data.timestamp || [];
        const closes = data.indicators?.quote?.[0]?.close || [];

        // Prix à la date de constitution
        const price = findClosestPrice(timestamps, closes, targetTimestamp);
        if (price) {
          prices[stock.symbol] = price;
        }

        // Données pour le graphique selon la période
        const validPrices = closes.filter(p => p !== null);
        const validTimestamps = timestamps.filter((_, i) => closes[i] !== null);

        // Nombre de jours selon la période
        const periodDays = chartPeriod === '5Y' ? 1260 : chartPeriod === '1Y' ? 252 : chartPeriod === '6M' ? 126 : chartPeriod === '3M' ? 63 : 21;
        const sliceCount = periodDays + 1;

        const periodPrices = validPrices.slice(-sliceCount);
        const periodTimestamps = validTimestamps.slice(-sliceCount);
        const dailyReturns = [];

        // Trouver l'index du timestamp le plus proche de la date de constitution
        const constitutionTs = targetTimestamp;
        let closestIndex = -1;
        let minDiff = Infinity;

        for (let i = 1; i < periodTimestamps.length; i++) {
          const diff = Math.abs(periodTimestamps[i] - constitutionTs);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }

        for (let i = 1; i < periodPrices.length; i++) {
          if (periodPrices[i - 1] !== 0) {
            const returnPct = ((periodPrices[i] - periodPrices[i - 1]) / periodPrices[i - 1]) * 100;
            const date = new Date(periodTimestamps[i] * 1000);
            const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

            dailyReturns.push({
              date: dateStr,
              return: returnPct,
              price: periodPrices[i],
              isConstitution: i === closestIndex
            });
          }
        }

        charts.push({
          symbol: stock.symbol,
          name: stock.name,
          price: validPrices[validPrices.length - 1],
          dailyReturns
        });

      } catch (err) {
        console.error(`Erreur historique pour ${stock.symbol}:`, err);
      }
    }

    setHistoricalPrices(prices);
    setChartData(charts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constitutionDate, chartPeriod, selectedSector]);

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

      const promises = stocks.map(async (stock) => {
        try {
          const url = `${apiBase}/api/finance/${stock.symbol}`;
          const response = await axios.get(url);

          const data = response.data.chart.result[0];
          const currentPrice = data.meta.regularMarketPrice;
          const volume = data.meta.regularMarketVolume;

          return {
            ...stock,
            currentPrice: currentPrice,
            volume: volume
          };
        } catch (err) {
          console.error(`Erreur pour ${stock.symbol}:`, err);
          return {
            ...stock,
            currentPrice: null,
            volume: null,
            error: 'Erreur de chargement'
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
  }, [stocks]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    fetchHistoricalPrices();
  }, [fetchHistoricalPrices]);

  const handleSectorChange = (e) => {
    setSelectedSector(e.target.value);
    setPortfolio([]);
    setChartData([]);
    setHistoricalPrices({});
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatVolume = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (e) => {
    setConstitutionDate(e.target.value);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedPortfolio = () => {
    if (!sortConfig.key) return portfolio;

    return [...portfolio].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'symbol':
          aValue = a.symbol.toLowerCase();
          bValue = b.symbol.toLowerCase();
          break;
        case 'buyPrice':
          aValue = historicalPrices[a.symbol] || 0;
          bValue = historicalPrices[b.symbol] || 0;
          break;
        case 'currentPrice':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'volume':
          aValue = a.volume || 0;
          bValue = b.volume || 0;
          break;
        case 'performance':
          const aBuyPrice = historicalPrices[a.symbol] || 0;
          const bBuyPrice = historicalPrices[b.symbol] || 0;
          aValue = aBuyPrice > 0 ? ((a.currentPrice || 0) - aBuyPrice) / aBuyPrice * 100 : 0;
          bValue = bBuyPrice > 0 ? ((b.currentPrice || 0) - bBuyPrice) / bBuyPrice * 100 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {label}
      <span style={{ marginLeft: '5px', fontSize: '0.7rem' }}>
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'asc' ? '▲' : '▼'
        ) : (
          <span style={{ color: '#555' }}>▼</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="App">
      <header className="App-header">
        <div className="nav-buttons">
          <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
          <button onClick={fetchPrices} className="nav-button">Actualiser</button>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginTop: '20px' }}>
          Portfolio Secteur
        </h1>

        {/* Sélecteur de secteur */}
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <label style={{ color: '#9fa3a8', fontSize: '0.85rem' }}>
            Secteur :
          </label>
          <select
            value={selectedSector}
            onChange={handleSectorChange}
            style={{
              padding: '8px 15px',
              borderRadius: '5px',
              border: `2px solid ${sector.color}`,
              backgroundColor: '#1e2228',
              color: sector.color,
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {Object.entries(SECTORS).map(([key, s]) => (
              <option key={key} value={key} style={{ color: '#e6e6e6' }}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <p style={{ color: '#9fa3a8', marginBottom: '10px', fontSize: '0.85rem' }}>
          {sector.description} -
          <a
            href={sector.finvizUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: sector.color, marginLeft: '5px' }}
          >
            Screener Finviz
          </a>
        </p>

        {/* Date de constitution */}
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <label style={{ color: '#9fa3a8', fontSize: '0.85rem' }}>
            Date de constitution :
          </label>
          <input
            type="date"
            value={constitutionDate}
            onChange={handleDateChange}
            style={{
              padding: '5px 10px',
              borderRadius: '5px',
              border: '1px solid #3a3f47',
              backgroundColor: '#1e2228',
              color: '#e6e6e6',
              fontSize: '0.85rem'
            }}
          />
          <span style={{ color: sector.color, fontSize: '0.85rem' }}>
            ({formatDate(constitutionDate)})
          </span>
        </div>

        {loading && <p>Chargement des données...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && portfolio.length > 0 && (
          <>
            <table className="portfolio-table">
              <thead>
                <tr>
                  <SortHeader label="Action" sortKey="symbol" />
                  <th>Description</th>
                  <SortHeader label={`Prix (${formatDate(constitutionDate)})`} sortKey="buyPrice" />
                  <SortHeader label="Prix actuel" sortKey="currentPrice" />
                  <SortHeader label="Volume" sortKey="volume" />
                  <SortHeader label="Performance" sortKey="performance" />
                </tr>
              </thead>
              <tbody>
                {getSortedPortfolio().map((stock, index) => {
                  const buyPrice = historicalPrices[stock.symbol];
                  const currentPrice = stock.currentPrice;
                  const diffPercent = buyPrice && currentPrice ? ((currentPrice - buyPrice) / buyPrice) * 100 : null;

                  return (
                    <tr key={index}>
                      <td className="etf-name">
                        <div>{stock.name}</div>
                        <a
                          href={`https://finance.yahoo.com/quote/${stock.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="etf-symbol-link"
                        >
                          {stock.symbol}
                        </a>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#9fa3a8' }}>{stock.description}</td>
                      <td>
                        {buyPrice ? (
                          `${formatNumber(buyPrice)} USD`
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td>
                        {currentPrice ? (
                          `${formatNumber(currentPrice)} USD`
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td>{formatVolume(stock.volume)}</td>
                      <td style={{ color: diffPercent !== null ? (diffPercent >= 0 ? '#4caf50' : '#ff6b6b') : '#e6e6e6' }}>
                        {diffPercent !== null ? (
                          `${diffPercent >= 0 ? '+' : ''}${diffPercent.toFixed(2)}%`
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              Prix de référence = clôture au {formatDate(constitutionDate)}
            </p>
          </>
        )}

        {/* Graphiques des rendements journaliers */}
        {chartData.length > 0 && (
          <div style={{
            width: '98%',
            maxWidth: '1800px',
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#1a1d21',
            borderRadius: '12px',
            border: `2px solid ${sector.color}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{
                color: sector.color,
                margin: 0,
                fontSize: '1.2rem'
              }}>
                Rendements Journaliers ({chartPeriod === '5Y' ? '5 ans' : chartPeriod === '1Y' ? '1 an' : chartPeriod === '6M' ? '6 mois' : chartPeriod === '3M' ? '3 mois' : '1 mois'})
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['1M', '3M', '6M', '1Y', '5Y'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '5px',
                      border: chartPeriod === period ? `2px solid ${sector.color}` : '1px solid #3a3f47',
                      backgroundColor: chartPeriod === period ? sector.color : '#1e2228',
                      color: chartPeriod === period ? '#fff' : '#9fa3a8',
                      cursor: 'pointer',
                      fontWeight: chartPeriod === period ? 'bold' : 'normal',
                      fontSize: '0.85rem'
                    }}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: '20px'
            }}>
              {[...chartData].sort((a, b) => {
                let aValue, bValue;
                switch (sortConfig.key) {
                  case 'symbol':
                    aValue = a.symbol.toLowerCase();
                    bValue = b.symbol.toLowerCase();
                    break;
                  case 'buyPrice':
                    aValue = historicalPrices[a.symbol] || 0;
                    bValue = historicalPrices[b.symbol] || 0;
                    break;
                  case 'currentPrice':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                  case 'volume':
                    const aStock = portfolio.find(s => s.symbol === a.symbol);
                    const bStock = portfolio.find(s => s.symbol === b.symbol);
                    aValue = aStock?.volume || 0;
                    bValue = bStock?.volume || 0;
                    break;
                  case 'performance':
                  default:
                    const aBuyPrice = historicalPrices[a.symbol] || 0;
                    const bBuyPrice = historicalPrices[b.symbol] || 0;
                    aValue = aBuyPrice > 0 ? ((a.price || 0) - aBuyPrice) / aBuyPrice * 100 : 0;
                    bValue = bBuyPrice > 0 ? ((b.price || 0) - bBuyPrice) / bBuyPrice * 100 : 0;
                    break;
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
              }).map((tickerData, index) => (
                <div
                  key={tickerData.symbol}
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
                    {tickerData.symbol} - {tickerData.name}
                    <span style={{ color: '#9fa3a8', fontSize: '0.8rem', marginLeft: '10px' }}>
                      (${tickerData.price?.toFixed(2)})
                    </span>
                    {(() => {
                      const returns = tickerData.dailyReturns || [];
                      if (returns.length < 2) return null;
                      const firstPrice = returns[0]?.price;
                      const lastPrice = returns[returns.length - 1]?.price;
                      if (!firstPrice || !lastPrice) return null;
                      const perfPercent = ((lastPrice - firstPrice) / firstPrice) * 100;
                      return (
                        <span style={{
                          color: perfPercent >= 0 ? '#4caf50' : '#ff6b6b',
                          fontSize: '0.9rem',
                          marginLeft: '10px',
                          fontWeight: 'bold'
                        }}>
                          {perfPercent >= 0 ? '+' : ''}{perfPercent.toFixed(1)}%
                        </span>
                      );
                    })()}
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
                        interval={Math.floor((tickerData.dailyReturns?.length || 1) / (chartPeriod === '5Y' ? 20 : chartPeriod === '1Y' ? 12 : chartPeriod === '6M' ? 10 : chartPeriod === '3M' ? 8 : 6))}
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
                        labelFormatter={(label) => `Date: ${label}`}
                        labelStyle={{ color: sector.color, fontWeight: 'bold' }}
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
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          if (payload.isConstitution) {
                            return (
                              <g key={`dot-${cx}-${cy}`}>
                                <circle cx={cx} cy={cy} r={8} fill={sector.color} stroke="#fff" strokeWidth={2} />
                                <circle cx={cx} cy={cy} r={4} fill="#fff" />
                              </g>
                            );
                          }
                          return null;
                        }}
                        activeDot={{ r: 3, fill: '#61dafb' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default PortfolioSector;
