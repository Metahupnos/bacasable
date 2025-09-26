import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

function PortfolioChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configuration complète du portefeuille avec gestion de la transition EQQQ.DE → EQEU.DE
  // IMPORTANT: purchaseValue = prix d'achat × quantité (SANS les frais)
  const portfolioConfig = useMemo(() => [
    // ETF conservés tout au long
    { symbol: 'CSPX.AS', name: 'IS CO S&P500 U.ETF USD', quantity: 354, startDate: '2025-08-29', endDate: null, purchaseValue: 354 * 594.966 }, // 210617.964
    { symbol: 'IWDA.AS', name: 'ISHAR.III PLC CORE MSCI WORLD', quantity: 1424, startDate: '2025-08-29', endDate: null, purchaseValue: 1424 * 105.4987218487395 }, // 150227.26
    { symbol: 'EMIM.AS', name: 'ISHARES PLC CORE MSC E.M.IM UC', quantity: 2567, startDate: '2025-08-29', endDate: null, purchaseValue: 2567 * 34.979 }, // 89791.093
    { symbol: 'SC0J.DE', name: 'INVESCO MKS PLC MSCI WORLD U.ETF', quantity: 796, startDate: '2025-08-29', endDate: null, purchaseValue: 796 * 113.21626 }, // 90120.14

    // ETF vendu le 19/09
    { symbol: 'EQQQ.DE', name: 'INV.MAR.III-EQQQ NASDAQ-100 ETF (DIST)', quantity: 121, startDate: '2025-08-29', endDate: '2025-09-19', purchaseValue: 121 * 496.2 }, // 60040.2

    // ETF acheté le 19/09 (remplace EQQQ.DE)
    { symbol: 'EQEU.DE', name: 'INVESCO EQQQ NASDAQ-100 (ACC)', quantity: 144, startDate: '2025-09-19', endDate: null, purchaseValue: 144 * 428.57049 } // 61714.15
  ], []);

  const createPortfolioChart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Calcul de l\'évolution du portefeuille...');

      // Récupérer les données historiques pour tous les ETF (y compris EQQQ.DE vendu)
      // Utiliser 1m pour avoir des données plus récentes
      const promises = portfolioConfig.map(async (etf) => {
        // Utiliser Netlify Function en production ou proxy local en développement
          const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
          const apiPath = process.env.NODE_ENV === 'production' ? `/.netlify/functions/history/${etf.symbol}/1m` : `/api/history/${etf.symbol}/1m`;
          const response = await fetch(`${baseUrl}${apiPath}`);
        if (!response.ok) {
          throw new Error(`Erreur pour ${etf.symbol}: ${response.status}`);
        }
        return { ...etf, data: await response.json() };
      });

      const etfData = await Promise.all(promises);
      console.log('📈 Données récupérées pour', etfData.length, 'ETF (incluant EQQQ.DE vendu)');

      // Créer une map de toutes les dates depuis le 29 août
      const allDates = new Map();
      const startDate = new Date('2025-08-29');
      // const today = new Date();

      etfData.forEach(etf => {
        const result = etf.data.chart?.result?.[0];
        if (!result) return;

        const timestamps = result.timestamp || [];
        const prices = result.indicators?.quote?.[0]?.close || [];

        timestamps.forEach((timestamp, index) => {
          const date = new Date(timestamp * 1000);
          const dateStr = date.toISOString().split('T')[0];

          if (date >= startDate && prices[index] !== null) {
            if (!allDates.has(dateStr)) {
              allDates.set(dateStr, new Map());
            }
            allDates.get(dateStr).set(etf.symbol, prices[index]);
          }
        });
      });

      // Plus besoin de prix de référence - on utilise directement prix × quantité

      // Étape 2: Calculer la valeur du portefeuille pour chaque jour avec gestion de la transition
      const portfolioValues = [];
      const sortedDates = Array.from(allDates.keys()).sort();
      const transitionDate = new Date('2025-09-19');

      // Valeur d'achat initiale (prix payés)
      const purchaseValue = 600799.58;

      sortedDates.forEach(dateStr => {
        const dayPrices = allDates.get(dateStr);
        const currentDate = new Date(dateStr);
        let totalValue = 0;
        let hasAllPrices = true;
        const isBeforeTransition = currentDate < transitionDate;

        // AVANT le 19/09: Portefeuille avec EQQQ.DE (121 unités)
        if (isBeforeTransition) {
          const etfsBeforeTransition = [
            { symbol: 'CSPX.AS', quantity: 354 },
            { symbol: 'IWDA.AS', quantity: 1424 },
            { symbol: 'EMIM.AS', quantity: 2567 },
            { symbol: 'SC0J.DE', quantity: 796 },
            { symbol: 'EQQQ.DE', quantity: 121 }  // 121 unités avant vente
          ];

          etfsBeforeTransition.forEach(etf => {
            const currentPrice = dayPrices.get(etf.symbol);
            if (currentPrice !== undefined) {
              const currentValue = currentPrice * etf.quantity;
              totalValue += currentValue;
            } else {
              hasAllPrices = false;
            }
          });

          if (currentDate.toDateString() === new Date('2025-09-18').toDateString()) {
            console.log(`📊 Dernier jour avec EQQQ.DE (${dateStr}): ${totalValue.toLocaleString('fr-FR')} EUR`);
          }
        }
        // APRES le 19/09: Portefeuille avec EQEU.DE (144 unités)
        else {
          const etfsAfterTransition = [
            { symbol: 'CSPX.AS', quantity: 354 },
            { symbol: 'IWDA.AS', quantity: 1424 },
            { symbol: 'EMIM.AS', quantity: 2567 },
            { symbol: 'SC0J.DE', quantity: 796 },
            { symbol: 'EQEU.DE', quantity: 144 }  // 144 unités après achat
          ];

          etfsAfterTransition.forEach(etf => {
            const currentPrice = dayPrices.get(etf.symbol);
            if (currentPrice !== undefined) {
              const currentValue = currentPrice * etf.quantity;
              totalValue += currentValue;
            } else {
              hasAllPrices = false;
            }
          });

          if (currentDate.toDateString() === transitionDate.toDateString()) {
            console.log(`📊 Premier jour avec EQEU.DE (${dateStr}): ${totalValue.toLocaleString('fr-FR')} EUR`);
          }
        }

        if (hasAllPrices && totalValue > 0) {
          portfolioValues.push({
            date: dateStr,
            value: totalValue
          });
        }
      });

      // APRÈS avoir collecté toutes les valeurs de marché, ajuster seulement la première valeur
      if (portfolioValues.length > 0) {
        const firstMarketValue = portfolioValues[0].value;
        console.log(`📊 Première valeur de marché: ${firstMarketValue.toLocaleString('fr-FR')} EUR`);
        console.log(`📊 Valeur d'achat: ${purchaseValue.toLocaleString('fr-FR')} EUR`);

        // Ajuster seulement le premier point pour qu'il parte de la valeur d'achat
        // Les autres points restent aux vraies valeurs de marché
        portfolioValues[0].value = purchaseValue;
        console.log(`📊 Première valeur ajustée à: ${purchaseValue.toLocaleString('fr-FR')} EUR`);
      }

      console.log('💰 Valeurs calculées pour', portfolioValues.length, 'jours');

      // Debug: Afficher la dernière valeur du graphique
      if (portfolioValues.length > 0) {
        const lastValue = portfolioValues[portfolioValues.length - 1];
        console.log('📈 GRAPHIQUE - Dernière valeur:', lastValue.value.toLocaleString('fr-FR'), 'EUR le', lastValue.date);

        // Vérification avec la composition actuelle (après transition)
        const dayPrices = allDates.get(lastValue.date);
        let debugTotalValue = 0;
        const currentETFs = [
          { symbol: 'CSPX.AS', quantity: 354 },
          { symbol: 'IWDA.AS', quantity: 1424 },
          { symbol: 'EMIM.AS', quantity: 2567 },
          { symbol: 'SC0J.DE', quantity: 796 },
          { symbol: 'EQEU.DE', quantity: 144 }  // Composition actuelle
        ];

        currentETFs.forEach(etf => {
          const currentPrice = dayPrices.get(etf.symbol);
          if (currentPrice) {
            const etfValue = currentPrice * etf.quantity;
            debugTotalValue += etfValue;
            console.log(`📈 VÉRIF ${etf.symbol}: ${currentPrice.toFixed(2)} × ${etf.quantity} = ${etfValue.toLocaleString('fr-FR')} EUR`);
          }
        });

        console.log('📈 VÉRIF Total avec composition actuelle:', debugTotalValue.toLocaleString('fr-FR'), 'EUR');
        console.log('📈 VÉRIF Différence:', (debugTotalValue - lastValue.value).toLocaleString('fr-FR'), 'EUR');
      }

      // Debug: afficher les détails du premier et dernier jour
      if (portfolioValues.length > 0) {
        const firstDay = portfolioValues[0];
        const lastDay = portfolioValues[portfolioValues.length - 1];

        console.log('🔍 Premier jour:', firstDay.date, 'Valeur:', firstDay.value.toLocaleString('fr-FR'), 'EUR');
        console.log('🔍 Dernier jour:', lastDay.date, 'Valeur:', lastDay.value.toLocaleString('fr-FR'), 'EUR');
      }

      if (portfolioValues.length === 0) {
        throw new Error('Aucune donnée de portefeuille calculée');
      }

      // Forcer l'ajout d'un point avec les derniers prix disponibles si nécessaire
      const todayStr = new Date().toISOString().split('T')[0];
      const lastPortfolioDate = portfolioValues[portfolioValues.length - 1].date;

      if (lastPortfolioDate !== todayStr) {
        console.log('📈 Ajout point actuel car dernière valeur:', lastPortfolioDate, 'vs aujourd\'hui:', todayStr);

        // Récupérer les derniers prix via l'API 1d pour la composition actuelle
        try {
          let currentTotalValue = 0;
          let hasAllCurrentPrices = true;
          const currentComposition = [
            { symbol: 'CSPX.AS', quantity: 354 },
            { symbol: 'IWDA.AS', quantity: 1424 },
            { symbol: 'EMIM.AS', quantity: 2567 },
            { symbol: 'SC0J.DE', quantity: 796 },
            { symbol: 'EQEU.DE', quantity: 144 }  // Composition actuelle
          ];

          for (const etf of currentComposition) {
            // Utiliser Netlify Function en production ou proxy local en développement
            const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
            const apiPath = process.env.NODE_ENV === 'production' ? `/.netlify/functions/history/${etf.symbol}/1d` : `/api/history/${etf.symbol}/1d`;
            const response = await fetch(`${baseUrl}${apiPath}`);
            if (response.ok) {
              const data = await response.json();
              const result = data.chart?.result?.[0];
              if (result) {
                const prices = result.indicators?.quote?.[0]?.close || [];
                const latestPrice = prices[prices.length - 1];
                if (latestPrice) {
                  currentTotalValue += latestPrice * etf.quantity;
                  console.log(`📈 Prix actuel ${etf.symbol}: ${latestPrice.toFixed(2)} EUR`);
                } else {
                  hasAllCurrentPrices = false;
                }
              } else {
                hasAllCurrentPrices = false;
              }
            } else {
              hasAllCurrentPrices = false;
            }
          }

          if (hasAllCurrentPrices && currentTotalValue > 0) {
            // Ajouter la vraie valeur de marché actuelle (sans ajustement)
            portfolioValues.push({
              date: todayStr,
              value: currentTotalValue
            });
            console.log('📈 Point actuel ajouté:', currentTotalValue.toLocaleString('fr-FR'), 'EUR');
          }
        } catch (err) {
          console.warn('⚠️ Impossible d\'ajouter le point actuel:', err);
        }
      }

      // Préparer les données pour Chart.js
      const labels = portfolioValues.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit'
        });
      });

      const values = portfolioValues.map(item => item.value);
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const totalGain = lastValue - firstValue;
      const isPositive = totalGain >= 0;

      // Utiliser les valeurs absolutes du portefeuille

      const color = isPositive ? '#20B8E0' : '#008EB7';

      setChartData({
        labels,
        datasets: [
          {
            label: 'Valeur du portefeuille (EUR)',
            data: values,
            borderColor: color,
            backgroundColor: color + '20',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 3
          }
        ],
        stats: {
          firstValue,
          lastValue,
          totalGain,
          gainPercentage: (totalGain / firstValue) * 100,
          isPositive,
          days: portfolioValues.length
        }
      });

    } catch (err) {
      console.error('❌ Erreur calcul portefeuille:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [portfolioConfig]);

  useEffect(() => {
    createPortfolioChart();
  }, [createPortfolioChart]);

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
            // Récupérer la date à partir du label et la convertir au format dd/mm/yyyy
            const label = context[0].label; // Format "dd/mm" du graphique
            const currentYear = new Date().getFullYear();
            const dateValue = `${label}/${currentYear}`;
            return `Date:${' '.repeat(20 - dateValue.length)}${dateValue}`;
          },
          label: function(context) {
            const portfolioValue = context.parsed.y;
            const realInvestedAmount = 603000 - 337.18; // 602 662.82 EUR
            const gainLoss = portfolioValue - realInvestedAmount;
            const isPositive = gainLoss >= 0;

            const valeurText = Math.round(portfolioValue).toLocaleString('fr-FR');
            const gainText = `${isPositive ? '+' : ''}${Math.round(gainLoss).toLocaleString('fr-FR')}`;

            const gainLabel = isPositive ? 'Gain:' : 'Perte:';

            return [
              `Valeur:${' '.repeat(20 - valeurText.length)}${valeurText}`,
              `${gainLabel}${' '.repeat(20 - gainText.length)}${gainText}`
            ];
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
          maxTicksLimit: 8,
          color: '#666',
          font: {
            size: 11
          }
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value.toLocaleString('fr-FR', {minimumFractionDigits: 0}) + ' EUR';
          },
          color: '#666',
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="portfolio-chart-container" style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        margin: '15px 0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>📊</div>
          <p>Calcul de l'évolution du portefeuille...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-chart-container" style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        margin: '15px 0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ color: '#dc3545', textAlign: 'center', padding: '20px' }}>
          <p>❌ Erreur lors du calcul: {error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  return (
    <div className="portfolio-chart-container" style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      margin: '15px 0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
          Évolution du portefeuille
        </h3>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>Depuis le 29 août 2025</span>
          <div style={{
            background: chartData.stats.isPositive ? '#d4edda' : '#f8d7da',
            color: chartData.stats.isPositive ? '#155724' : '#721c24',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {chartData.stats.isPositive ? '+' : ''}{chartData.stats.gainPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      <div style={{ height: '180px', width: '100%' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div style={{
        marginTop: '15px',
        fontSize: '11px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>{chartData.stats.days} jours de données</span>
        <span>
          {chartData.stats.isPositive ? '+' : ''}{chartData.stats.totalGain.toLocaleString('fr-FR', {minimumFractionDigits: 0})} EUR
        </span>
      </div>
    </div>
  );
}

export default PortfolioChart;