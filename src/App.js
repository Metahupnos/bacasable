import React, { useState, useEffect } from 'react';
import './App.css';
import financeService from './services/financeApi';

function App() {
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Valeur');
  const [totalBalance, setTotalBalance] = useState({
    total: '615.232,42',
    change: '-1.108,05',
    changePercentage: '-0,18',
    positive: false
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const data = await financeService.getAllPortfolioData();
      setPortfolioData(data);

      // Calculer le total selon le filtre actif
      let balance;
      if (activeFilter === 'Depuis le début') {
        balance = financeService.calculateSinceInception(data);
      } else if (activeFilter === 'Aujourd\'hui') {
        balance = financeService.calculateTodayBalance(data);
      } else {
        balance = financeService.calculateTotalBalance(data);
      }
      setTotalBalance(balance);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();

    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadPortfolioData, 30000);

    return () => clearInterval(interval);
  }, [activeFilter, loadPortfolioData]); // Se déclencher quand le filtre change

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getYahooFinanceUrl = (symbol) => {
    return `https://finance.yahoo.com/quote/${symbol}`;
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    // loadPortfolioData sera appelé automatiquement par useEffect
  };
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
              {loading ? '🔄' : '⚙️'}
            </div>
            <div className="balance-info">
              <h1 className="total-balance">{totalBalance.total} EUR</h1>
              <div className="balance-change">
                <span className="change-amount">
                  {totalBalance.positive ? '+' : ''}{totalBalance.change} EUR
                </span>
                <span className={`change-percentage ${totalBalance.positive ? 'positive' : 'negative'}`}>
                  {totalBalance.positive ? '+' : ''}{totalBalance.changePercentage}%
                </span>
              </div>
            </div>
            <div className="mail-icon">✉️</div>
          </div>

          {/* Navigation tabs */}
          <div className="nav-tabs">
            <div className="tab active">Portefeuille</div>
            <div className="tab">Comptes</div>
            <div className="tab">Ordres</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="sort-icon">↕️</div>
          <div className="filter-options">
            <span
              className={`filter ${activeFilter === 'Valeur' ? 'active' : ''}`}
              onClick={() => handleFilterChange('Valeur')}
            >
              Valeur
            </span>
            <span
              className={`filter ${activeFilter === 'Depuis le début' ? 'active' : ''}`}
              onClick={() => handleFilterChange('Depuis le début')}
            >
              Depuis le début
            </span>
            <span
              className={`filter ${activeFilter === 'Aujourd\'hui' ? 'active' : ''}`}
              onClick={() => handleFilterChange('Aujourd\'hui')}
            >
              Aujourd'hui
            </span>
          </div>
        </div>

        {/* Portfolio list */}
        <div className="portfolio-list">
          {loading && portfolioData.length === 0 ? (
            <div className="loading-container">
              <div className="loading-spinner">🔄</div>
              <p>Chargement des données de marché...</p>
            </div>
          ) : (
            portfolioData.map((item, index) => (
              <a
                key={index}
                href={getYahooFinanceUrl(item.symbol)}
                target="_blank"
                rel="noopener noreferrer"
                className="portfolio-item"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="item-left">
                  <div className="color-indicator"></div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-subtitle">{item.subtitle}</div>
                    <div className="item-details">
                      <span className="item-price">{item.price}</span>
                      <span className="item-quantity">{item.quantityText}</span>
                    </div>
                    <div className="purchase-info">
                      {activeFilter === 'Aujourd\'hui' ? (
                        <>
                          <span className="purchase-price">{item.openText || 'Ouverture indisponible'}</span>
                          <span className={`purchase-gain ${item.dailyGain >= 0 ? 'positive' : 'negative'}`}>
                            {item.dailyGainText || 'Variation indisponible'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="purchase-price">{item.purchaseText}</span>
                          <span className={`purchase-gain ${item.totalGainSincePurchase >= 0 ? 'positive' : 'negative'}`}>
                            {item.gainSincePurchaseText}
                          </span>
                        </>
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
                    <div className={`item-change ${item.positive ? 'positive' : 'negative'}`}>
                      {item.change}
                    </div>
                    <div className={`item-percentage ${item.positive ? 'positive' : 'negative'}`}>
                      {item.percentage}
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>

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
