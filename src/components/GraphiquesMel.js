import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './GraphiquesETF.css';

function GraphiquesMel() {
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState({});
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1m');

  // Mis à jour 21/12/2025 - Rapport Bolero (avec dates et prix d'achat)
  const stocks = [
    { symbol: 'LLY', name: 'Eli Lilly and Co.', color: '#4caf50', units: 146, buyPrice: 1031.28, buyDate: '2025-11-17' },
    { symbol: 'GOOG', name: 'Alphabet Inc. (Class A)', color: '#2196f3', units: 135, buyPrice: 322.34, buyDate: '2025-11-20' },
    { symbol: 'IDXX', name: 'Idexx Laboratories', color: '#f44336', units: 42, buyPrice: 770.06, buyDate: '2025-11-25' }
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

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const promises = stocks.map(async (stock) => {
        try {
          const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
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

  const calculatePortfolioTotal = (results) => {
    const allTimestamps = new Set();
    results.forEach(result => {
      result.data.forEach(item => {
        allTimestamps.add(item.timestamp);
      });
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
    const lastKnownPrices = {};
    stocks.forEach(stock => {
      lastKnownPrices[stock.symbol] = null;
    });

    const portfolioValues = sortedTimestamps.map(timestamp => {
      let totalValue = 0;
      let allStocksHaveValue = true;

      results.forEach(result => {
        const stockData = stocks.find(s => s.symbol === result.symbol);
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
  };

  // Calcul des performances combinées (normalisées en % depuis date d'achat)
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

    const buyDatesStr = {};
    stocks.forEach(stock => {
      const [year, month, day] = stock.buyDate.split('-');
      buyDatesStr[stock.symbol] = `${day}/${month}/${year}`;
    });

    const lastKnownPrices = {};
    const hasStarted = {};
    stocks.forEach(stock => {
      lastKnownPrices[stock.symbol] = null;
      hasStarted[stock.symbol] = false;
    });

    const combined = sortedDates.map(dateStr => {
      const dataPoint = { date: dateStr };

      stocks.forEach(stock => {
        if (pricesByDate[stock.symbol][dateStr]) {
          lastKnownPrices[stock.symbol] = pricesByDate[stock.symbol][dateStr];
        }

        const [day, month, year] = dateStr.split('/');
        const [buyDay, buyMonth, buyYear] = buyDatesStr[stock.symbol].split('/');
        const currentDate = new Date(year, month - 1, day);
        const buyDate = new Date(buyYear, buyMonth - 1, buyDay);

        if (currentDate >= buyDate) {
          hasStarted[stock.symbol] = true;
        }

        const currentPrice = lastKnownPrices[stock.symbol];
        const buyPrice = stock.buyPrice;

        if (currentPrice && buyPrice && hasStarted[stock.symbol]) {
          const perf = parseFloat(((currentPrice - buyPrice) / buyPrice * 100).toFixed(2));
          dataPoint[stock.symbol] = perf;
        }
      });

      return dataPoint;
    }).filter(item => stocks.some(stock => item[stock.symbol] !== undefined));

    setCombinedData(combined);
  };

  if (loading) {
    return (
      <div className="charts-container">
        <h1>Graphiques Portfolio Mel</h1>
        <p>Chargement des données historiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <h1>Graphiques Portfolio Mel</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="charts-container">
      <div className="nav-buttons">
        <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        <button onClick={() => navigate('/mel')} className="nav-button">Portfolio</button>
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
            Portfolio Mel (USD)
            {(() => {
              const totalBuyValue = stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.units), 0);
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

      {/* Graphique combiné - Toutes les actions en % depuis achat */}
      {combinedData.length > 0 && (
        <div className="chart-section portfolio-total-section">
          <h2>Performance depuis achat (%)</h2>
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
                            fill={stock.color}
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
              <a href={`https://finance.yahoo.com/quote/${stock.symbol}/analysis/`} target="_blank" rel="noopener noreferrer" className="etf-chart-link">
                {stock.symbol}
              </a>
              )
            </h2>
            {(() => {
              const lastPrice = chartData.data[chartData.data.length - 1]?.price;
              const totalPerf = lastPrice ? ((lastPrice - stock.buyPrice) / stock.buyPrice * 100).toFixed(2) : null;
              const perfAmount = lastPrice ? (lastPrice - stock.buyPrice) * stock.units : null;
              return (
                <div style={{ fontSize: '0.75rem', color: '#9fa3a8', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Achat: {stock.buyDate.split('-').reverse().join('/')} @ {stock.buyPrice.toLocaleString('fr-FR')} USD</span>
                  {totalPerf && (
                    <span style={{ color: parseFloat(totalPerf) >= 0 ? '#4caf50' : '#f44336', fontWeight: 'bold', textAlign: 'right' }}>
                      <div>Rendement depuis achat: {parseFloat(totalPerf) >= 0 ? '+' : ''}{totalPerf}%</div>
                      <div style={{ fontSize: '0.7rem' }}>{perfAmount >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
                    </span>
                  )}
                </div>
              );
            })()}
            {(() => {
              const [year, month, day] = stock.buyDate.split('-');
              const buyDateStr = `${day}/${month}/${year}`;
              const dataWithBuyPoint = chartData.data.map(item => ({
                ...item,
                buyPrice: item.date === buyDateStr ? stock.buyPrice : null
              }));
              return (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dataWithBuyPoint}>
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
                          return [`${value.toLocaleString('fr-FR')} USD`, 'Prix achat'];
                        }
                        return [`${value?.toLocaleString('fr-FR')} USD`, 'Prix'];
                      }}
                    />
                    <Line type="monotone" dataKey="price" stroke={stock.color} strokeWidth={2} dot={false} name="Prix" />
                    <Line
                      type="monotone"
                      dataKey="buyPrice"
                      stroke="#ffffff"
                      strokeWidth={0}
                      dot={{ r: 6, fill: '#ffeb3b', stroke: '#ffffff', strokeWidth: 2 }}
                      name="buyPrice"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

export default GraphiquesMel;
