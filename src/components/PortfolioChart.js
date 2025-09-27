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

function PortfolioChart({ filter = 'Depuis le début', showPeriodsSelector = false }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Récupérer la période globale sauvegardée en mode Historique
  const getGlobalPeriod = () => {
    if (filter !== 'Historique') return '1m';
    try {
      return localStorage.getItem('etf-chart-period') || '1m';
    } catch {
      return '1m';
    }
  };

  const [selectedPeriod, setSelectedPeriod] = useState(getGlobalPeriod());

  // Périodes disponibles selon le filtre
  const periods = useMemo(() => {
    if (filter === 'Historique' || showPeriodsSelector) {
      return [
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
    }
    return null; // Pas de sélecteur pour "Depuis le début" et "Aujourd'hui" par défaut
  }, [filter, showPeriodsSelector]);

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

  // Fonction pour changer la période et la synchroniser avec les graphiques ETF
  const handlePeriodChange = (newPeriod) => {
    setSelectedPeriod(newPeriod);
    try {
      localStorage.setItem('etf-chart-period', newPeriod);
      // Déclencher un événement custom pour synchroniser avec les graphiques ETF
      window.dispatchEvent(new CustomEvent('etf-period-changed', { detail: newPeriod }));
    } catch (e) {
      console.warn('Impossible de sauvegarder la période:', e);
    }
  };

  // Écouter les changements de période depuis les graphiques ETF
  useEffect(() => {
    const handleGlobalPeriodChange = (event) => {
      if (filter === 'Historique' || showPeriodsSelector) {
        setSelectedPeriod(event.detail);
      }
    };

    window.addEventListener('etf-period-changed', handleGlobalPeriodChange);
    return () => window.removeEventListener('etf-period-changed', handleGlobalPeriodChange);
  }, [filter, showPeriodsSelector]);

  // Mettre à jour la période quand le filtre change
  useEffect(() => {
    if (filter !== 'Historique' && !showPeriodsSelector) {
      setSelectedPeriod('1m');
    } else {
      try {
        const savedPeriod = localStorage.getItem('etf-chart-period') || '1m';
        setSelectedPeriod(savedPeriod);
      } catch {
        setSelectedPeriod('1m');
      }
    }
  }, [filter, showPeriodsSelector]);

  const createPortfolioChart = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Calcul de l\'évolution du portefeuille...');

      let etfsToFetch;
      let apiPeriod;

      if (filter === 'Historique') {
        // Mode historique : composition actuelle simplifiée avec période sélectionnée
        etfsToFetch = [
          { symbol: 'CSPX.AS', quantity: 354 },
          { symbol: 'IWDA.AS', quantity: 1424 },
          { symbol: 'EMIM.AS', quantity: 2567 },
          { symbol: 'SC0J.DE', quantity: 796 },
          { symbol: 'EQEU.DE', quantity: 144 }
        ];
        // Pour "inception", utiliser 1m mais on filtrera les données côté client
        // Pour "10y", utiliser directement "10y" comme Yahoo Finance le supporte
        if (selectedPeriod === 'inception') {
          apiPeriod = '1m';
        } else {
          apiPeriod = selectedPeriod;
        }
      } else if (filter === 'Aujourd\'hui') {
        // Mode aujourd'hui : valeur actuelle (pas de graphique de période)
        etfsToFetch = [
          { symbol: 'CSPX.AS', quantity: 354 },
          { symbol: 'IWDA.AS', quantity: 1424 },
          { symbol: 'EMIM.AS', quantity: 2567 },
          { symbol: 'SC0J.DE', quantity: 796 },
          { symbol: 'EQEU.DE', quantity: 144 }
        ];
        apiPeriod = '1d'; // Données du jour
      } else {
        // Pour "Depuis le début", utiliser la configuration complète avec transitions
        etfsToFetch = portfolioConfig;
        apiPeriod = '1m'; // Toujours utiliser 1m pour le mode "Depuis le début"
      }

      // Récupérer les données historiques
      const promises = etfsToFetch.map(async (etf) => {
        // Utiliser Netlify Function en production ou proxy local en développement
        const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
        const apiPath = process.env.NODE_ENV === 'production' ? `/.netlify/functions/history/${etf.symbol}/${apiPeriod}` : `/api/history/${etf.symbol}/${apiPeriod}`;
        const response = await fetch(`${baseUrl}${apiPath}`);
        if (!response.ok) {
          throw new Error(`Erreur pour ${etf.symbol}: ${response.status}`);
        }
        return { ...etf, data: await response.json() };
      });

      const etfData = await Promise.all(promises);
      console.log('📈 Données récupérées pour', etfData.length, 'ETF');


      // Créer une map de toutes les dates
      const allDates = new Map();
      let startDate;

      if (filter === 'Historique') {
        // Pour le mode historique, utiliser la période sélectionnée
        const now = new Date();
        switch (selectedPeriod) {
          case '1d':
            startDate = new Date(0); // Toutes les données pour 1d
            break;
          case '5d':
            startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
            break;
          case '1m':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3m':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '6m':
            startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          case '5y':
            startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
            break;
          case '10y':
            startDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
            break;
          case 'inception':
            startDate = new Date('2025-08-29'); // Date de création du portefeuille
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
      } else if (filter === 'Aujourd\'hui') {
        // Pour "Aujourd'hui", pas de filtrage - juste les données du jour
        startDate = new Date(0);
      } else {
        // Pour "Depuis le début", toujours partir du 29 août
        startDate = new Date('2025-08-29');
      }

      etfData.forEach(etf => {
        const result = etf.data.chart?.result?.[0];
        if (!result) return;

        const timestamps = result.timestamp || [];
        const prices = result.indicators?.quote?.[0]?.close || [];

        timestamps.forEach((timestamp, index) => {
          const date = new Date(timestamp * 1000);

          // Pour 1d, utiliser timestamp complet (heures) au lieu de juste la date
          let dateKey;
          if ((filter === 'Historique' && selectedPeriod === '1d') || filter === 'Aujourd\'hui') {
            dateKey = timestamp.toString(); // Utiliser le timestamp exact pour les données intraday
          } else {
            dateKey = date.toISOString().split('T')[0]; // Utiliser juste la date pour les autres périodes
          }

          // Pour 1d et Aujourd'hui, ne pas filtrer par date - prendre toutes les données
          let includeData;
          if ((filter === 'Historique' && selectedPeriod === '1d') || filter === 'Aujourd\'hui') {
            includeData = prices[index] !== null;
          } else {
            includeData = date >= startDate && prices[index] !== null;
          }

          if (includeData) {
            if (!allDates.has(dateKey)) {
              allDates.set(dateKey, new Map());
            }
            allDates.get(dateKey).set(etf.symbol, prices[index]);
          }
        });
      });

      // Calculer la valeur du portefeuille pour chaque jour
      const portfolioValues = [];
      // Trier par timestamp numérique pour 1d, par date string pour les autres
      const sortedDates = Array.from(allDates.keys()).sort((a, b) => {
        if ((filter === 'Historique' && selectedPeriod === '1d') || filter === 'Aujourd\'hui') {
          return parseInt(a) - parseInt(b); // Tri numérique des timestamps
        }
        return a.localeCompare(b); // Tri alphabétique des dates
      });

      if ((filter === 'Historique' && selectedPeriod !== 'inception') || filter === 'Aujourd\'hui') {
        // Mode simplifié: utiliser seulement la composition actuelle
        // Pour 1d, créer un tableau de tous les timestamps possibles depuis CSPX (le plus complet)
        if ((filter === 'Historique' && selectedPeriod === '1d') || filter === 'Aujourd\'hui') {
          // Prendre tous les timestamps de CSPX comme référence
          const cspxData = etfData.find(etf => etf.symbol === 'CSPX.AS');
          const cspxTimestamps = cspxData?.data?.chart?.result?.[0]?.timestamp || [];

          // Créer un cache des dernières valeurs connues pour chaque ETF
          const lastKnownPrices = {};

          cspxTimestamps.forEach(timestamp => {
            let totalValue = 0;
            let validETFCount = 0;

            const currentComposition = [
              { symbol: 'CSPX.AS', quantity: 354 },
              { symbol: 'IWDA.AS', quantity: 1424 },
              { symbol: 'EMIM.AS', quantity: 2567 },
              { symbol: 'SC0J.DE', quantity: 796 },
              { symbol: 'EQEU.DE', quantity: 144 }
            ];

            currentComposition.forEach(etf => {
              const timestampKey = timestamp.toString();
              const dayPrices = allDates.get(timestampKey);
              let currentPrice;

              // Chercher le prix à ce timestamp
              if (dayPrices && dayPrices.has(etf.symbol)) {
                currentPrice = dayPrices.get(etf.symbol);
                // Mettre à jour la dernière valeur connue
                lastKnownPrices[etf.symbol] = currentPrice;
              } else if (lastKnownPrices[etf.symbol]) {
                // Utiliser la dernière valeur connue si pas de données à ce timestamp
                currentPrice = lastKnownPrices[etf.symbol];
              }

              if (currentPrice !== undefined) {
                const currentValue = currentPrice * etf.quantity;
                totalValue += currentValue;
                validETFCount++;
              }
            });

            // Accepter le point si on a au moins 3 ETF sur 5 avec des données
            if (validETFCount >= 3 && totalValue > 0) {
              portfolioValues.push({
                date: new Date(timestamp * 1000).toISOString(),
                value: totalValue
              });
            }
          });
        } else {
          // Logique normale pour les autres périodes
          sortedDates.forEach(dateKey => {
            const dayPrices = allDates.get(dateKey);
            let totalValue = 0;
            let hasAllPrices = true;

            const currentComposition = [
              { symbol: 'CSPX.AS', quantity: 354 },
              { symbol: 'IWDA.AS', quantity: 1424 },
              { symbol: 'EMIM.AS', quantity: 2567 },
              { symbol: 'SC0J.DE', quantity: 796 },
              { symbol: 'EQEU.DE', quantity: 144 }
            ];

            currentComposition.forEach(etf => {
              const currentPrice = dayPrices.get(etf.symbol);
              if (currentPrice !== undefined) {
                const currentValue = currentPrice * etf.quantity;
                totalValue += currentValue;
              } else {
                hasAllPrices = false;
              }
            });

            if (hasAllPrices && totalValue > 0) {
              portfolioValues.push({
                date: dateKey,
                value: totalValue
              });
            }
          });
        }
      } else if (filter === 'Historique' && selectedPeriod === 'inception') {
        // Mode "Depuis création" : même logique que "Depuis le début" avec gestion des transitions réelles
        const transitionDate = new Date('2025-09-19');
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
              { symbol: 'EQQQ.DE', quantity: 121 }
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
          }
          // APRES le 19/09: Portefeuille avec EQEU.DE (144 unités)
          else {
            const etfsAfterTransition = [
              { symbol: 'CSPX.AS', quantity: 354 },
              { symbol: 'IWDA.AS', quantity: 1424 },
              { symbol: 'EMIM.AS', quantity: 2567 },
              { symbol: 'SC0J.DE', quantity: 796 },
              { symbol: 'EQEU.DE', quantity: 144 }
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
          }

          if (hasAllPrices && totalValue > 0) {
            portfolioValues.push({
              date: dateStr,
              value: totalValue
            });
          }
        });

        // Pour "Depuis création", ajuster la première valeur comme pour "Depuis le début"
        if (portfolioValues.length > 0) {
          portfolioValues[0].value = purchaseValue;
        }
      } else {
        // Mode "Depuis le début" avec gestion des transitions réelles
        const transitionDate = new Date('2025-09-19');
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
              { symbol: 'EQQQ.DE', quantity: 121 }
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
          }
          // APRES le 19/09: Portefeuille avec EQEU.DE (144 unités)
          else {
            const etfsAfterTransition = [
              { symbol: 'CSPX.AS', quantity: 354 },
              { symbol: 'IWDA.AS', quantity: 1424 },
              { symbol: 'EMIM.AS', quantity: 2567 },
              { symbol: 'SC0J.DE', quantity: 796 },
              { symbol: 'EQEU.DE', quantity: 144 }
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
          }

          if (hasAllPrices && totalValue > 0) {
            portfolioValues.push({
              date: dateStr,
              value: totalValue
            });
          }
        });

        // Pour "Depuis le début", ajuster la première valeur
        if (portfolioValues.length > 0) {
          portfolioValues[0].value = purchaseValue;
        }
      }

      console.log('💰 Valeurs calculées pour', portfolioValues.length, filter === 'Aujourd\'hui' && selectedPeriod === '1d' ? 'points intraday' : 'jours');

      // Debug: Afficher la dernière valeur du graphique
      if (portfolioValues.length > 0) {
        const lastValue = portfolioValues[portfolioValues.length - 1];
        console.log('📈 GRAPHIQUE - Dernière valeur:', lastValue.value.toLocaleString('fr-FR'), 'EUR le', lastValue.date);

        // Vérification avec la composition actuelle (seulement pour mode normal, pas 1d)
        if (!(filter === 'Aujourd\'hui' && selectedPeriod === '1d')) {
          const dayPrices = allDates.get(lastValue.date);
          if (dayPrices) {
            let debugTotalValue = 0;
            const currentETFs = [
              { symbol: 'CSPX.AS', quantity: 354 },
              { symbol: 'IWDA.AS', quantity: 1424 },
              { symbol: 'EMIM.AS', quantity: 2567 },
              { symbol: 'SC0J.DE', quantity: 796 },
              { symbol: 'EQEU.DE', quantity: 144 }
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
        }
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

      // Pour le mode "Depuis le début", essayer d'ajouter un point actuel si nécessaire
      if (filter !== 'Aujourd\'hui') {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastPortfolioDate = portfolioValues[portfolioValues.length - 1]?.date;

        if (lastPortfolioDate && lastPortfolioDate !== todayStr) {
          console.log('📈 Ajout point actuel car dernière valeur:', lastPortfolioDate, 'vs aujourd\'hui:', todayStr);

          try {
            let currentTotalValue = 0;
            let hasAllCurrentPrices = true;
            const currentComposition = [
              { symbol: 'CSPX.AS', quantity: 354 },
              { symbol: 'IWDA.AS', quantity: 1424 },
              { symbol: 'EMIM.AS', quantity: 2567 },
              { symbol: 'SC0J.DE', quantity: 796 },
              { symbol: 'EQEU.DE', quantity: 144 }
            ];

            for (const etf of currentComposition) {
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
              portfolioValues.push({
                date: todayStr,
                value: currentTotalValue
              });
            }
          } catch (err) {
            console.warn('⚠️ Impossible d\'ajouter le point actuel:', err);
          }
        }
      }

      // Préparer les données pour Chart.js
      const labels = portfolioValues.map(item => {
        const date = new Date(item.date);
        // Format différent selon la période et le mode
        if (filter === 'Historique') {
          if (selectedPeriod === '1d') {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          } else if (['5d', '1m', 'inception'].includes(selectedPeriod)) {
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          } else {
            return date.toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' });
          }
        } else if (filter === 'Aujourd\'hui') {
          return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } else {
          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit'
          });
        }
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
  }, [portfolioConfig, filter, selectedPeriod]);

  useEffect(() => {
    createPortfolioChart();
  }, [createPortfolioChart, selectedPeriod]);

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
            const portfolioValue = context[0].parsed.y;
            const valeurText = `${Math.round(portfolioValue).toLocaleString('fr-FR')} EUR`;
            return valeurText;
          },
          label: function(context) {
            // Date en dessous
            const label = context.label; // Format "dd/mm" du graphique
            const currentYear = new Date().getFullYear();
            const dateValue = `${label}/${currentYear}`;

            // Performance depuis le début
            const portfolioValue = context.parsed.y;
            const realInvestedAmount = 603000 - 337.18; // 602 662.82 EUR
            const gainLoss = portfolioValue - realInvestedAmount;
            const performanceText = `${gainLoss >= 0 ? '+' : ''}${Math.round(gainLoss).toLocaleString('fr-FR')}`;

            return [
              dateValue,
              performanceText
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
      {/* Sélecteur de période pour le mode "Historique" ou quand explicitement demandé */}
      {(filter === 'Historique' || showPeriodsSelector) && periods && (
        <div className="period-selector" style={{
          marginBottom: '15px',
          display: 'flex',
          gap: '5px',
          flexWrap: 'wrap'
        }}>
          {periods.map(period => (
            <button
              key={period.key}
              className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
              onClick={() => handlePeriodChange(period.key)}
              style={{
                padding: '6px 12px',
                border: selectedPeriod === period.key ? '2px solid #008EB7' : '1px solid #ddd',
                borderRadius: '15px',
                background: selectedPeriod === period.key ? '#008EB7' : '#fff',
                color: selectedPeriod === period.key ? '#fff' : '#666',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
          {filter === 'Historique' ? 'Évolution virtuelle du portefeuille' :
           filter === 'Aujourd\'hui' ? 'Valeur du portefeuille aujourd\'hui' :
           'Évolution du portefeuille'}
        </h3>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span>
            {filter === 'Historique'
              ? `Simulation sur ${periods?.find(p => p.key === selectedPeriod)?.label || selectedPeriod}`
              : filter === 'Aujourd\'hui'
              ? 'Valeurs du jour en cours'
              : 'Depuis le 29 août 2025'
            }
          </span>
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