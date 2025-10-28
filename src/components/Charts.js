import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Charts.css';

function Charts() {
  const [chartsData, setChartsData] = useState({});
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('2y');

  const etfs = [
    { symbol: 'CSPX.AS', name: 'iShares Core S&P 500', color: '#4caf50', units: 354 },
    { symbol: 'IWDA.AS', name: 'iShares Core MSCI World', color: '#2196f3', units: 1424 },
    { symbol: 'EMIM.AS', name: 'iShares Core MSCI EM', color: '#ff9800', units: 2567 },
    { symbol: 'SC0J.DE', name: 'Invesco MSCI World Small Cap', color: '#9c27b0', units: 796 },
    { symbol: 'EQEU.DE', name: 'Invesco Nasdaq-100 Acc', color: '#f44336', units: 144 }
  ];

  const periods = [
    { value: '1d', label: '1J' },
    { value: '5d', label: '5J' },
    { value: '1m', label: '1M' },
    { value: '2m', label: '2M' },
    { value: '3m', label: '3M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' },
    { value: 'creation', label: 'Création' }
  ];

  // Déterminer si on est en période intraday (afficher l'heure)
  const isIntradayPeriod = ['1d', '5d'].includes(selectedPeriod);

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fillMissingValues = (data) => {
    // Combler les valeurs manquantes avec la dernière valeur connue
    let lastValidPrice = null;

    return data.map(item => {
      if (item.price !== null && item.price !== undefined) {
        lastValidPrice = item.price;
        return item;
      } else if (lastValidPrice !== null) {
        // Utiliser la dernière valeur connue
        return {
          ...item,
          price: lastValidPrice,
          // Recalculer la date et l'heure pour ce timestamp
          date: new Date(item.timestamp * 1000).toLocaleDateString('fr-FR'),
          time: new Date(item.timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return item;
    }).filter(item => item.price !== null);
  };

  // Calculer la performance sur la période
  const calculatePerformance = (data) => {
    if (!data || data.length < 2) return null;
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    if (!firstPrice || !lastPrice) return null;
    return ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2);
  };

  // Extraire seulement la valeur de clôture (dernier point) de chaque jour
  const extractDailyClose = (intradayData) => {
    const dailyClose = [];
    const dataByDate = {};

    // Grouper par date
    intradayData.forEach(item => {
      if (!dataByDate[item.date]) {
        dataByDate[item.date] = [];
      }
      dataByDate[item.date].push(item);
    });

    // Pour chaque date, prendre le dernier point (clôture)
    Object.keys(dataByDate).sort((a, b) => {
      // Trier les dates chronologiquement
      const dateA = dataByDate[a][0].timestamp;
      const dateB = dataByDate[b][0].timestamp;
      return dateA - dateB;
    }).forEach(date => {
      const dayData = dataByDate[date];
      // Prendre le dernier point de la journée (clôture)
      const closePoint = dayData[dayData.length - 1];
      dailyClose.push(closePoint);
    });

    return dailyClose;
  };

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const promises = etfs.map(async (etf) => {
        try {
          let combinedData;

          // Pour les périodes courtes intraday (1d, 5d), utiliser SEULEMENT les données de la période
          if (['1d', '5d'].includes(selectedPeriod)) {
            const url = `http://localhost:4001/api/history/${etf.symbol}/${selectedPeriod}`;
            console.log(`Fetching intraday data for ${etf.symbol} (${selectedPeriod})`);
            const response = await axios.get(url);

            const result = response.data.chart.result[0];
            const timestamps = result.timestamp;
            const prices = result.indicators.quote[0].close;

            combinedData = timestamps.map((timestamp, index) => ({
              timestamp: timestamp,
              date: new Date(timestamp * 1000).toLocaleDateString('fr-FR'),
              time: new Date(timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              price: prices[index] ? parseFloat(prices[index].toFixed(2)) : null
            })).filter(item => item.price !== null);

          } else {
            // Pour les périodes plus longues, utiliser l'approche hybride
            // 1. Récupérer les données quotidiennes
            const urlDaily = `http://localhost:4001/api/history/${etf.symbol}/${selectedPeriod}`;
            console.log(`Fetching daily data for ${etf.symbol} (${selectedPeriod})`);
            const responseDaily = await axios.get(urlDaily);

            const resultDaily = responseDaily.data.chart.result[0];
            const timestampsDaily = resultDaily.timestamp;
            const pricesDaily = resultDaily.indicators.quote[0].close;

            // Calculer la date il y a 5 jours
            const fiveDaysAgo = new Date();
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            fiveDaysAgo.setHours(0, 0, 0, 0);

            // Filtrer les données quotidiennes pour garder seulement celles avant il y a 5 jours
            const dailyData = timestampsDaily
              .map((timestamp, index) => ({
                timestamp: timestamp,
                date: new Date(timestamp * 1000).toLocaleDateString('fr-FR'),
                time: new Date(timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                price: pricesDaily[index] ? parseFloat(pricesDaily[index].toFixed(2)) : null
              }))
              .filter(item => item.price !== null && new Date(item.timestamp * 1000) < fiveDaysAgo);

            // 2. Récupérer les données détaillées sur 5 jours
            const url5d = `http://localhost:4001/api/history/${etf.symbol}/5d`;
            console.log(`Fetching detailed 5d data for ${etf.symbol}`);
            const response5d = await axios.get(url5d);

            const result5d = response5d.data.chart.result[0];
            const timestamps5d = result5d.timestamp;
            const prices5d = result5d.indicators.quote[0].close;

            const detailedData = timestamps5d.map((timestamp, index) => ({
              timestamp: timestamp,
              date: new Date(timestamp * 1000).toLocaleDateString('fr-FR'),
              time: new Date(timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              price: prices5d[index] ? parseFloat(prices5d[index].toFixed(2)) : null
            })).filter(item => item.price !== null);

            // 3. Extraire seulement les clôtures quotidiennes des 5 derniers jours
            const detailedDataDailyClose = extractDailyClose(detailedData);

            // 4. Combiner les deux ensembles de données - GARDER LE TIMESTAMP!
            combinedData = [...dailyData, ...detailedDataDailyClose]
              .sort((a, b) => a.timestamp - b.timestamp);
          }

          // 5. Combler les valeurs manquantes
          const filledData = fillMissingValues(combinedData);

          console.log(`${etf.symbol}: Combined=${combinedData.length}, Filled=${filledData.length}`);

          return {
            symbol: etf.symbol,
            name: etf.name,
            color: etf.color,
            data: filledData
          };
        } catch (err) {
          console.error(`Erreur pour ${etf.symbol}:`, err);
          return {
            symbol: etf.symbol,
            name: etf.name,
            color: etf.color,
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

      // Calculer la valeur totale du portefeuille pour chaque date
      calculatePortfolioTotal(results);

      setError(null);
    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Impossible de charger les données historiques');
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioTotal = (results) => {
    // Collecter tous les timestamps uniques de tous les ETF
    const allTimestamps = new Set();
    results.forEach(result => {
      result.data.forEach(item => {
        allTimestamps.add(item.timestamp);
      });
    });

    // Convertir en array et trier
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Créer un map des dernières valeurs connues pour chaque ETF
    const lastKnownPrices = {};
    etfs.forEach(etf => {
      lastKnownPrices[etf.symbol] = null;
    });

    // Pour chaque timestamp, calculer la valeur totale du portefeuille
    const portfolioValues = sortedTimestamps.map(timestamp => {
      let totalValue = 0;
      let allEtfsHaveValue = true;

      results.forEach(result => {
        const etfData = etfs.find(e => e.symbol === result.symbol);
        if (!etfData) return;

        // Trouver le prix pour ce timestamp exact
        const priceData = result.data.find(item => item.timestamp === timestamp);

        if (priceData && priceData.price) {
          // Mettre à jour la dernière valeur connue
          lastKnownPrices[result.symbol] = priceData.price;
          totalValue += priceData.price * etfData.units;
        } else if (lastKnownPrices[result.symbol] !== null) {
          // Utiliser la dernière valeur connue (forward-fill)
          totalValue += lastKnownPrices[result.symbol] * etfData.units;
        } else {
          // Aucune valeur disponible pour cet ETF
          allEtfsHaveValue = false;
        }
      });

      // Ne garder que les timestamps où tous les ETF ont une valeur (réelle ou forward-filled)
      if (allEtfsHaveValue && totalValue > 0) {
        return {
          date: new Date(timestamp * 1000).toLocaleDateString('fr-FR'),
          time: new Date(timestamp * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          value: parseFloat(totalValue.toFixed(2))
        };
      }
      return null;
    }).filter(item => item !== null);

    console.log(`Portfolio total: ${portfolioValues.length} points calculés (sur ${sortedTimestamps.length} timestamps)`);
    setPortfolioData(portfolioValues);
  };

  if (loading) {
    return (
      <div className="charts-container">
        <h1>Graphiques des ETF</h1>
        <p>Chargement des données historiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="charts-container">
        <h1>Graphiques des ETF</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="charts-container">
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
        <button onClick={() => window.location.href = '/'} className="back-button">
          Retour au portfolio
        </button>
      </div>

      {/* Graphique du portefeuille total */}
      {portfolioData.length > 0 && (
        <div className="chart-section portfolio-total-section">
          <h2>
            Portfolio
            {(() => {
              const perf = calculatePerformance(portfolioData.map(d => ({ price: d.value })));
              if (perf !== null && portfolioData.length > 0) {
                const perfNum = parseFloat(perf);
                const firstValue = portfolioData[0].value;
                const lastValue = portfolioData[portfolioData.length - 1].value;
                const perfAmount = lastValue - firstValue;
                return (
                  <span style={{
                    float: 'right',
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: '1rem',
                      color: perfNum >= 0 ? '#4caf50' : '#ff6b6b'
                    }}>
                      {perfNum >= 0 ? '+' : ''}{perf}%
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: perfNum >= 0 ? '#4caf50' : '#ff6b6b',
                      marginTop: '2px'
                    }}>
                      {perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                    </div>
                  </span>
                );
              }
              return null;
            })()}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
              <XAxis
                dataKey="date"
                stroke="#9fa3a8"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => {
                  if (index % Math.floor(portfolioData.length / 6) === 0) {
                    return value;
                  }
                  return '';
                }}
              />
              <YAxis
                stroke="#9fa3a8"
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e2228',
                  border: '1px solid #61dafb',
                  borderRadius: '4px'
                }}
                labelStyle={{ color: '#61dafb' }}
                itemStyle={{ color: '#61dafb' }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const date = payload[0].payload.date;
                    const time = payload[0].payload.time;
                    return isIntradayPeriod ? `${date} ${time}` : date;
                  }
                  return label;
                }}
                formatter={(value) => [`${value.toLocaleString('fr-FR')} EUR`, 'Valeur']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#61dafb"
                strokeWidth={3}
                dot={false}
                name="Valeur du portefeuille (EUR)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Graphiques individuels des ETF */}
      {etfs.map((etf) => {
        const chartData = chartsData[etf.symbol];

        if (!chartData || chartData.error || chartData.data.length === 0) {
          return (
            <div key={etf.symbol} className="chart-section">
              <h2>{etf.name} ({etf.symbol})</h2>
              <p className="error">Données non disponibles</p>
            </div>
          );
        }

        return (
          <div key={etf.symbol} className="chart-section">
            <h2>
              {etf.name} (
              <a
                href={`https://finance.yahoo.com/quote/${etf.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="etf-chart-link"
              >
                {etf.symbol}
              </a>
              )
              {(() => {
                const perf = calculatePerformance(chartData.data);
                if (perf !== null && chartData.data.length > 0) {
                  const perfNum = parseFloat(perf);
                  const firstPrice = chartData.data[0].price;
                  const lastPrice = chartData.data[chartData.data.length - 1].price;
                  const priceChange = lastPrice - firstPrice;
                  const perfAmount = priceChange * etf.units;
                  return (
                    <span style={{
                      float: 'right',
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '1rem',
                        color: perfNum >= 0 ? '#4caf50' : '#ff6b6b'
                      }}>
                        {perfNum >= 0 ? '+' : ''}{perf}%
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: perfNum >= 0 ? '#4caf50' : '#ff6b6b',
                        marginTop: '2px'
                      }}>
                        {perfNum >= 0 ? '+' : ''}{perfAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                      </div>
                    </span>
                  );
                }
                return null;
              })()}
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3f47" />
                <XAxis
                  dataKey="date"
                  stroke="#9fa3a8"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value, index) => {
                    // Afficher seulement quelques dates pour éviter l'encombrement
                    if (index % Math.floor(chartData.data.length / 6) === 0) {
                      return value;
                    }
                    return '';
                  }}
                />
                <YAxis
                  stroke="#9fa3a8"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2228',
                    border: '1px solid #61dafb',
                    borderRadius: '4px'
                  }}
                  labelStyle={{ color: '#61dafb' }}
                  itemStyle={{ color: etf.color }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const date = payload[0].payload.date;
                      const time = payload[0].payload.time;
                      return isIntradayPeriod ? `${date} ${time}` : date;
                    }
                    return label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={etf.color}
                  strokeWidth={2}
                  dot={false}
                  name="Prix (EUR)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

export default Charts;
