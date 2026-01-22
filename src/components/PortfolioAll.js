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
// UNIVERS - Portfolio All (Basic Materials - Finviz Screener)
// Filters: sec:basicmaterials sh_avgvol:o1000 sh_price:o10 sh_relvol:o0.75 ta_volatility:wo3
// ═══════════════════════════════════════════════════════════════════════════

const PORTFOLIO_TICKERS = [
  { ticker: 'HYMC', name: 'Hycroft Mining' },
  { ticker: 'CRML', name: 'Critical Metals Corp' },
  { ticker: 'UAMY', name: 'United States Antimony' },
  { ticker: 'METC', name: 'Ramaco Resources' },
  { ticker: 'USAR', name: 'USA Rare Earth' },
  { ticker: 'HL', name: 'Hecla Mining' },
  { ticker: 'NVA', name: 'Nova Minerals' },
  { ticker: 'AG', name: 'First Majestic Silver' },
  { ticker: 'NGD', name: 'New Gold' },
  { ticker: 'EXK', name: 'Endeavour Silver' },
  { ticker: 'SVM', name: 'Silvercorp Metals' },
  { ticker: 'CDE', name: 'Coeur Mining' },
  { ticker: 'MUX', name: 'McEwen Mining' },
  { ticker: 'MP', name: 'MP Materials' },
  { ticker: 'BVN', name: 'Buenaventura Mining' },
  { ticker: 'ALB', name: 'Albemarle Corp' },
  { ticker: 'KGC', name: 'Kinross Gold' },
  { ticker: 'EGO', name: 'Eldorado Gold' },
  { ticker: 'SBSW', name: 'Sibanye Stillwater' },
  { ticker: 'HBM', name: 'Hudbay Minerals' }
];

// Date de référence pour le point sur les graphiques
const REFERENCE_DATE_FORMATTED = '22/01';

// Couleurs pour les graphiques
const CHART_COLORS = ['#e91e63', '#673ab7', '#2196f3', '#ff9800', '#4caf50', '#00bcd4', '#f44336', '#9c27b0', '#009688', '#ffeb3b'];

