import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import financeService from './services/financeApi';
import OrdersPage from './components/OrdersPage';
import StockChart from './components/StockChart';
import PortfolioChart from './components/PortfolioChart';

function App() {
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Depuis le début');
  const [activePage, setActivePage] = useState('Portefeuille');
  const [totalBalance, setTotalBalance] = useState({
    total: '615.232,42',
    change: '-1.108,05',
    changePercentage: '-0,18',
    positive: false
  });
  const [portfolioPerformance, setPortfolioPerformance] = useState({
    sinceInception: { change: '+12.569,84', changePercentage: '+2,09', positive: true },
    intraday: { change: '-1.108,05', changePercentage: '-0,18', positive: false }
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedETFs, setSelectedETFs] = useState([]);
  const [historiqueSelectedPeriod, setHistoriqueSelectedPeriod] = useState('inception');
  const [actionsSelectedPeriod, setActionsSelectedPeriod] = useState('1y');

  // Actions à suivre pour la page Actions
  const watchedStocks = [
    {
      symbol: 'NVDA',
      name: 'NVIDIA',
      description: 'Leader mondial des GPU, indispensables pour l\'IA et le calcul haute performance.',
      category: 'IA/GPU'
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft',
      description: 'Cloud (Azure), partenaire OpenAI, intégration massive de l\'IA dans ses logiciels.',
      category: 'Cloud/IA'
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet / Google',
      description: 'IA (DeepMind, Gemini), publicité numérique, services cloud.',
      category: 'IA/Cloud'
    },
    {
      symbol: 'META',
      name: 'Meta Platforms',
      description: 'Développe LLaMA (IA open source), publicité optimisée par IA, réalité augmentée/virtuelle.',
      category: 'IA/Social'
    },
    {
      symbol: 'PLTR',
      name: 'Palantir Technologies',
      description: 'Analyse de données massives, solutions IA pour gouvernements et entreprises.',
      category: 'IA/Data'
    },
    {
      symbol: 'RMBS',
      name: 'Rambus',
      description: 'Spécialiste des mémoires et interfaces haute performance, rôle clé dans l\'accélération matérielle IA.',
      category: 'Semi-conducteurs'
    },
    {
      symbol: 'INTC',
      name: 'Intel',
      description: 'Fabricant historique de puces, repositionnement sur les processeurs et architectures IA.',
      category: 'Semi-conducteurs'
    },
    {
      symbol: 'TSM',
      name: 'TSMC',
      description: 'Premier fondeur mondial de semi-conducteurs, partenaire d\'Apple, Nvidia, AMD.',
      category: 'Semi-conducteurs'
    },
    {
      symbol: 'ORCL',
      name: 'Oracle',
      description: 'Logiciels de gestion, bases de données, cloud avec intégration de l\'IA.',
      category: 'Cloud/Base de données'
    },
    {
      symbol: 'BABA',
      name: 'Alibaba',
      description: 'Géant chinois du e-commerce et du cloud, fort investissement dans l\'IA.',
      category: 'E-commerce/Cloud'
    },
    {
      symbol: 'TSLA',
      name: 'Tesla',
      description: 'Voitures électriques, batteries, énergie. Fort développement IA pour conduite autonome et robotique.',
      category: 'Automobile/IA'
    },
    {
      symbol: 'AAPL',
      name: 'Apple',
      description: 'Électronique grand public (iPhone, Mac). Développe ses propres puces et l\'IA embarquée (Apple Intelligence).',
      category: 'Consumer Tech'
    },
    {
      symbol: 'BTC-EUR',
      name: 'Bitcoin',
      description: 'Première cryptomonnaie mondiale, vue comme réserve de valeur. Volatile mais adoption croissante.',
      category: 'Cryptomonnaie'
    }
  ];

  // Configuration des prix d'achat pour le mode "Depuis le début"
  const purchasePrices = useMemo(() => ({
    'CSPX.AS': 594.966,
    'IWDA.AS': 105.4987218487395,
    'EMIM.AS': 34.979,
    'SC0J.DE': 113.21626,
    'EQQQ.DE': 496.2,
    'EQEU.DE': 428.57049
  }), []);

  // Dates d'achat des ETF
  const purchaseDates = {
    'CSPX.AS': '29/08/2025',
    'IWDA.AS': '29/08/2025',
    'EMIM.AS': '29/08/2025',
    'SC0J.DE': '29/08/2025',
    'EQQQ.DE': '29/08/2025',
    'EQEU.DE': '19/09/2025'
  };

  // Descriptifs détaillés des ETF
  const etfDescriptions = {
    'CSPX.AS': {
      short: 'ISH COR S&P500',
      full: 'iShares Core S&P 500 UCITS ETF',
      isin: 'IE00B5BMR087',
      description: 'Suit l\'indice S&P 500, représentant les 500 principales entreprises américaines. Capitalisant.',
      region: 'US'
    },
    'IWDA.AS': {
      short: 'ISH COR MSCI WORLD',
      full: 'iShares Core MSCI World UCITS ETF',
      isin: 'IE00B4L5Y983',
      description: 'Suit l\'indice MSCI World, couvrant les grandes et moyennes capitalisations des pays développés. Capitalisant.',
      region: 'WORLD'
    },
    'EMIM.AS': {
      short: 'ISH COR MSCI EM',
      full: 'iShares Core MSCI Emerging Markets IMI UCITS ETF',
      isin: 'IE00BKM4GZ66',
      description: 'Suit l\'indice MSCI Emerging Markets IMI, comprenant des sociétés de grande, moyenne et petite taille dans les pays émergents. Capitalisant.',
      region: 'EMERGENTS'
    },
    'SC0J.DE': {
      short: 'INV MSCI WORLD',
      full: 'Invesco MSCI World UCITS ETF',
      isin: 'IE00B60SX394',
      description: 'Suit l\'indice MSCI World, similaire à IWDA, avec réplication physique. Capitalisant.',
      region: 'WORLD'
    },
    'EQQQ.DE': {
      short: 'INV NASDAQ-100',
      full: 'Invesco Nasdaq-100 UCITS ETF Dist',
      isin: 'IE00BYVQ9F29',
      description: 'Suit l\'indice Nasdaq-100, regroupant 100 grandes entreprises non financières cotées au Nasdaq, avec forte pondération technologique. Distribuant.',
      region: 'US'
    },
    'EQEU.DE': {
      short: 'INV NASDAQ-100 ACC',
      full: 'Invesco Nasdaq-100 UCITS ETF Acc',
      isin: 'IE00BYVQ9F29',
      description: 'Suit l\'indice Nasdaq-100, regroupant 100 grandes entreprises non financières cotées au Nasdaq, avec forte pondération technologique. Capitalisant.',
      region: 'US'
    }
  };

  // Quantités d'unités par ETF
  const etfQuantities = useMemo(() => ({
    'CSPX.AS': 354,
    'IWDA.AS': 1424,
    'EMIM.AS': 2567,
    'SC0J.DE': 796,
    'EQQQ.DE': 121,
    'EQEU.DE': 144
  }), []);

  const loadPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financeService.getAllPortfolioData();

      // Calculer le poids de chaque ETF par rapport au portefeuille total
      console.log('🔍 DÉTAIL DU PORTEFEUILLE:');
      console.log('========================');

      const totalPortfolioValue = data.reduce((sum, item) => {
        // Extraire la valeur numérique en supprimant les espaces et en remplaçant la virgule par un point
        const numericValue = parseFloat(item.value.replace(/\s/g, '').replace(',', '.'));

        // Log détaillé pour chaque ETF
        console.log(`📊 ${item.symbol}:`);
        console.log(`   • Nom: ${item.name}`);
        console.log(`   • Quantité: ${etfQuantities[item.symbol] || 'N/A'} unités`);
        console.log(`   • Prix actuel: ${item.price || 'N/A'}`);
        console.log(`   • Valeur brute: "${item.value}" → ${numericValue.toLocaleString('fr-FR')} EUR`);
        console.log(`   • Prix d'achat: ${purchasePrices[item.symbol]?.toFixed(2) || 'N/A'} EUR`);
        console.log('');

        return sum + numericValue;
      }, 0);

      console.log('💰 TOTAL CALCULÉ:', totalPortfolioValue.toLocaleString('fr-FR'), 'EUR');
      console.log('========================');

      const dataWithWeights = data.map(item => {
        const numericValue = parseFloat(item.value.replace(/\s/g, '').replace(',', '.'));
        const weight = ((numericValue / totalPortfolioValue) * 100).toFixed(1);
        return {
          ...item,
          portfolioWeight: weight
        };
      });

      setPortfolioData(dataWithWeights);

      // Calculer les performances pour l'en-tête
      const sinceInceptionBalance = financeService.calculateSinceInception(data);
      const todayBalance = financeService.calculateTodayBalance(data);

      // Mettre à jour les performances du portefeuille
      setPortfolioPerformance({
        sinceInception: {
          change: sinceInceptionBalance.change,
          changePercentage: sinceInceptionBalance.changePercentage,
          positive: sinceInceptionBalance.positive
        },
        intraday: {
          change: todayBalance.change,
          changePercentage: todayBalance.changePercentage,
          positive: todayBalance.positive
        }
      });

      // Le total balance reste le total actuel
      const totalBalance = financeService.calculateTotalBalance(data);
      setTotalBalance(totalBalance);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [etfQuantities, purchasePrices]);

  useEffect(() => {
    // Initialiser la période par défaut dans localStorage
    try {
      if (!localStorage.getItem('etf-chart-period')) {
        localStorage.setItem('etf-chart-period', 'inception');
      }
    } catch (e) {
      console.warn('Impossible d\'initialiser la période par défaut:', e);
    }

    loadPortfolioData();

    // Actualiser les données toutes les 30 secondes pour éviter le rate limiting
    const interval = setInterval(loadPortfolioData, 30000);

    return () => clearInterval(interval);
  }, [loadPortfolioData]); // loadPortfolioData est stable grâce à useCallback

  // Écouter les changements de période depuis le portefeuille virtuel en mode Portefeuille
  useEffect(() => {
    const handlePeriodChange = (event) => {
      if (activePage === 'Portefeuille') {
        setHistoriqueSelectedPeriod(event.detail);
      }
    };

    window.addEventListener('etf-period-changed', handlePeriodChange);
    return () => window.removeEventListener('etf-period-changed', handlePeriodChange);
  }, [activePage]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getYahooFinanceUrl = (symbol) => {
    return `https://finance.yahoo.com/quote/${symbol}`;
  };

  // Fonction supprimée car non utilisée

  const toggleETFChart = (symbol) => {
    setSelectedETFs(prev => {
      if (prev.includes(symbol)) {
        // Fermer le graphique s'il est déjà ouvert
        return prev.filter(etf => etf !== symbol);
      } else {
        // Ouvrir le graphique
        return [...prev, symbol];
      }
    });
  };

  // Fonction supprimée car non utilisée
  return (
    <div className="App">
      <div className="mobile-container">
        {/* Header */}
        <div className="header">
          <div className="status-bar">
            <span className="time">{formatTime(lastUpdate)}</span>
            <div className="right-icons">
              <span className="signal">•••• ☰ 📶</span>
              <span className="battery">97</span>
            </div>
          </div>

          <div className="balance-section">
            <div className="settings-icon" onClick={loadPortfolioData}>
              ⚙️
            </div>
            <div className="balance-info">
              <h1 className="total-balance">{totalBalance.total} EUR</h1>
              <div className="balance-change">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {/* Performance depuis le début */}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: '500' }}>Depuis création:</span>
                    <span className="change-amount" style={{ fontSize: '12px' }}>
                      {portfolioPerformance.sinceInception.change} EUR
                    </span>
                    <span className={`change-percentage ${portfolioPerformance.sinceInception.positive ? 'positive' : 'negative'}`} style={{ fontSize: '12px' }}>
                      {portfolioPerformance.sinceInception.changePercentage}%
                    </span>
                  </div>
                  {/* Performance intraday */}
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: '500' }}>Aujourd'hui:</span>
                    <span className="change-amount" style={{ fontSize: '12px' }}>
                      {portfolioPerformance.intraday.change} EUR
                    </span>
                    <span className={`change-percentage ${portfolioPerformance.intraday.positive ? 'positive' : 'negative'}`} style={{ fontSize: '12px' }}>
                      {portfolioPerformance.intraday.changePercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mail-icon">✉️</div>
          </div>

          {/* Navigation tabs */}
          <div className="nav-tabs">
            <div
              className={`tab ${activePage === 'Portefeuille' ? 'active' : ''}`}
              onClick={() => {
                setActivePage('Portefeuille');
                setActiveFilter('Historique');
              }}
            >
              Portefeuille
            </div>
            <div
              className={`tab ${activePage === 'Actions' ? 'active' : ''}`}
              onClick={() => setActivePage('Actions')}
            >
              Actions
            </div>
            <div
              className={`tab ${activePage === 'Ordres' ? 'active' : ''}`}
              onClick={() => setActivePage('Ordres')}
            >
              Ordres
            </div>
          </div>
        </div>

        {/* Contenu conditionnel selon la page active */}
        {activePage === 'Portefeuille' ? (
          <>
            {/* Sélecteurs de période toujours visibles - au-dessus de tout */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '15px 20px',
              margin: '15px 0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                gap: '5px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {[
                  { key: '1d', label: '1J' },
                  { key: '5d', label: '5J' },
                  { key: '1m', label: '1M' },
                  { key: '3m', label: '3M' },
                  { key: '6m', label: '6M' },
                  { key: '1y', label: '1A' },
                  { key: '5y', label: '5A' },
                  { key: '10y', label: '10A' },
                  { key: 'inception', label: 'Depuis création' }
                ].map(period => (
                  <button
                    key={period.key}
                    onClick={() => {
                      setHistoriqueSelectedPeriod(period.key);
                      try {
                        localStorage.setItem('etf-chart-period', period.key);
                        window.dispatchEvent(new CustomEvent('etf-period-changed', { detail: period.key }));
                      } catch (e) {
                        console.warn('Impossible de sauvegarder la période:', e);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      border: historiqueSelectedPeriod === period.key ? '2px solid #008EB7' : '1px solid #ddd',
                      borderRadius: '15px',
                      background: historiqueSelectedPeriod === period.key ? '#008EB7' : '#fff',
                      color: historiqueSelectedPeriod === period.key ? '#fff' : '#666',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* En mode Portefeuille, afficher le graphique "Depuis le début" (fixe) */}
            <PortfolioChart key="portefeuille-depuis-debut" filter="Depuis le début" />

            {/* Afficher le graphique virtuel en plus pour les autres périodes (masqué pour inception) */}
            {historiqueSelectedPeriod !== 'inception' && (
              <PortfolioChart filter="Historique" />
            )}

            {/* Portfolio list */}
            <div className="portfolio-list">
              {loading && portfolioData.length === 0 ? (
                <div className="loading-container">
                  <div className="loading-spinner">🔄</div>
                  <p>Chargement des données de marché...</p>
                </div>
              ) : error ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#d32f2f',
                  backgroundColor: '#ffebee',
                  borderRadius: '8px',
                  margin: '20px',
                  border: '1px solid #ffcdd2'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Erreur de connexion</div>
                  <div style={{ fontSize: '14px', marginBottom: '15px' }}>{error}</div>
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      loadPortfolioData();
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#d32f2f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                portfolioData.map((item, index) => (
                  <div key={index}>
                    {/* Informations ETF masquées en mode Historique */}
                    {activePage !== 'Historique' && (
                    <div
                      className="portfolio-item"
                      onClick={() => toggleETFChart(item.symbol)}
                      style={{ cursor: 'pointer' }}
                    >
                    <div className="item-left">
                      <div className="color-indicator"></div>
                      <div className="item-info">
                        <div className="item-name">
                          {item.name} <span style={{ color: '#666' }}>({item.portfolioWeight}% • {etfDescriptions[item.symbol]?.region})</span>
                        </div>
                        <div className="item-subtitle">{item.subtitle}</div>
                        {etfDescriptions[item.symbol] && (
                          <div className="etf-description" style={{
                            fontSize: '10px',
                            color: '#888',
                            marginTop: '2px',
                            marginBottom: '8px',
                            lineHeight: '1.2'
                          }}>
                            <div style={{ fontWeight: '500', marginBottom: '1px' }}>
                              {etfDescriptions[item.symbol].full} ({etfDescriptions[item.symbol].isin})
                            </div>
                            <div>
                              {etfDescriptions[item.symbol].description}
                            </div>
                          </div>
                        )}
                        <div className="item-details">
                          <span className="item-price">{item.price}</span>
                          {activeFilter === 'Aujourd\'hui' ? (
                            <span className="item-quantity">{item.previousCloseText || 'Clôture précédente indisponible'}</span>
                          ) : (
                            <span className="item-quantity">
                              {purchaseDates[item.symbol] ?
                                `Acheté le ${purchaseDates[item.symbol]} à ${purchasePrices[item.symbol]?.toFixed(2) || 'N/A'} EUR` :
                                item.purchaseText
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="item-center landscape-only">
                      <div className="quantity-display">
                        <div className="quantity-number">{item.quantity}</div>
                        <div className="quantity-label">unités</div>
                      </div>
                    </div>

                    <div className="item-right">
                      <div className="item-value">{item.value}</div>
                      <div className="performance-container">
                        <div className={`item-change ${
                          activeFilter === 'Aujourd\'hui' ? (item.dailyGain >= 0 ? 'positive' : 'negative') :
                          activeFilter === 'Depuis le début' ? (item.totalGainSincePurchase >= 0 ? 'positive' : 'negative') :
                          (item.positive ? 'positive' : 'negative')
                        }`}>
                          {activeFilter === 'Aujourd\'hui' ? (item.dailyChangeText || item.change) :
                           activeFilter === 'Depuis le début' ? (item.sinceBeginningChangeText || item.change) :
                           item.change}
                        </div>
                        <div className={`item-percentage ${
                          activeFilter === 'Aujourd\'hui' ? (item.dailyGain >= 0 ? 'positive' : 'negative') :
                          activeFilter === 'Depuis le début' ? (item.totalGainSincePurchase >= 0 ? 'positive' : 'negative') :
                          (item.positive ? 'positive' : 'negative')
                        }`}>
                          {activeFilter === 'Aujourd\'hui' ? (item.dailyPercentageText || item.percentage) :
                           activeFilter === 'Depuis le début' ? (item.sinceBeginningPercentageText || item.percentage) :
                           item.percentage}
                        </div>
                      </div>
                      {activeFilter === 'Depuis le début' && (
                        <>
                          <div className="initial-total-right">{item.initialTotalText}</div>
                          <div className="fees-disclaimer">{item.feesDisclaimer}</div>
                        </>
                      )}
                    </div>
                    </div>
                    )}

                    {/* Graphique affiché quand l'ETF est sélectionné ou en mode Portefeuille */}
                    {(selectedETFs.includes(item.symbol) || activePage === 'Portefeuille') && (
                      <div className="chart-section">
                        <StockChart
                          symbol={item.symbol}
                          etfName={item.name}
                          mode={activePage === 'Portefeuille' ? 'Historique' : activePage}
                          purchasePrice={purchasePrices[item.symbol]}
                          purchaseDate={purchaseDates[item.symbol]}
                          etfDescription={etfDescriptions[item.symbol]}
                          etfQuantity={etfQuantities[item.symbol]}
                        />
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                          <a
                            href={getYahooFinanceUrl(item.symbol)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: '#008EB7',
                              textDecoration: 'none',
                              fontSize: '12px'
                            }}
                          >
                            📊 Voir sur Yahoo Finance
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : activePage === 'Ordres' ? (
          <OrdersPage />
        ) : activePage === 'Actions' ? (
          <>
            {/* Sélecteur de période pour la page Actions */}
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '15px 20px',
              margin: '15px 0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Actions - Suivi
              </div>
              <div style={{
                display: 'flex',
                gap: '5px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {[
                  { key: '1d', label: '1J' },
                  { key: '5d', label: '5J' },
                  { key: '1m', label: '1M' },
                  { key: '3m', label: '3M' },
                  { key: '6m', label: '6M' },
                  { key: '1y', label: '1A' },
                  { key: '5y', label: '5A' },
                  { key: '10y', label: '10A' }
                ].map(period => (
                  <button
                    key={period.key}
                    onClick={() => {
                      setActionsSelectedPeriod(period.key);
                      try {
                        window.dispatchEvent(new CustomEvent('etf-period-changed', { detail: period.key }));
                      } catch (e) {
                        console.warn('Impossible de déclencher l\'événement période:', e);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      border: actionsSelectedPeriod === period.key ? '2px solid #008EB7' : '1px solid #ddd',
                      borderRadius: '15px',
                      background: actionsSelectedPeriod === period.key ? '#008EB7' : '#fff',
                      color: actionsSelectedPeriod === period.key ? '#fff' : '#666',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Graphiques pour toutes les actions suivies */}
            <div className="actions-list">
              {watchedStocks.map((stock, index) => (
                <div key={stock.symbol} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '10px',
                  margin: '8px 0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Graphique de l'action avec infos intégrées */}
                  <div className="stock-chart-container" style={{ position: 'relative' }}>
                    {/* En-tête minimal au-dessus du graphique */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      marginBottom: '6px',
                      padding: '0 5px'
                    }}>
                      <div style={{
                        background: '#e6f3ff',
                        color: '#008EB7',
                        padding: '3px 6px',
                        borderRadius: '8px',
                        fontSize: '9px',
                        fontWeight: '500'
                      }}>
                        {stock.category}
                      </div>
                    </div>

                    <StockChart
                      symbol={stock.symbol}
                      etfName={stock.name}
                      mode="Actions"
                      stockDescription={stock.description}
                    />

                    {/* Lien Yahoo Finance compact */}
                    <div style={{ textAlign: 'center', marginTop: '6px' }}>
                      <a
                        href={getYahooFinanceUrl(stock.symbol)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#008EB7',
                          textDecoration: 'none',
                          fontSize: '10px'
                        }}
                      >
                        📊 Yahoo Finance
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666' }}>
            <p>Page en cours de développement</p>
          </div>
        )}

        {/* Bottom info */}
        <div className="bottom-info">
          <p>Plus d'infos sur ces chiffres</p>
        </div>

        {/* Bottom navigation */}
        <div className="bottom-nav">
          <div className="nav-item active">
            <div className="nav-icon">💼</div>
            <span>Portefeuille</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">⭐</div>
            <span>Favoris</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🔍</div>
            <span>Rechercher</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🌐</div>
            <span>Actualités</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🔍</div>
            <span>Découvrir</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
