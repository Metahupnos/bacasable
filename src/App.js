import React, { useState, useEffect } from 'react';
import './App.css';
import financeService from './services/financeApi';

function App() {
  const [portfolioData, setPortfolioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState({
    total: '615.232,42',
    change: '-1.108,05',
    changePercentage: '-0,18',
    positive: false
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadPortfolioData();

    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(loadPortfolioData, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const data = await financeService.getAllPortfolioData();
      setPortfolioData(data);

      // Calculer le total du portefeuille
      const balance = financeService.calculateTotalBalance(data);
      setTotalBalance(balance);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <span className="filter active">Valeur</span>
            <span className="filter">Depuis le début</span>
            <span className="filter">Aujourd'hui</span>
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
              <div key={index} className="portfolio-item">
                <div className="item-left">
                  <div className="color-indicator"></div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-subtitle">{item.subtitle}</div>
                    <div className="item-price">{item.price}</div>
                  </div>
                </div>
                <div className="item-right">
                  <div className="item-value">{item.value}</div>
                  <div className={`item-change ${item.positive ? 'positive' : 'negative'}`}>
                    {item.change}
                  </div>
                  <div className={`item-percentage ${item.positive ? 'positive' : 'negative'}`}>
                    {item.percentage}
                  </div>
                </div>
              </div>
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
