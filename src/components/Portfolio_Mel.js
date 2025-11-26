import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function Portfolio_Mel() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eurUsdRate, setEurUsdRate] = useState(null);

  // Données du portefeuille Mel - Actions US
  const stocks = [
    { symbol: 'LLY', name: 'Eli Lilly and Co.', units: 146, buyPriceUSD: 1109.94, buyValueEUR: 139892.30 },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', units: 135, buyPriceUSD: 323.44, buyValueEUR: 37693.72 },
    { symbol: 'IDXX', name: 'Idexx Laboratories', units: 42, buyPriceUSD: 766.68, buyValueEUR: 27797.44 }
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
        console.log(`Taux EUR/USD: ${rate}`);
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
          const currency = data.meta.currency;

          return {
            ...stock,
            currentPrice: currentPrice,
            currency: currency,
            totalUSD: currentPrice * stock.units
          };
        } catch (err) {
          console.error(`Erreur pour ${stock.symbol}:`, err);
          return {
            ...stock,
            currentPrice: null,
            currency: 'USD',
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
    return portfolio.reduce((sum, stock) => sum + (stock.totalUSD || 0), 0);
  };

  const getTotalBuyUSD = () => {
    return stocks.reduce((sum, stock) => sum + (stock.buyPriceUSD * stock.units), 0);
  };

  const getTotalBuyEUR = () => {
    return stocks.reduce((sum, stock) => sum + stock.buyValueEUR, 0);
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
          <button onClick={() => navigate('/mel/charts')} className="nav-button">Graphiques</button>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginTop: '20px' }}>Portfolio Mel</h1>

        {loading && <p>Chargement des données...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && portfolio.length > 0 && (
          <>
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Achat (USD)</th>
                  <th>Actuel (USD)</th>
                  <th>Total achat (EUR)</th>
                  <th>Total actuel</th>
                  <th>+/- (USD)</th>
                  <th>+/- (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock, index) => {
                  const diffUSD = stock.currentPrice ? (stock.currentPrice - stock.buyPriceUSD) * stock.units : null;
                  const diffPercent = stock.currentPrice ? ((stock.currentPrice - stock.buyPriceUSD) / stock.buyPriceUSD * 100) : null;
                  const totalCurrentEUR = stock.totalUSD && eurUsdRate ? stock.totalUSD / eurUsdRate : null;
                  const diffEUR = totalCurrentEUR ? totalCurrentEUR - stock.buyValueEUR : null;
                  const diffPercentEUR = diffEUR ? (diffEUR / stock.buyValueEUR * 100) : null;

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
                          {stock.symbol} ({stock.units})
                        </a>
                      </td>
                      <td className="etf-sell-price">
                        {formatNumber(stock.buyPriceUSD)}
                      </td>
                      <td className={`etf-price ${stock.currentPrice && stock.currentPrice > stock.buyPriceUSD ? 'price-higher' : 'price-lower'}`}>
                        {stock.currentPrice ? (
                          formatNumber(stock.currentPrice)
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className="etf-sell-total">
                        {formatNumber(stock.buyValueEUR)}
                      </td>
                      <td className="etf-total">
                        {stock.totalUSD ? (
                          <>
                            <div>{formatNumber(stock.totalUSD)} USD</div>
                            {totalCurrentEUR && (
                              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                                {formatNumber(totalCurrentEUR)} EUR
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className={diffUSD && diffUSD >= 0 ? 'positive' : 'negative'}>
                        {diffUSD !== null ? (
                          <>
                            <div>{diffUSD >= 0 ? '+' : ''}{formatNumber(diffUSD)}</div>
                            <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                              {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(2)}%
                            </div>
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className={diffEUR && diffEUR >= 0 ? 'positive' : 'negative'}>
                        {diffEUR !== null ? (
                          <>
                            <div>{diffEUR >= 0 ? '+' : ''}{formatNumber(diffEUR)}</div>
                            <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                              {diffPercentEUR >= 0 ? '+' : ''}{diffPercentEUR.toFixed(2)}%
                            </div>
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="total-row" style={{ fontSize: '0.75rem' }}>
                  <td colSpan="3">TOTAL</td>
                  <td>
                    <div>{formatNumber(getTotalBuyEUR())} EUR</div>
                    <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                      {formatNumber(getTotalBuyUSD())} USD
                    </div>
                  </td>
                  <td>
                    {getTotalCurrentEUR() && (
                      <div>{formatNumber(getTotalCurrentEUR())} EUR</div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                      {formatNumber(getTotalCurrentUSD())} USD
                    </div>
                  </td>
                  <td className={getTotalCurrentUSD() - getTotalBuyUSD() >= 0 ? 'positive' : 'negative'}>
                    <div>
                      {getTotalCurrentUSD() - getTotalBuyUSD() >= 0 ? '+' : ''}
                      {formatNumber(getTotalCurrentUSD() - getTotalBuyUSD())}
                    </div>
                    <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                      {((getTotalCurrentUSD() - getTotalBuyUSD()) / getTotalBuyUSD() * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className={getTotalCurrentEUR() && getTotalCurrentEUR() - getTotalBuyEUR() >= 0 ? 'positive' : 'negative'}>
                    {getTotalCurrentEUR() ? (
                      <>
                        <div>
                          {getTotalCurrentEUR() - getTotalBuyEUR() >= 0 ? '+' : ''}
                          {formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())}
                        </div>
                        <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                          {((getTotalCurrentEUR() - getTotalBuyEUR()) / getTotalBuyEUR() * 100).toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <span className="error-text">N/A</span>
                    )}
                  </td>
                </tr>
                <tr className="total-row" style={{ fontSize: '0.75rem', backgroundColor: '#2a3038' }}>
                  <td colSpan="3">LIQUIDITÉS</td>
                  <td style={{ color: '#2196f3' }}>4 042,50 EUR</td>
                  <td style={{ color: '#2196f3' }}>4 042,50 EUR</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="total-row" style={{ fontSize: '0.8rem', backgroundColor: '#3a4048' }}>
                  <td colSpan="3" style={{ fontWeight: 'bold' }}>TOTAL GÉNÉRAL</td>
                  <td style={{ fontWeight: 'bold' }}>{formatNumber(getTotalBuyEUR() + 4042.50)} EUR</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {getTotalCurrentEUR() && formatNumber(getTotalCurrentEUR() + 4042.50)} EUR
                  </td>
                  <td></td>
                  <td className={getTotalCurrentEUR() && getTotalCurrentEUR() - getTotalBuyEUR() >= 0 ? 'positive' : 'negative'} style={{ fontWeight: 'bold' }}>
                    {getTotalCurrentEUR() ? (
                      <>
                        <div>
                          {getTotalCurrentEUR() - getTotalBuyEUR() >= 0 ? '+' : ''}
                          {formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())} EUR
                        </div>
                      </>
                    ) : (
                      <span className="error-text">N/A</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              * Prix d'achat via Bolero en USD | Taux EUR/USD actuel : {eurUsdRate ? eurUsdRate.toFixed(4) : 'N/A'}
            </p>
          </>
        )}
      </header>
    </div>
  );
}

export default Portfolio_Mel;
