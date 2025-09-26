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

function StockChart({ symbol, etfName }) {
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const periods = [
    { key: '1d', label: '1J' },
    { key: '5d', label: '5J' },
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1A' },
    { key: '5y', label: '5A' }
  ];

  const fetchHistoricalData = useCallback(async (period) => {
    setLoading(true);
    setError(null);

    try {
      // Utiliser Netlify Function en production ou proxy local en développement
      const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
      const apiPath = process.env.NODE_ENV === 'production' ? `/.netlify/functions/history/${symbol}/${period}` : `/api/history/${symbol}/${period}`;
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
      const validData = timestamps
        .map((timestamp, index) => ({
          timestamp: timestamp * 1000, // Convertir en millisecondes
          price: prices[index]
        }))
        .filter(item => item.price !== null && item.price !== undefined);

      // Créer les données pour Chart.js
      const labels = validData.map(item => {
        const date = new Date(item.timestamp);
        if (period === '1d') {
          return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else if (['5d', '1m'].includes(period)) {
          return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        } else {
          return date.toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' });
        }
      });

      const priceData = validData.map(item => item.price);

      // Utiliser les prix absolus directement
      const firstPrice = priceData[0];

      // Déterminer la couleur du graphique
      const lastPrice = priceData[priceData.length - 1];
      const isPositive = lastPrice >= firstPrice;
      const color = isPositive ? '#51CF66' : '#FF6B6B';

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
            pointRadius: 0,
            pointHoverRadius: 4,
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
  }, [symbol, etfName]);

  useEffect(() => {
    if (symbol) {
      fetchHistoricalData(selectedPeriod);
    }
  }, [symbol, selectedPeriod, fetchHistoricalData]);

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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Prix: ${context.parsed.y.toFixed(2)} EUR`;
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
      {/* Sélecteurs de période */}
      <div className="period-selector">
        {periods.map(period => (
          <button
            key={period.key}
            className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(period.key)}
          >
            {period.label}
          </button>
        ))}
      </div>

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