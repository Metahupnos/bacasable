import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import './GraphiquesETF.css';

function GraphiquesFiducenter5050() {
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('1y');
  const [selectedView, setSelectedView] = useState('performance');

  // Top 10 positions actions pour les graphiques
  const topStocks = [
    { symbol: 'GOOGL', name: 'Alphabet', color: '#4285f4', units: 510 },
    { symbol: 'EXV1.DE', name: 'iShares STOXX Europe 600 Banks', color: '#003087', units: 10000 },
    { symbol: 'META', name: 'Meta Platforms', color: '#0866ff', units: 220 },
    { symbol: 'NN.AS', name: 'NN Group', color: '#ff6600', units: 1900 },
    { symbol: 'CHG.L', name: 'Chemring Group', color: '#1e4d8c', units: 20000 },
    { symbol: 'ASML.AS', name: 'ASML', color: '#00a3e0', units: 100 },
    { symbol: 'MSFT', name: 'Microsoft', color: '#00bcf2', units: 150 },
  ];

  // Performance historique
  const performanceData = [
    { year: '2023', value: 6159371, perf: 2.54 },
    { year: '2024', value: 8648995, perf: 10.70 },
    { year: '2025', value: 9259416, perf: 8.16 },
  ];

  // Performance mensuelle 2025
  const monthlyPerf2025 = [
    { month: 'Jan', perf: 2.14, cumul: 2.14 },
    { month: 'Fév', perf: 0.19, cumul: 2.33 },
    { month: 'Mar', perf: -3.86, cumul: -1.62 },
    { month: 'Avr', perf: -1.78, cumul: -3.37 },
    { month: 'Mai', perf: 4.20, cumul: 0.68 },
    { month: 'Jun', perf: 1.10, cumul: 1.79 },
    { month: 'Jul', perf: 1.44, cumul: 3.25 },
    { month: 'Aoû', perf: 0.08, cumul: 3.34 },
    { month: 'Sep', perf: 2.10, cumul: 5.50 },
    { month: 'Oct', perf: 1.88, cumul: 7.49 },
    { month: 'Nov', perf: -0.22, cumul: 7.25 },
    { month: 'Déc', perf: 0.85, cumul: 8.16 },
  ];

  // Allocation par classe d'actifs
  const allocationData = [
    { name: 'Actions', value: 4797317, color: '#61dafb' },
    { name: 'Obligations', value: 3827406, color: '#4caf50' },
    { name: 'Liquidités', value: 524054, color: '#9c27b0' },
    { name: 'Autres', value: 110640, color: '#ff9800' },
  ];

  // Performance par secteur 2025
  const sectorPerf = [
    { sector: 'Divers, autres', perf: 72.27 },
    { sector: 'Finance', perf: 56.06 },
    { sector: 'Industrie', perf: 25.51 },
    { sector: 'Matériaux', perf: 22.65 },
    { sector: 'Communication', perf: 15.95 },
    { sector: 'Conso. Discr.', perf: 10.27 },
    { sector: 'Immobilier', perf: -9.85 },
    { sector: 'Santé', perf: -16.41 },
  ];

  // Répartition géographique
  const geoData = [
    { name: 'USA', value: 19, color: '#3c3b6e' },
    { name: 'Div. Europe', value: 10, color: '#003399' },
    { name: 'France', value: 7, color: '#0055a4' },
    { name: 'Irlande', value: 5, color: '#169b62' },
    { name: 'Allemagne', value: 5, color: '#000000' },
    { name: 'Suisse', value: 3, color: '#ff0000' },
    { name: 'Pays-Bas', value: 5, color: '#ff6600' },
    { name: 'Autres', value: 46, color: '#888888' },
  ];

  const periods = [
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '2y', label: '2Y' },
  ];

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const promises = topStocks.map(async (stock) => {
        try {
          const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
          const url = `${apiBase}/api/history/${stock.symbol}/${selectedPeriod}`;
          const response = await axios.get(url);

          const result = response.data.chart.result[0];
          const timestamps = result.timestamp;
          const prices = result.indicators.quote[0].close;

          const data = timestamps.map((timestamp, index) => {
            const date = new Date(timestamp * 1000);
            return {
              date: date.toLocaleDateString('fr-FR'),
              price: prices[index] ? parseFloat(prices[index].toFixed(2)) : null
            };
          }).filter(d => d.price !== null);

          return { symbol: stock.symbol, data };
        } catch (err) {
          console.error(`Erreur ${stock.symbol}:`, err);
          return { symbol: stock.symbol, data: [] };
        }
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(r => {
        dataMap[r.symbol] = r.data;
      });
      setChartsData(dataMap);
      setError(null);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const COLORS = ['#61dafb', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#8bc34a', '#e91e63'];

  return (
    <div className="charts-container">
      <div className="charts-header">
        <div className="nav-buttons">
          <button onClick={() => navigate('/fiducenter5050')} className="nav-button">Portfolio</button>
          <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        </div>
        <h1>Graphiques Fiducenter 50/50</h1>
      </div>

      {/* Tabs pour les vues */}
      <div className="period-selector" style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setSelectedView('performance')}
          className={selectedView === 'performance' ? 'active' : ''}
        >
          Performance
        </button>
        <button
          onClick={() => setSelectedView('allocation')}
          className={selectedView === 'allocation' ? 'active' : ''}
        >
          Allocation
        </button>
        <button
          onClick={() => setSelectedView('sectors')}
          className={selectedView === 'sectors' ? 'active' : ''}
        >
          Secteurs
        </button>
        <button
          onClick={() => setSelectedView('stocks')}
          className={selectedView === 'stocks' ? 'active' : ''}
        >
          Actions
        </button>
      </div>

      {/* Vue Performance */}
      {selectedView === 'performance' && (
        <>
          {/* Performance annuelle */}
          <div className="chart-section">
            <h2>Performance Annuelle</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="year" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                  formatter={(value, name) => [
                    name === 'perf' ? `${value.toFixed(2)}%` : `${formatNumber(value)} EUR`,
                    name === 'perf' ? 'Performance' : 'Valeur'
                  ]}
                />
                <Bar dataKey="perf" fill="#61dafb" name="Performance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance mensuelle 2025 */}
          <div className="chart-section">
            <h2>Performance Mensuelle 2025</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyPerf2025}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                  formatter={(value) => [`${value.toFixed(2)}%`]}
                />
                <Legend />
                <Line type="monotone" dataKey="perf" stroke="#ff9800" name="Mensuel" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="cumul" stroke="#4caf50" name="Cumulé" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Évolution de la valeur */}
          <div className="chart-section">
            <h2>Évolution de la Valeur du Portefeuille</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="year" stroke="#888" />
                <YAxis stroke="#888" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                  formatter={(value) => [`${formatNumber(value)} EUR`, 'Valeur']}
                />
                <Line type="monotone" dataKey="value" stroke="#61dafb" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Vue Allocation */}
      {selectedView === 'allocation' && (
        <>
          <div className="chart-section">
            <h2>Répartition par Classe d'Actifs</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${formatNumber(value)} EUR`]}
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-section">
            <h2>Répartition Géographique (Actions)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={geoData}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {geoData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`]}
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Vue Secteurs */}
      {selectedView === 'sectors' && (
        <div className="chart-section">
          <h2>Performance 2025 par Secteur</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sectorPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis type="number" stroke="#888" tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="sector" stroke="#888" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                formatter={(value) => [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, 'Performance']}
              />
              <Bar dataKey="perf" fill="#4caf50">
                {sectorPerf.map((entry, index) => (
                  <Cell key={index} fill={entry.perf >= 0 ? COLORS[index % COLORS.length] : '#f44336'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vue Actions */}
      {selectedView === 'stocks' && (
        <>
          <div className="period-selector">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className={selectedPeriod === p.value ? 'active' : ''}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading && <p style={{ textAlign: 'center' }}>Chargement...</p>}
          {error && <p style={{ color: '#f44336', textAlign: 'center' }}>{error}</p>}

          {!loading && topStocks.map(stock => (
            chartsData[stock.symbol] && chartsData[stock.symbol].length > 0 && (
              <div key={stock.symbol} className="chart-section">
                <h2 style={{ color: stock.color }}>{stock.name} ({stock.symbol})</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartsData[stock.symbol]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#888" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={stock.color}
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          ))}
        </>
      )}
    </div>
  );
}

export default GraphiquesFiducenter5050;