function PortfolioAll() {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTicker, setLoadingTicker] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'perfWeek', direction: 'desc' });

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH YAHOO DATA
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchYahooData = async (tickerInfo) => {
    try {
      const symbol = tickerInfo.ticker;
      const response = await axios.get(`${PROXY_URL}/api/history/${symbol}/5y`, {
        timeout: 15000
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) return null;

      const meta = result.meta;
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0];
      const prices = quotes.close || [];
      const volumes = quotes.volume || [];

      // Filtrer les valeurs null
      const validData = [];
      for (let i = 0; i < prices.length; i++) {
        if (prices[i] !== null) {
          validData.push({
            price: prices[i],
            volume: volumes[i] || 0,
            timestamp: timestamps[i]
          });
        }
      }

      const currentPrice = meta.regularMarketPrice || validData[validData.length - 1]?.price;
      const volume = meta.regularMarketVolume || 0;

      // Volume moyen (50 jours)
      const recentVolumes = validData.slice(-50).map(d => d.volume).filter(v => v > 0);
      const avgVolume = recentVolumes.length > 0
        ? recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
        : 1;

      const len = validData.length;
      const now = Date.now() / 1000;

      // Rendements journaliers
      const perf1D = len >= 2 ? ((validData[len-1].price - validData[len-2].price) / validData[len-2].price) * 100 : null;
      const perf2D = len >= 3 ? ((validData[len-2].price - validData[len-3].price) / validData[len-3].price) * 100 : null;
      const perf3D = len >= 4 ? ((validData[len-3].price - validData[len-4].price) / validData[len-4].price) * 100 : null;
      const perf4D = len >= 5 ? ((validData[len-4].price - validData[len-5].price) / validData[len-5].price) * 100 : null;
      const perf5D = len >= 6 ? ((validData[len-5].price - validData[len-6].price) / validData[len-6].price) * 100 : null;
      const perf6D = len >= 7 ? ((validData[len-6].price - validData[len-7].price) / validData[len-7].price) * 100 : null;

      // Fonction pour trouver le prix à une date passée
      const findPriceAtDaysAgo = (daysAgo) => {
        const targetTimestamp = now - (daysAgo * 24 * 60 * 60);
        for (let i = validData.length - 1; i >= 0; i--) {
          if (validData[i].timestamp <= targetTimestamp) {
            return validData[i].price;
          }
        }
        return null;
      };

      // Performance périodiques
      const calcPerfCalendar = (calendarDays) => {
        const startPrice = findPriceAtDaysAgo(calendarDays);
        return startPrice ? ((currentPrice - startPrice) / startPrice) * 100 : null;
      };

      const perfWeek = calcPerfCalendar(7);
      const perfMonth = calcPerfCalendar(30);
      const perfQuart = calcPerfCalendar(90);
      const perfHalf = calcPerfCalendar(180);
      const perfYear = calcPerfCalendar(365);
      const perf3Y = calcPerfCalendar(365 * 3);
      const perf5Y = calcPerfCalendar(365 * 5);
      const perf10Y = calcPerfCalendar(365 * 10);

      // YTD
      const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime() / 1000;
      let ytdPrice = null;
      for (let i = 0; i < validData.length; i++) {
        if (validData[i].timestamp >= startOfYear) {
          ytdPrice = i > 0 ? validData[i - 1].price : validData[i].price;
          break;
        }
      }
      const perfYTD = ytdPrice ? ((currentPrice - ytdPrice) / ytdPrice) * 100 : null;

      // Volatilité
      const calcVolatility = (tradingDays) => {
        if (len < tradingDays + 1) return null;
        const returns = [];
        for (let i = len - tradingDays; i < len; i++) {
          if (validData[i - 1]?.price > 0) {
            returns.push(((validData[i].price - validData[i - 1].price) / validData[i - 1].price) * 100);
          }
        }
        if (returns.length < 2) return null;
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
      };

      const volWeek = calcVolatility(5);
      const volMonth = calcVolatility(21);

      // MM20 et MM50
      const last20 = validData.slice(-20).map(d => d.price);
      const mm20 = last20.length >= 20 ? last20.reduce((a, b) => a + b, 0) / 20 : null;
      const distanceMM20 = mm20 ? ((currentPrice - mm20) / mm20) * 100 : null;

      const last50 = validData.slice(-50).map(d => d.price);
      const mm50 = last50.length >= 50 ? last50.reduce((a, b) => a + b, 0) / 50 : null;
      const distanceMM50 = mm50 ? ((currentPrice - mm50) / mm50) * 100 : null;

      const relVolume = avgVolume > 0 ? volume / avgVolume : 1;

      // DailyReturns pour le graphique (30 derniers jours)
      const last31Data = validData.slice(-31);
      const dailyReturns = [];
      for (let i = 1; i < last31Data.length; i++) {
        if (last31Data[i - 1].price !== 0) {
          const returnPct = ((last31Data[i].price - last31Data[i - 1].price) / last31Data[i - 1].price) * 100;
          const date = new Date(last31Data[i].timestamp * 1000);
          const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          dailyReturns.push({
            date: dateStr,
            return: returnPct,
            price: last31Data[i].price,
            isReferenceDate: dateStr === REFERENCE_DATE_FORMATTED
          });
        }
      }

      return {
        ticker: tickerInfo.ticker,
        name: tickerInfo.name,
        price: currentPrice,
        volume,
        avgVolume,
        relVolume,
        perf1D, perf2D, perf3D, perf4D, perf5D, perf6D,
        perfWeek, perfMonth, perfQuart, perfHalf, perfYTD, perfYear, perf3Y, perf5Y, perf10Y,
        volWeek, volMonth,
        distanceMM20, distanceMM50,
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
    setPerformanceData([]);
    const results = [];

    for (const tickerInfo of PORTFOLIO_TICKERS) {
      setLoadingTicker(tickerInfo.ticker);
      const data = await fetchYahooData(tickerInfo);
      if (data) {
        results.push(data);
        setPerformanceData([...results]);
      }
      await new Promise(r => setTimeout(r, 250));
    }

    setLoadingTicker('');
    setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // SORTING
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedData = [...performanceData].sort((a, b) => {
    const aVal = a[sortConfig.key] ?? -Infinity;
    const bVal = b[sortConfig.key] ?? -Infinity;
    return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMATAGE
  // ═══════════════════════════════════════════════════════════════════════════
  const formatPercent = (val) => {
    if (val === null || val === undefined) return '-';
    const color = val >= 0 ? '#4caf50' : '#f44336';
    return <span style={{ color }}>{val.toFixed(2)}%</span>;
  };

  const formatNumber = (val) => {
    if (val === null || val === undefined) return '-';
    return val.toFixed(2);
  };

  const formatVolume = (val) => {
    if (val === null || val === undefined) return '-';
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val.toFixed(0);
  };

  // Composant header triable
  const SortableHeader = ({ label, sortKey }) => (
    <th
      onClick={() => handleSort(sortKey)}
      style={{
        cursor: 'pointer',
        textAlign: 'center',
        backgroundColor: sortConfig.key === sortKey ? '#2a3f5f' : undefined
      }}
    >
      {label} {sortConfig.key === sortKey && (sortConfig.direction === 'desc' ? '▼' : '▲')}
    </th>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="App">
      <header className="App-header">
        {/* Navigation */}
        <div className="nav-buttons">
          <button className="nav-button" onClick={() => navigate('/')}>
            Accueil
          </button>
          <button className="nav-button" onClick={() => navigate('/performer')}>
            Performer
          </button>
        </div>

        <h1 style={{ marginBottom: '10px', color: '#ff9800' }}>
          Portfolio All - Basic Materials
        </h1>
        <p className="subtitle">
          Finviz Screener: Basic Materials | AvgVol &gt; 1M | Price &gt; $10 | RelVol &gt; 0.75 | Vol Week &gt; 3%
        </p>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 20px',
              backgroundColor: loading ? '#666' : '#ff9800',
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

        {/* Tableau des performances */}
        {performanceData.length > 0 && (
          <div style={{ overflowX: 'auto', width: '98%', maxWidth: '1800px', marginBottom: '30px' }}>
            <table className="portfolio-table" style={{ fontSize: '0.7rem' }}>
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
                  <tr key={row.ticker} style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(255, 152, 0, 0.05)' : 'transparent'
                  }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ff9800' }}>
                      {index + 1}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      <a
                        href={`https://finviz.com/quote.ashx?t=${row.ticker}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 'bold', color: '#ff9800' }}
                      >
                        {row.ticker}
                      </a>
                      <div style={{ fontSize: '0.6rem', color: '#888' }}>{row.name}</div>
                    </td>
                    <td>{formatPercent(row.perf1D)}</td>
                    <td>{formatPercent(row.perf2D)}</td>
                    <td>{formatPercent(row.perf3D)}</td>
                    <td>{formatPercent(row.perf4D)}</td>
                    <td>{formatPercent(row.perf5D)}</td>
                    <td>{formatPercent(row.perf6D)}</td>
                    <td style={{ fontWeight: 'bold' }}>{formatPercent(row.perfWeek)}</td>
                    <td style={{ fontWeight: 'bold' }}>{formatPercent(row.perfMonth)}</td>
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
                    <td style={{ color: row.relVolume >= 1 ? '#4caf50' : '#888' }}>{formatNumber(row.relVolume)}</td>
                    <td style={{ fontWeight: 'bold', color: '#61dafb' }}>${formatNumber(row.price)}</td>
                    <td>{formatVolume(row.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Graphiques des rendements journaliers */}
        {performanceData.length > 0 && (
          <div style={{
            width: '98%',
            maxWidth: '1800px',
            marginTop: '20px',
            padding: '20px',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderRadius: '12px',
            border: '2px solid #ff9800'
          }}>
            <h3 style={{ color: '#ff9800', marginBottom: '20px', textAlign: 'center' }}>
              Graphiques - 30 Derniers Jours (Point jaune = 22/01/2026)
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '15px'
            }}>
              {sortedData.map((tickerData, index) => {
                const refData = tickerData.dailyReturns?.find(d => d.isReferenceDate);

                return (
                  <div
                    key={tickerData.ticker}
                    style={{
                      padding: '12px',
                      backgroundColor: '#1e2228',
                      borderRadius: '8px',
                      border: `2px solid ${CHART_COLORS[index % CHART_COLORS.length]}`
                    }}
                  >
                    <h4 style={{
                      color: CHART_COLORS[index % CHART_COLORS.length],
                      marginBottom: '8px',
                      textAlign: 'center',
                      fontSize: '0.95rem'
                    }}>
                      {tickerData.ticker}
                      <span style={{ color: '#61dafb', fontSize: '0.8rem', marginLeft: '10px' }}>
                        ${tickerData.price?.toFixed(2)}
                      </span>
                      <span style={{
                        color: tickerData.perfWeek >= 0 ? '#4caf50' : '#f44336',
                        fontSize: '0.75rem',
                        marginLeft: '8px'
                      }}>
                        W: {tickerData.perfWeek?.toFixed(1)}%
                      </span>
                    </h4>
                    <ResponsiveContainer width="100%" height={180}>
                      <ComposedChart
                        data={tickerData.dailyReturns || []}
                        margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#9fa3a8"
                          tick={{ fill: '#9fa3a8', fontSize: 8 }}
                          interval={Math.floor((tickerData.dailyReturns?.length || 1) / 5)}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#61dafb"
                          tick={{ fill: '#61dafb', fontSize: 9 }}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                          domain={['auto', 'auto']}
                          width={40}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#9fa3a8"
                          tick={{ fill: '#9fa3a8', fontSize: 9 }}
                          tickFormatter={(value) => `${value.toFixed(0)}%`}
                          domain={['auto', 'auto']}
                          width={35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e2228',
                            border: '1px solid #3a3f47',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}
                          formatter={(value, name) => {
                            if (name === 'price') return [`$${value.toFixed(2)}`, 'Prix'];
                            const color = value >= 0 ? '#4caf50' : '#ff6b6b';
                            return [<span style={{ color }}>{value.toFixed(2)}%</span>, 'J'];
                          }}
                        />
                        <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeWidth={1} />
                        <Bar yAxisId="right" dataKey="return" radius={[2, 2, 0, 0]}>
                          {(tickerData.dailyReturns || []).map((entry, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={entry.isReferenceDate ? '#ffd700' : (entry.return >= 0 ? '#4caf50' : '#ff6b6b')}
                              stroke={entry.isReferenceDate ? '#fff' : 'none'}
                              strokeWidth={entry.isReferenceDate ? 2 : 0}
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
                            if (payload.isReferenceDate) {
                              return (
                                <g key={`dot-${props.index}`}>
                                  <circle cx={cx} cy={cy} r={6} fill="#ffd700" stroke="#fff" strokeWidth={2} />
                                  <text x={cx} y={cy - 12} fill="#ffd700" fontSize={9} fontWeight="bold" textAnchor="middle">
                                    ${payload.price.toFixed(2)}
                                  </text>
                                </g>
                              );
                            }
                            return null;
                          }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                    {refData && (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#ffd700', marginTop: '5px' }}>
                        22/01: <strong>${refData.price.toFixed(2)}</strong>
                        <span style={{ color: refData.return >= 0 ? '#4caf50' : '#ff6b6b', marginLeft: '8px' }}>
                          ({refData.return >= 0 ? '+' : ''}{refData.return.toFixed(2)}%)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading && performanceData.length === 0 && (
          <p style={{ color: '#61dafb' }}>
            Chargement... {loadingTicker && `(${loadingTicker})`}
          </p>
        )}
      </header>
    </div>
  );
}

export default PortfolioAll;
