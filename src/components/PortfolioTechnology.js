import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function PortfolioTechnology() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eurUsdRate, setEurUsdRate] = useState(null);

  // Données du portefeuille Technology (mis à jour 30/12/2025)
  const stocks = [
    { symbol: 'LPTH', name: 'Latham Group', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Piscines et solutions outdoor' },
    { symbol: 'AAOI', name: 'Applied Optoelectronics', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Composants optiques data centers' },
    { symbol: 'ZETA', name: 'Zeta Global', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Plateforme marketing/données' },
    { symbol: 'MU', name: 'Micron Technology', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Mémoires DRAM/NAND - pilier IA' },
    { symbol: 'PATH', name: 'UiPath', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Automatisation logicielle RPA' },
    { symbol: 'VELO', name: 'Velocity Financial', units: 10, buyPriceUSD: 0, buyValueEUR: 0, description: 'Financement immobilier / crédit' }
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
          <button onClick={() => navigate('/technology/charts')} className="nav-button">Graphiques</button>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginTop: '20px' }}>
          Portfolio Technology
          {!loading && getTotalCurrentEUR() && (
            <span style={{ fontSize: '1rem', color: '#673ab7', marginLeft: '10px' }}>
              ({formatNumber(getTotalCurrentEUR())} EUR)
            </span>
          )}
        </h1>
        <p style={{ color: '#9fa3a8', marginBottom: '20px', fontSize: '0.85rem' }}>
          Suivi des valeurs technologiques (momentum hebdo) -
          <a
            href="https://finviz.com/screener.ashx?v=141&f=sec_technology,sh_avgvol_o1000,sh_price_o10,sh_relvol_o0.5,ta_volatility_wo3&o=-perf1w"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#673ab7' }}
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

export default PortfolioTechnology;
