import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

function PortfolioChL() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eurUsdRate, setEurUsdRate] = useState(null); // Taux EUR/USD

  // Liquidités (mis à jour 05/01/2026 - Après vente LLY et achat HYMC)
  const liquidites = 198306.83;

  // Données du portefeuille ChL (mis à jour 05/01/2026 - Après vente LLY et achat HYMC)
  const stocks = [
    { symbol: 'SMSN.IL', name: 'Samsung Electronics GDR', units: 58, buyPriceUSD: 2076.33, buyValueEUR: 115795 },
    { symbol: 'GOOG', name: 'Alphabet Inc. (Class A)', units: 350, buyPriceUSD: 291.466, buyValueEUR: 87535 },
    { symbol: 'HYMC', name: 'Hycroft Mining', units: 2000, buyPriceUSD: 27.7256, buyValueEUR: 53553 },
    { symbol: 'WDC', name: 'Western Digital Corp.', units: 400, buyPriceUSD: 163.44213, buyValueEUR: 55832 },
    { symbol: 'AMAT', name: 'Applied Materials Inc.', units: 240, buyPriceUSD: 251.98396, buyValueEUR: 51647 },
    { symbol: 'PHAGA.XD', name: 'WisdomTree Physical Silver', units: 900, buyPriceEUR: 55.43, buyValueEUR: 49883.28, currency: 'EUR' },
    { symbol: 'G2X.DE', name: 'VanEck Gold Miners ETF', units: 600, buyPriceEUR: 81.62, buyValueEUR: 48970.62, currency: 'EUR' }
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
          const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
          const url = `${apiBase}/api/finance/${stock.symbol}`;
          console.log(`Fetching ${stock.symbol} from ${url}`);
          const response = await axios.get(url);

          const data = response.data.chart.result[0];
          const currentPrice = data.meta.regularMarketPrice;
          const currency = data.meta.currency;

          return {
            ...stock,
            currentPrice: currentPrice,
            currency: stock.currency || currency,
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
    // Ne compte que les actions en USD
    return portfolio.reduce((sum, stock) => {
      if (stock.currency !== 'EUR') {
        return sum + (stock.totalUSD || 0);
      }
      return sum;
    }, 0);
  };

  const getTotalBuyUSD = () => {
    return stocks.reduce((sum, stock) => {
      if (stock.buyPriceUSD) {
        return sum + (stock.buyPriceUSD * stock.units);
      }
      return sum;
    }, 0);
  };

  const getTotalBuyEUR = () => {
    return stocks.reduce((sum, stock) => sum + stock.buyValueEUR, 0);
  };

  const getTotalCurrentEUR = () => {
    if (!eurUsdRate) return null;
    // Convertit USD en EUR + ajoute les actions déjà en EUR
    const usdToEur = getTotalCurrentUSD() / eurUsdRate;
    const eurStocks = portfolio.reduce((sum, stock) => {
      if (stock.currency === 'EUR' && stock.currentPrice) {
        return sum + (stock.currentPrice * stock.units);
      }
      return sum;
    }, 0);
    return usdToEur + eurStocks;
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
          <button onClick={() => navigate('/chl/charts')} className="nav-button">Graphiques</button>
          <button onClick={() => navigate('/etf/sales')} className="nav-button">Ordres</button>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginTop: '20px' }}>
          Portfolio ChL
          {!loading && getTotalCurrentEUR() && (
            <span style={{ fontSize: '1rem', color: '#61dafb', marginLeft: '10px' }}>
              ({formatNumber(getTotalCurrentEUR() + liquidites)} EUR)
            </span>
          )}
        </h1>

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
                  // Gestion spéciale pour les titres en EUR (G2X.DE)
                  const buyPrice = stock.buyPriceEUR || stock.buyPriceUSD;
                  const isEUR = stock.currency === 'EUR';

                  const diffUSD = stock.currentPrice && !isEUR ? (stock.currentPrice - stock.buyPriceUSD) * stock.units : null;
                  const diffPercent = stock.currentPrice && buyPrice ? ((stock.currentPrice - buyPrice) / buyPrice * 100) : null;

                  const totalCurrentEUR = isEUR && stock.currentPrice
                    ? stock.currentPrice * stock.units
                    : (stock.totalUSD && eurUsdRate ? stock.totalUSD / eurUsdRate : null);

                  const diffEUR = totalCurrentEUR && stock.buyValueEUR
                    ? totalCurrentEUR - stock.buyValueEUR
                    : null;
                  const diffPercentEUR = diffEUR && stock.buyValueEUR ? (diffEUR / stock.buyValueEUR * 100) : null;
                  const portfolioPercent = stock.totalUSD && getTotalCurrentUSD() > 0 ? (stock.totalUSD / getTotalCurrentUSD() * 100) : null;

                  return (
                    <tr key={index}>
                      <td className="etf-name">
                        <div>{stock.name}</div>
                        <a
                          href={`https://finance.yahoo.com/quote/${stock.symbol}/analysis/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="etf-symbol-link"
                        >
                          {stock.symbol} ({stock.units} unités) {portfolioPercent !== null && <span style={{ color: '#61dafb' }}>• {portfolioPercent.toFixed(1)}%</span>}
                        </a>
                      </td>
                      <td className="etf-sell-price">
                        {formatNumber(buyPrice)}
                      </td>
                      <td className={`etf-price ${stock.currentPrice && stock.currentPrice > buyPrice ? 'price-higher' : 'price-lower'}`}>
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
                        {stock.totalUSD || (isEUR && totalCurrentEUR) ? (
                          <>
                            <div>{formatNumber(totalCurrentEUR)} EUR</div>
                            {!isEUR && stock.totalUSD && (
                              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                                {formatNumber(stock.totalUSD)} USD
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className={isEUR ? '' : (diffUSD && diffUSD >= 0 ? 'positive' : 'negative')}>
                        {isEUR ? (
                          <div style={{ color: '#9fa3a8' }}>N/A</div>
                        ) : diffUSD !== null ? (
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
                  <td style={{ color: '#2196f3' }}>{formatNumber(liquidites)} EUR</td>
                  <td style={{ color: '#2196f3' }}>{formatNumber(liquidites)} EUR</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="total-row" style={{ fontSize: '0.8rem', backgroundColor: '#3a4048' }}>
                  <td colSpan="3" style={{ fontWeight: 'bold' }}>TOTAL GÉNÉRAL</td>
                  <td style={{ fontWeight: 'bold' }}>{formatNumber(getTotalBuyEUR() + liquidites)} EUR</td>
                  <td style={{ fontWeight: 'bold' }}>{getTotalCurrentEUR() && formatNumber(getTotalCurrentEUR() + liquidites)} EUR</td>
                  <td></td>
                  <td className={getTotalCurrentEUR() && getTotalCurrentEUR() - getTotalBuyEUR() >= 0 ? 'positive' : 'negative'} style={{ fontWeight: 'bold' }}>
                    {getTotalCurrentEUR() ? (
                      <div>{getTotalCurrentEUR() - getTotalBuyEUR() >= 0 ? '+' : ''}{formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())} EUR</div>
                    ) : <span className="error-text">N/A</span>}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              * Prix d'achat incluent frais et impôts | Taux EUR/USD actuel : {eurUsdRate ? eurUsdRate.toFixed(4) : 'N/A'}
            </p>
          </>
        )}
      </header>
    </div>
  );
}

export default PortfolioChL;
