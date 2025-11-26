import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Graphiques_ETF.css';

function Graphiques_Met() {
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState({});
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('5d');

  const stocks = [
    { symbol: 'AVGO', name: 'Broadcom Inc.', color: '#9c27b0', units: 60 },
    { symbol: 'LLY', name: 'Eli Lilly and Co.', color: '#4caf50', units: 20 },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', color: '#2196f3', units: 57 },
    { symbol: 'IDXX', name: 'Idexx Laboratories', color: '#f44336', units: 18 },
    { symbol: 'REGN', name: 'Regeneron Pharmaceuticals', color: '#ff9800', units: 17 }
  ];

  const periods = [
    { value: '1d', label: '1J' },
    { value: '5d', label: '5J' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' }
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
          const response = await axios.get(`${apiBase}/api/history/${stock.symbol}/${selectedPeriod}`);
          const result = response.data.chart.result[0];
          const data = result.timestamp.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            return {
              timestamp,
              date: date.toLocaleDateString('fr-FR'),
              time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              datetime: `${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              price: result.indicators.quote[0].close[index] ? parseFloat(result.indicators.quote[0].close[index].toFixed(2)) : null
            };
          });
          return { symbol: stock.symbol, name: stock.name, color: stock.color, units: stock.units, data: fillMissingValues(data) };
        } catch (err) {
          return { symbol: stock.symbol, name: stock.name, color: stock.color, units: stock.units, data: [], error: true };
        }
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(r => dataMap[r.symbol] = r);
      setChartsData(dataMap);
      calculatePortfolioTotal(results);
      setError(null);
    } catch (err) {
      setError('Impossible de charger les données historiques');
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioTotal = (results) => {
    const allTimestamps = new Set();
    results.forEach(r => r.data.forEach(item => allTimestamps.add(item.timestamp)));
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const lastKnownPrices = {};
    stocks.forEach(s => lastKnownPrices[s.symbol] = null);

    const portfolioValues = sortedTimestamps.map(timestamp => {
      let totalValue = 0;
      let allHaveValue = true;
      results.forEach(result => {
        const stockData = stocks.find(s => s.symbol === result.symbol);
        const priceData = result.data.find(item => item.timestamp === timestamp);
        if (priceData?.price) {
          lastKnownPrices[result.symbol] = priceData.price;
          totalValue += priceData.price * stockData.units;
        } else if (lastKnownPrices[result.symbol]) {
          totalValue += lastKnownPrices[result.symbol] * stockData.units;
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
    setPortfolioData(portfolioValues);
  };

  if (loading) return <div className="charts-container"><h1>Graphiques Portfolio Met</h1><p>Chargement...</p></div>;
  if (error) return <div className="charts-container"><h1>Graphiques Portfolio Met</h1><p className="error">{error}</p></div>;

  return (
    <div className="charts-container">
      <div className="nav-buttons">
        <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        <button onClick={() => navigate('/met')} className="nav-button">Portfolio</button>
      </div>

      <div className="header-controls">
        <div className="period-selector">
          {periods.map(p => (
            <button key={p.value} className={`period-button ${selectedPeriod === p.value ? 'active' : ''}`} onClick={() => setSelectedPeriod(p.value)}>{p.label}</button>
          ))}
        </div>
      </div>

      {portfolioData.length > 0 && (
        <div className="chart-section portfolio-total-section">
          <h2>
            Portfolio Met (USD)
            {(() => {
              const perf = calculatePerformance(portfolioData.map(d => ({ price: d.value })));
              if (perf !== null) {
                const perfNum = parseFloat(perf);
                const perfAmount = portfolioData[portfolioData.length - 1].value - portfolioData[0].value;
                return (
                  <span style={{ float: 'right', textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b' }}>{perfNum >= 0 ? '+' : ''}{perf}%</div>
                    <div style={{ fontSize: '0.85rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b', marginTop: '2px' }}>{perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</div>
                  </span>
                );
              }
              return null;
            })()}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis dataKey={isIntradayPeriod ? "datetime" : "date"} stroke="#9fa3a8" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
              <YAxis stroke="#9fa3a8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #61dafb', borderRadius: '4px' }} formatter={(value) => [`${value.toLocaleString('fr-FR')} USD`, 'Valeur']} />
              <Line type="monotone" dataKey="value" stroke="#61dafb" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stocks.map(stock => {
        const chartData = chartsData[stock.symbol];
        if (!chartData || chartData.error || !chartData.data.length) {
          return <div key={stock.symbol} className="chart-section"><h2>{stock.name} ({stock.symbol})</h2><p className="error">Données non disponibles</p></div>;
        }
        return (
          <div key={stock.symbol} className="chart-section">
            <h2>
              {stock.name} (<a href={`https://finance.yahoo.com/quote/${stock.symbol}`} target="_blank" rel="noopener noreferrer" className="etf-chart-link">{stock.symbol}</a>)
              {(() => {
                const perf = calculatePerformance(chartData.data);
                if (perf !== null) {
                  const perfNum = parseFloat(perf);
                  const perfAmount = (chartData.data[chartData.data.length - 1].price - chartData.data[0].price) * stock.units;
                  return (
                    <span style={{ float: 'right', textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b' }}>{perfNum >= 0 ? '+' : ''}{perf}%</div>
                      <div style={{ fontSize: '0.85rem', color: perfNum >= 0 ? '#4caf50' : '#ff6b6b', marginTop: '2px' }}>{perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</div>
                    </span>
                  );
                }
                return null;
              })()}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
                <XAxis dataKey={isIntradayPeriod ? "datetime" : "date"} stroke="#9fa3a8" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis stroke="#9fa3a8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1e2228', border: '1px solid #61dafb', borderRadius: '4px' }} itemStyle={{ color: stock.color }} />
                <Line type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} dot={false} name="Prix (USD)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

export default Graphiques_Met;
