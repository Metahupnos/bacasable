import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function PortfolioBasicMaterials() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eurUsdRate, setEurUsdRate] = useState(null);

  // Données du portefeuille Basic Materials (mis à jour 05/01/2026)
  const stocks = [
    { symbol: 'ERO', name: 'Ero Copper', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Producteur cuivre Amérique latine' },
    { symbol: 'ALB', name: 'Albemarle', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Leader mondial lithium' },
    { symbol: 'PAAS', name: 'Pan American Silver', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Producteur argent et or' },
    { symbol: 'CDE', name: 'Coeur Mining', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Métaux précieux' },
    { symbol: 'HYMC', name: 'Hycroft Mining', units: 2000, buyPriceUSD: 27.7256, buyValueEUR: 53553, description: 'Or/argent spéculatif' }
  ];

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';

      // Récupérer le taux EUR/USD
      try {
        const fxResponse = await axios.get(`${apiBase}/api/finance/EURUSD=X`);
        const fxData = fxResponse.data.chart.result[0];
        const rate = fxData.meta.regularMarketPrice;
        setEurUsdRate(rate);
      } catch (err) {
        console.error('Erreur taux EUR/USD:', err);
        setEurUsdRate(null);
      }

      const promises = stocks.map(async (stock) => {
        try {
          const url = `${apiBase}/api/finance/${stock.symbol}`;
          console.log(`Fetching ${stock.symbol} from ${url}`);
          const response = await axios.get(url);

          const data = response.data.chart.result[0];
          const currentPrice = data.meta.regularMarketPrice;

          return {
            ...stock,
            currentPrice: currentPrice,
            totalUSD: currentPrice * stock.units
          };
        } catch (err) {
          console.error(`Erreur pour ${stock.symbol}:`, err);
          return {
            ...stock,
            currentPrice: null,
            totalUSD: null,
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

  const getTotalCurrentUSD = () => {
    return portfolio.reduce((sum, stock) => {
      return sum + (stock.totalUSD || 0);
    }, 0);
  };

  const getTotalCurrentEUR = () => {
    if (!eurUsdRate) return null;
    return getTotalCurrentUSD() / eurUsdRate;
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
          <button onClick={() => navigate('/materials/charts')} className="nav-button">Graphiques</button>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginTop: '20px' }}>
          Portfolio Basic Materials
          {!loading && getTotalCurrentEUR() && (
            <span style={{ fontSize: '1rem', color: '#ff5722', marginLeft: '10px' }}>
              ({formatNumber(getTotalCurrentEUR())} EUR)
            </span>
          )}
        </h1>
        <p style={{ color: '#9fa3a8', marginBottom: '20px', fontSize: '0.85rem' }}>
          Suivi des valeurs minières et matériaux -
          <a
            href="https://finviz.com/screener.ashx?v=141&f=sec_basicmaterials,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.75,ta_volatility_wo3&o=-perf1w"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff5722' }}
          >
            Screener Finviz
          </a>
        </p>

        {loading && <p>Chargement des données...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && portfolio.length > 0 && (
          <>
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Description</th>
                  <th>Unités</th>
                  <th>Prix actuel</th>
                  <th>Valeur USD</th>
                  <th>Valeur EUR</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock, index) => {
                  const valueEUR = stock.totalUSD && eurUsdRate ? stock.totalUSD / eurUsdRate : null;

                  return (
                    <tr key={index}>
                      <td className="etf-name">
                        <div>{stock.name}</div>
                        <a
                          href={`https://finance.yahoo.com/quote/${stock.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="etf-symbol-link"
                        >
                          {stock.symbol}
                        </a>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#9fa3a8' }}>{stock.description}</td>
                      <td>{stock.units}</td>
                      <td>
                        {stock.currentPrice ? (
                          `${formatNumber(stock.currentPrice)} USD`
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td>
                        {stock.totalUSD ? (
                          `${formatNumber(stock.totalUSD)} USD`
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td>
                        {valueEUR ? (
                          `${formatNumber(valueEUR)} EUR`
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              Taux EUR/USD actuel : {eurUsdRate ? eurUsdRate.toFixed(4) : 'N/A'}
            </p>
          </>
        )}
      </header>
    </div>
  );
}

export default PortfolioBasicMaterials;
