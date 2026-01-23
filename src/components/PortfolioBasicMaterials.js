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

const CHART_COLORS = ['#ff5722', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];

function PortfolioBasicMaterials() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [constitutionDate, setConstitutionDate] = useState('2025-12-30');
  const [historicalPrices, setHistoricalPrices] = useState({});
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('1M');
  const [sortConfig, setSortConfig] = useState({ key: 'performance', direction: 'desc' });

  // Données du portefeuille Basic Materials
  const stocks = [
    { symbol: 'ERO', name: 'Ero Copper', description: 'Producteur cuivre Amérique latine' },
    { symbol: 'ALB', name: 'Albemarle', description: 'Leader mondial lithium' },
    { symbol: 'PAAS', name: 'Pan American Silver', description: 'Producteur argent et or' },
    { symbol: 'CDE', name: 'Coeur Mining', description: 'Métaux précieux' },
    { symbol: 'HYMC', name: 'Hycroft Mining', description: 'Or/argent spéculatif' },
    { symbol: 'CRML', name: 'Crypto Minerals', description: 'Minéraux crypto' },
    { symbol: 'UAMY', name: 'United States Antimony', description: 'Antimoine USA' },
    { symbol: 'METC', name: 'Ramaco Resources', description: 'Charbon métallurgique' },
    { symbol: 'USAR', name: 'US Gold Corp', description: 'Exploration or USA' },
    { symbol: 'HL', name: 'Hecla Mining', description: 'Argent et or' },
    { symbol: 'NVA', name: 'Nova Minerals', description: 'Exploration or Alaska' },
    { symbol: 'AG', name: 'First Majestic Silver', description: 'Producteur argent Mexique' },
    { symbol: 'NGD', name: 'New Gold', description: 'Producteur or Canada' },
    { symbol: 'EXK', name: 'Endeavour Silver', description: 'Producteur argent' },
    { symbol: 'SVM', name: 'Silvercorp Metals', description: 'Argent Chine' },
    { symbol: 'CC', name: 'Chemours', description: 'Chimie titane' },
    { symbol: 'MUX', name: 'McEwen Mining', description: 'Or et argent Amériques' },
    { symbol: 'BVN', name: 'Buenaventura Mining', description: 'Métaux précieux Pérou' },
    { symbol: 'KGC', name: 'Kinross Gold', description: 'Producteur or majeur' },
    { symbol: 'EGO', name: 'Eldorado Gold', description: 'Producteur or international' },
    { symbol: 'SBSW', name: 'Sibanye Stillwater', description: 'PGM et or Afrique Sud' },
    { symbol: 'MP', name: 'MP Materials', description: 'Terres rares USA' }
  ];

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
  }, [constitutionDate, chartPeriod]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHistoricalPrices();
  }, [fetchHistoricalPrices]);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

      const promises = stocks.map(async (stock) => {
        try {
          const url = `${apiBase}/api/finance/${stock.symbol}`;
          console.log(`Fetching ${stock.symbol} from ${url}`);
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
            totalUSD: null,
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
          Portfolio Basic Materials
        </h1>
        <p style={{ color: '#9fa3a8', marginBottom: '10px', fontSize: '0.85rem' }}>
          Suivi des valeurs minières et matériaux -
          <a
            href="https://finviz.com/screener.ashx?v=141&f=sec_basicmaterials,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75,ta_volatility_wo3&o=-perf1w"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff5722' }}
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
          <span style={{ color: '#ff5722', fontSize: '0.85rem' }}>
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
            border: '2px solid #ff5722'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{
                color: '#ff5722',
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
                      border: chartPeriod === period ? '2px solid #ff5722' : '1px solid #3a3f47',
                      backgroundColor: chartPeriod === period ? '#ff5722' : '#1e2228',
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
                        labelStyle={{ color: '#ff5722', fontWeight: 'bold' }}
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
                                <circle cx={cx} cy={cy} r={8} fill="#ff5722" stroke="#fff" strokeWidth={2} />
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

export default PortfolioBasicMaterials;
