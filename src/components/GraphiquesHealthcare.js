import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './GraphiquesETF.css';

function GraphiquesHealthcare() {
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1m');

  // Données du portefeuille Healthcare (mis à jour 30/12/2025)
  const stocks = [
    { symbol: 'PACS', name: 'PACS Group', color: '#4caf50', units: 10, buyPrice: 0, buyDate: '2025-12-30', description: 'Opérateur soins post-aigus' },
    { symbol: 'CRMD', name: 'CorMedix', color: '#2196f3', units: 10, buyPrice: 0, buyDate: '2025-12-30', description: 'Biopharma dialyse' },
    { symbol: 'PRAX', name: 'Praxis Precision Medicines', color: '#9c27b0', units: 10, buyPrice: 0, buyDate: '2025-12-30', description: 'Biotech neurologie' },
    { symbol: 'OMER', name: 'Omeros', color: '#ff9800', units: 10, buyPrice: 0, buyDate: '2025-12-30', description: 'Biopharma maladies rares' },
    { symbol: 'FULC', name: 'Fulcrum Therapeutics', color: '#e91e63', units: 10, buyPrice: 0, buyDate: '2025-12-30', description: 'Biotech régulation génétique' }
  ];

  const [combinedData, setCombinedData] = useState([]);

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

      const promises = stocks.map(async (stock) => {
        try {
          const url = `${apiBase}/api/history/${stock.symbol}/${selectedPeriod}`;
          console.log(`Fetching ${stock.symbol} from ${url}`);
          const response = await axios.get(url);

          const result = response.data.chart.result[0];
          const timestamps = result.timestamp;
          const prices = result.indicators.quote[0].close;

          const data = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            return {
              timestamp: timestamp,
              date: date.toLocaleDateString('fr-FR'),
              time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              datetime: `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              price: prices[index] ? parseFloat(prices[index].toFixed(2)) : null
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
      calculateCombinedPerformance(results);
      setError(null);
    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Impossible de charger les données historiques');
    } finally {
      setLoading(false);
    }
  };

  // Calcul des performances combinées (normalisées en %)
  const calculateCombinedPerformance = (results) => {
    const allDates = new Set();
    const pricesByDate = {};

    results.forEach(result => {
      pricesByDate[result.symbol] = {};
      result.data.forEach(item => {
        allDates.add(item.date);
        pricesByDate[result.symbol][item.date] = item.price;
      });
    });

    const sortedDates = Array.from(allDates).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    // Tracker les premiers prix pour normalisation
    const firstPrices = {};
    const lastKnownPrices = {};
    stocks.forEach(stock => {
      firstPrices[stock.symbol] = null;
      lastKnownPrices[stock.symbol] = null;
    });

    const combined = sortedDates.map(dateStr => {
      const dataPoint = { date: dateStr };

      stocks.forEach(stock => {
        if (pricesByDate[stock.symbol][dateStr]) {
          lastKnownPrices[stock.symbol] = pricesByDate[stock.symbol][dateStr];
        }

        if (firstPrices[stock.symbol] === null && lastKnownPrices[stock.symbol] !== null) {
          firstPrices[stock.symbol] = lastKnownPrices[stock.symbol];
        }

        const currentPrice = lastKnownPrices[stock.symbol];
        const firstPrice = firstPrices[stock.symbol];

        if (currentPrice && firstPrice) {
          const perf = parseFloat(((currentPrice - firstPrice) / firstPrice * 100).toFixed(2));
          dataPoint[stock.symbol] = perf;
        }
      });

      return dataPoint;
    }).filter(item => {
      return stocks.some(stock => item[stock.symbol] !== undefined);
    });

    setCombinedData(combined);
  };

  if (loading) {
    return (
      <div className="charts-container">
        <h1>Graphiques Portfolio Healthcare</h1>
        <p>Chargement des données historiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <h1>Graphiques Portfolio Healthcare</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="nav-buttons">
        <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        <button onClick={() => navigate('/healthcare')} className="nav-button">Portfolio</button>
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

      {/* Graphique combiné - Toutes les actions en % */}
      {combinedData.length > 0 && (
        <div className="chart-section portfolio-total-section">
          <h2>Performance comparée (%)</h2>
          <div style={{ fontSize: '0.75rem', marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {stocks.map(stock => {
              const lastPoint = combinedData[combinedData.length - 1];
              const perf = lastPoint ? lastPoint[stock.symbol] : null;
              return perf !== undefined && perf !== null ? (
                <span key={stock.symbol} style={{ color: perf >= 0 ? '#4caf50' : '#f44336' }}>
                  {stock.symbol}: {perf >= 0 ? '+' : ''}{perf}%
                </span>
              ) : null;
            })}
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis
                dataKey="date"
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
                    return [<span style={{ color }}>{value >= 0 ? '+' : ''}{value}%</span>, name];
                  }
                  return [null, null];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {stocks.map((stock) => (
                <Line
                  key={stock.symbol}
                  type="monotone"
                  dataKey={stock.symbol}
                  stroke={stock.color}
                  strokeWidth={2}
                  dot={false}
                  name={stock.symbol}
                  connectNulls={false}
                />
              ))}
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

        return (
          <div key={stock.symbol} className="chart-section">
            <h2>
              {stock.name} (
              <a href={`https://finance.yahoo.com/quote/${stock.symbol}`} target="_blank" rel="noopener noreferrer" className="etf-chart-link">
                {stock.symbol}
              </a>
              )
              {(() => {
                const perf = calculatePerformance(chartData.data);
                if (perf !== null && chartData.data.length > 0) {
                  const perfNum = parseFloat(perf);
                  return (
                    <span style={{ float: 'right', textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b' }}>
                        {perfNum >= 0 ? '+' : ''}{perf}%
                      </div>
                    </span>
                  );
                }
                return null;
              })()}
            </h2>
            <p style={{ fontSize: '0.75rem', color: '#9fa3a8', marginBottom: '10px' }}>{stock.description}</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.data}>
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
                  formatter={(value) => [`${value?.toLocaleString('fr-FR')} USD`, 'Prix']}
                />
                <Line type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} dot={false} name="Prix" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

export default GraphiquesHealthcare;
