import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function PortfolioETF() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Données de votre portefeuille avec prix de vente
  const etfs = [
    { symbol: 'CSPX.AS', name: 'iShares Core S&P 500', units: 354, sellPrice: 630.111 },
    { symbol: 'IWDA.AS', name: 'iShares Core MSCI World', units: 1424, sellPrice: 111.23 },
    { symbol: 'EMIM.AS', name: 'iShares Core MSCI EM', units: 2567, sellPrice: 38.4 },
    { symbol: 'SC0J.DE', name: 'Invesco MSCI World', units: 796, sellPrice: 119.37 },
    { symbol: 'EQEU.DE', name: 'Invesco Nasdaq-100 Acc', units: 144, sellPrice: 451.4 }
  ];

  useEffect(() => {
    fetchPrices();
    // Rafraîchir toutes les 60 secondes
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const promises = etfs.map(async (etf) => {
        try {
          // Utiliser l'API Netlify en production, localhost en développement
          const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
          const url = `${apiBase}/api/finance/${etf.symbol}`;
          console.log(`Fetching ${etf.symbol} from ${url}`);
          const response = await axios.get(url);
          console.log(`Response for ${etf.symbol}:`, response.data);

          const data = response.data.chart.result[0];
          const currentPrice = data.meta.regularMarketPrice;
          const currency = data.meta.currency;

          console.log(`${etf.symbol}: ${currentPrice} ${currency}`);

          return {
            ...etf,
            currentPrice: currentPrice,
            currency: currency,
            total: currentPrice * etf.units
          };
        } catch (err) {
          console.error(`Erreur pour ${etf.symbol}:`, err);
          console.error(`Erreur détaillée:`, err.response?.data || err.message);
          return {
            ...etf,
            currentPrice: null,
            currency: 'EUR',
            total: null,
            error: 'Erreur de chargement'
          };
        }
      });

      const results = await Promise.all(promises);
      setPortfolio(results);
      setError(null);
    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const getTotalValue = () => {
    return portfolio.reduce((sum, etf) => sum + (etf.total || 0), 0);
  };

  const getTotalSellValue = () => {
    return etfs.reduce((sum, etf) => sum + (etf.sellPrice * etf.units), 0);
  };

  const getTotalSellNetValue = () => {
    return getTotalSellValue() * 0.9973; // 0.27% de frais (0.15% courtage + 0.12% taxe)
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="nav-buttons">
          <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
          <button onClick={fetchPrices} className="nav-button">Actualiser</button>
          <button onClick={() => navigate('/etf/charts')} className="nav-button">Graphiques</button>
          <button onClick={() => navigate('/etf/sales')} className="nav-button">Ordres</button>
        </div>

        {loading && <p>Chargement des données...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && portfolio.length > 0 && (
          <>
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>ETF</th>
                  <th>Vente</th>
                  <th>Actuel</th>
                  <th>Total vente</th>
                  <th>Total vente net</th>
                  <th>Total actuel</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((etf, index) => (
                  <tr key={index}>
                    <td className="etf-name">
                      <div>{etf.name}</div>
                      <a
                        href={`https://finance.yahoo.com/quote/${etf.symbol}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="etf-symbol-link"
                      >
                        {etf.symbol} ({etf.units} unités)
                      </a>
                    </td>
                    <td className="etf-sell-price">
                      {formatNumber(etf.sellPrice)}
                    </td>
                    <td className={`etf-price ${etf.currentPrice && etf.currentPrice > etf.sellPrice ? 'price-higher' : 'price-lower'}`}>
                      {etf.currentPrice ? (
                        formatNumber(etf.currentPrice)
                      ) : (
                        <span className="error-text">N/A</span>
                      )}
                    </td>
                    <td className="etf-sell-total">
                      {formatNumber(etf.sellPrice * etf.units)} EUR
                    </td>
                    <td className="etf-sell-total">
                      {formatNumber(etf.sellPrice * etf.units * 0.9973)} EUR
                    </td>
                    <td className="etf-total">
                      {etf.total ? (
                        `${formatNumber(etf.total)} ${etf.currency}`
                      ) : (
                        <span className="error-text">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="total-row" style={{ fontSize: '0.75rem' }}>
                  <td colSpan="3">TOTAL</td>
                  <td>{formatNumber(getTotalSellValue())} EUR</td>
                  <td>{formatNumber(getTotalSellNetValue())} EUR</td>
                  <td>{formatNumber(getTotalValue())} EUR</td>
                </tr>
                <tr className="total-row difference-row" style={{ fontSize: '0.75rem' }}>
                  <td colSpan="3">DIFFÉRENCE</td>
                  <td>
                    <div className={getTotalValue() - getTotalSellValue() >= 0 ? 'positive' : 'negative'}>
                      {formatNumber(getTotalValue() - getTotalSellValue())} EUR
                    </div>
                    <div className={getTotalValue() - getTotalSellValue() >= 0 ? 'positive' : 'negative'} style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                      {((getTotalValue() - getTotalSellValue()) / getTotalSellValue() * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td>
                    <div className={getTotalValue() - getTotalSellNetValue() >= 0 ? 'positive' : 'negative'}>
                      {formatNumber(getTotalValue() - getTotalSellNetValue())} EUR
                    </div>
                    <div className={getTotalValue() - getTotalSellNetValue() >= 0 ? 'positive' : 'negative'} style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                      {((getTotalValue() - getTotalSellNetValue()) / getTotalSellNetValue() * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td>
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              * Total vente net = Total vente - 0.27% de frais (0.15% courtage + 0.12% taxe de bourse)
            </p>
          </>
        )}
      </header>
    </div>
  );
}

export default PortfolioETF;
