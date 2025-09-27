import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function StockChart({ symbol, etfName, mode = 'Depuis le début', purchasePrice, etfDescription, etfQuantity }) {
  // Récupérer la période selon le mode
  const getGlobalPeriod = () => {
    if (mode === 'Depuis le début') {
      return '1m'; // Toujours 1m pour "Depuis le début"
    } else if (mode === 'Aujourd\'hui') {
      return '1d'; // Utiliser 1d comme le portefeuille pour synchroniser
    }
    try {
      return localStorage.getItem('etf-chart-period') || '1m';
    } catch {
      return '1m';
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState(getGlobalPeriod());
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [periodPerformance, setPeriodPerformance] = useState(null);

  // Fonction pour changer la période et la sauvegarder globalement
  const handlePeriodChange = (newPeriod) => {
    // Permettre le changement partout pour débugger
    // if (mode === 'Depuis le début' || mode === 'Aujourd\'hui') return;

    setSelectedPeriod(newPeriod);
    try {
      localStorage.setItem('etf-chart-period', newPeriod);
      // Déclencher un événement custom pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('etf-period-changed', { detail: newPeriod }));
    } catch (e) {
      console.warn('Impossible de sauvegarder la période:', e);
    }
  };

  // Écouter les changements de période depuis d'autres composants
  useEffect(() => {
    const handleGlobalPeriodChange = (event) => {
      // Écouter partout pour débugger
      setSelectedPeriod(event.detail);
    };

    window.addEventListener('etf-period-changed', handleGlobalPeriodChange);
    return () => window.removeEventListener('etf-period-changed', handleGlobalPeriodChange);
  }, [mode]);

  const periods = [
    { key: '1d', label: '1J' },
    { key: '5d', label: '5J' },
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1A' },
    { key: '5y', label: '5A' },
    { key: '10y', label: '10A' },
    { key: 'inception', label: 'Depuis création' }
  ];

  const fetchHistoricalData = useCallback(async (period) => {
    setLoading(true);
    setError(null);

    try {
      // Pour "inception", utiliser la période 1m mais on filtrera les données côté client
      // Pour "10y", utiliser directement "10y" comme Yahoo Finance le supporte
      let apiPeriod;
      if (period === 'inception') {
        apiPeriod = '1m';
      } else if (period === '10y') {
        apiPeriod = '10y'; // Yahoo Finance supporte directement 10y
      } else {
        apiPeriod = period;
      }

      // Utiliser Netlify Function en production ou proxy local en développement
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
      const apiPath = process.env.NODE_ENV === 'production' ? `/.netlify/functions/history/${symbol}/${apiPeriod}` : `/api/history/${symbol}/${apiPeriod}`;
      const response = await fetch(`${baseUrl}${apiPath}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }

      const data = await response.json();

      // Traitement des données Yahoo Finance
      const result = data.chart?.result?.[0];
      if (!result) {
        throw new Error('Données invalides');
      }

      const timestamps = result.timestamp || [];
      const prices = result.indicators?.quote?.[0]?.close || [];

      // Filtrer les valeurs null et formater les données
      let validData = timestamps
        .map((timestamp, index) => ({
          timestamp: timestamp * 1000, // Convertir en millisecondes
          price: prices[index]
        }))
        .filter(item => item.price !== null && item.price !== undefined);

      // Pour "inception", filtrer depuis le 29 août 2025
      if (period === 'inception') {
        const inceptionDate = new Date('2025-08-29').getTime();
        validData = validData.filter(item => item.timestamp >= inceptionDate);
      }

      // Pour "10y", filtrer pour garder seulement les 10 dernières années
      if (period === '10y') {
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        const tenYearsAgoTime = tenYearsAgo.getTime();
        validData = validData.filter(item => item.timestamp >= tenYearsAgoTime);
      }

      // Créer les données pour Chart.js
      const labels = validData.map(item => {
        const date = new Date(item.timestamp);
        // En mode "Aujourd'hui", toujours utiliser le format heure/minute
        if (mode === 'Aujourd\'hui' || period === '1d') {
          return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (['5d', '1m', 'inception'].includes(period)) {
          return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        } else {
          return date.toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' });
        }
      });

      const priceData = validData.map(item => item.price);

      // Prix d'achat supprimé pour débugger

      // Utiliser les prix absolus directement
      const firstPrice = priceData[0];

      // Calculer la performance de la période
      const lastPrice = priceData[priceData.length - 1];
      const performanceValue = lastPrice - firstPrice;
      const performancePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      const isPositive = lastPrice >= firstPrice;
      const color = isPositive ? '#20B8E0' : '#008EB7';

      // Mettre à jour les données de performance
      setPeriodPerformance({
        value: performanceValue,
        percent: performancePercent,
        isPositive: isPositive,
        firstPrice: firstPrice,
        lastPrice: lastPrice,
        period: period
      });

      setChartData({
        labels,
        datasets: [
          {
            label: `${etfName} (EUR)`,
            data: priceData,
            borderColor: color,
            backgroundColor: color + '20',
            fill: true,
            tension: 0.4,
            pointRadius: period === '1d' ? 2 : 0, // Afficher les points pour 1d
            pointHoverRadius: 4,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            borderWidth: 2
          }
        ]
      });
    } catch (err) {
      setError(err.message);
      console.error('Erreur graphique:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, etfName, mode, purchasePrice, etfDescription, etfQuantity]);

  useEffect(() => {
    if (symbol) {
      fetchHistoricalData(selectedPeriod);
    }
  }, [symbol, selectedPeriod, fetchHistoricalData, mode]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: '#ddd',
        borderWidth: 1,
        displayColors: false,
        titleFont: {
          weight: 'normal'
        },
        bodyFont: {
          weight: 'normal'
        },
        bodySpacing: 4,
        callbacks: {
          title: function(context) {
            const currentPrice = context[0].parsed.y;
            const prixText = `${currentPrice.toFixed(2)} EUR`;
            return prixText;
          },
          label: function(context) {
            // Date en dessous
            const label = context.label; // Format du graphique
            let dateValue;

            // Gérer les différents formats de date selon la période
            if (label.includes(':')) {
              // Format heure pour 1d
              const currentDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              dateValue = `${currentDate} ${label}`;
            } else if (label.includes('/') && label.length <= 5) {
              // Format dd/mm pour 5d, 1m
              const currentYear = new Date().getFullYear();
              dateValue = `${label}/${currentYear}`;
            } else {
              // Format mm/yy pour périodes plus longues
              dateValue = label;
            }

            // Performance supprimée pour débugger
            const currentPrice = context.parsed.y;
            let performanceText = '';

            const result = [dateValue];
            if (performanceText) {
              result.push(performanceText);
            }

            return result;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 6,
          color: '#666'
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value.toFixed(2) + ' EUR';
          },
          color: '#666'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="stock-chart">
      {/* Sélecteurs de période masqués - seul le portefeuille gère la synchronisation */}
      {false && (
        <div className="period-selector">
          {periods.map(period => (
            <button
              key={period.key}
              className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
              onClick={() => handlePeriodChange(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>
      )}

      {/* Indicateur de performance masqué - redondant avec descriptif ETF */}
      {false && (
        <div className="period-performance" style={{
          padding: '10px 12px',
          marginBottom: '8px',
          backgroundColor: periodPerformance.isPositive ? '#e6f7ff' : '#e6f3ff',
          borderRadius: '6px',
          border: `1px solid ${periodPerformance.isPositive ? '#20B8E0' : '#008EB7'}`,
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ color: '#666', fontWeight: 'bold', fontSize: '14px' }}>
              {etfName}
            </span>
            <span style={{
              fontWeight: 'bold',
              color: periodPerformance.isPositive ? '#20B8E0' : '#008EB7'
            }}>
              {periodPerformance.isPositive ? '+' : ''}{periodPerformance.value.toFixed(2)} EUR ({periodPerformance.isPositive ? '+' : ''}{periodPerformance.percent.toFixed(2)}%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ color: '#888', fontSize: '11px' }}>
              {etfDescription} Acheté à {purchasePrice ? purchasePrice.toFixed(2) : 'N/A'} EUR
            </span>
            <span style={{ color: '#888', fontSize: '11px' }}>
              {periodPerformance.firstPrice.toFixed(2)} → {periodPerformance.lastPrice.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666', fontSize: '11px', fontWeight: '500' }}>
              {etfQuantity ? etfQuantity.toLocaleString('fr-FR') : 'N/A'} unités
            </span>
            <span style={{ color: '#666', fontSize: '11px', fontWeight: '500' }}>
              Investi: {periodPerformance.lastPrice && etfQuantity ? (periodPerformance.lastPrice * etfQuantity).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : 'N/A'} EUR
            </span>
          </div>
        </div>
      )}

      {/* Performance au-dessus du graphique - design identique au portefeuille */}
      {periodPerformance && (
        <div style={{
          marginBottom: '15px',
          fontSize: '11px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Évolution {periods.find(p => p.key === periodPerformance.period)?.label || periodPerformance.period}</span>
          <div style={{
            background: periodPerformance.isPositive ? '#d4edda' : '#f8d7da',
            color: periodPerformance.isPositive ? '#155724' : '#721c24',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {periodPerformance.isPositive ? '+' : ''}{periodPerformance.percent.toFixed(2)}%
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="chart-container">
        {loading && (
          <div className="chart-loading">
            <div className="loading-spinner">📈</div>
            <p>Chargement du graphique...</p>
          </div>
        )}

        {error && (
          <div className="chart-error">
            <p>❌ {error}</p>
          </div>
        )}

        {chartData && !loading && !error && (
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default StockChart;