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
  const [gbpEurRate, setGbpEurRate] = useState(null); // Taux GBP/EUR

  // Liquidités
  const liquiditesAchat = 279255.94; // EUR (montant initial)
  const liquidites = 525478.07; // EUR (mis à jour 19/02/2026)

  // Données du portefeuille ChL (mis à jour 13/02/2026)
  // buyTotalUSD = montant total payé en USD (d'après bordereaux Bolero)
  const stocks = [
    { symbol: 'GOOGL', name: 'Alphabet Inc.', units: 150, buyPriceUSD: 292.86, buyTotalUSD: 43928.64, sold: true },
    { symbol: 'MU', name: 'Micron Technology, Inc.', units: 150, buyPriceUSD: 387.55, buyTotalUSD: 58132.53, sold: true },
    { symbol: 'SMSN.IL', name: 'Samsung Electronics GDR', units: 58, buyPriceUSD: 2076.33, buyTotalUSD: 120427.00 },
    { symbol: 'SNDK', name: 'Sandisk Corp.', units: 150, buyPriceUSD: 383.81, buyTotalUSD: 57572.13, sold: true },
    { symbol: 'WDC', name: 'Western Digital', units: 300, buyPriceUSD: 200.23, buyTotalUSD: 60070.19, sold: true },
    { symbol: 'PHAG.AS', name: 'WisdomTree Physical Silver', units: 700, buyPriceEUR: 77.18, buyTotalEUR: 54029.07, currency: 'EUR' },
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

      // Récupérer le taux GBP/EUR (pour Samsung)
      try {
        const gbpResponse = await axios.get(`${apiBase}/api/finance/GBPEUR=X`);
        const gbpData = gbpResponse.data.chart.result[0];
        const gbpRate = gbpData.meta.regularMarketPrice;
        setGbpEurRate(gbpRate);
        console.log(`Taux GBP/EUR: ${gbpRate}`);
      } catch (err) {
        console.error('Erreur taux GBP/EUR:', err);
        setGbpEurRate(1.20); // Taux par défaut
      }

      const promises = stocks.map(async (stock) => {
        try {
          const apiBase = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4001';
          const ticker = stock.yahooTicker || stock.symbol;
          const url = `${apiBase}/api/finance/${ticker}`;
          console.log(`Fetching ${stock.symbol} (${ticker}) from ${url}`);
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
    return stocks.reduce((sum, stock) => sum + (stock.buyTotalUSD || 0), 0);
  };

  const getTotalBuyEUR = () => {
    // Convertit le total USD en EUR au taux actuel + ajoute les actions en EUR
    if (!eurUsdRate) return null;
    const usdInEur = getTotalBuyUSD() / eurUsdRate;
    const eurDirect = stocks.reduce((sum, stock) => sum + (stock.buyTotalEUR || 0), 0);
    return usdInEur + eurDirect;
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

  // Totaux filtrés (uniquement positions actives, non vendues)
  const getActiveCurrentUSD = () => {
    return portfolio.reduce((sum, stock) => {
      if (stock.currency !== 'EUR' && !stock.sold) {
        return sum + (stock.totalUSD || 0);
      }
      return sum;
    }, 0);
  };

  const getActiveCurrentEUR = () => {
    if (!eurUsdRate) return null;
    const usdToEur = getActiveCurrentUSD() / eurUsdRate;
    const eurStocks = portfolio.reduce((sum, stock) => {
      if (stock.currency === 'EUR' && stock.currentPrice && !stock.sold) {
        return sum + (stock.currentPrice * stock.units);
      }
      return sum;
    }, 0);
    return usdToEur + eurStocks;
  };

  const getActiveBuyUSD = () => {
    return stocks.filter(s => !s.sold).reduce((sum, stock) => sum + (stock.buyTotalUSD || 0), 0);
  };

  const getActiveBuyEUR = () => {
    if (!eurUsdRate) return null;
    const usdInEur = getActiveBuyUSD() / eurUsdRate;
    const eurDirect = stocks.filter(s => !s.sold).reduce((sum, stock) => sum + (stock.buyTotalEUR || 0), 0);
    return usdInEur + eurDirect;
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
                  <th>Total achat</th>
                  <th>Total actuel</th>
                  <th>+/- (Devise)</th>
                  <th>+/- (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock, index) => {
                  // Gestion des devises: EUR, GBP, USD
                  const isEUR = stock.currency === 'EUR';
                  const isGBP = stock.currency === 'GBP' || stock.currency === 'GBp';

                  // Prix d'achat selon la devise
                  const buyPrice = stock.buyPriceEUR || stock.buyPriceGBP || stock.buyPriceUSD;

                  // Prix actuel (GBp = pence, diviser par 100 pour avoir GBP)
                  const currentPrice = isGBP && stock.currency === 'GBp'
                    ? stock.currentPrice / 100
                    : stock.currentPrice;

                  // Calcul du diff selon la devise
                  let diffValue = null;
                  let diffPercent = null;
                  let totalCurrentEUR = null;
                  let diffEUR = null;

                  if (isGBP && currentPrice && stock.buyPriceGBP) {
                    // Samsung en GBP
                    diffValue = (currentPrice - stock.buyPriceGBP) * stock.units;
                    diffPercent = ((currentPrice - stock.buyPriceGBP) / stock.buyPriceGBP * 100);
                    totalCurrentEUR = gbpEurRate ? currentPrice * stock.units * gbpEurRate : null;
                    diffEUR = gbpEurRate ? diffValue * gbpEurRate : null;
                  } else if (isEUR && currentPrice) {
                    // Titres en EUR
                    diffValue = (currentPrice - (stock.buyPriceEUR || 0)) * stock.units;
                    diffPercent = stock.buyPriceEUR ? ((currentPrice - stock.buyPriceEUR) / stock.buyPriceEUR * 100) : null;
                    totalCurrentEUR = currentPrice * stock.units;
                    diffEUR = diffValue;
                  } else if (currentPrice && stock.buyPriceUSD) {
                    // Titres en USD
                    diffValue = (currentPrice - stock.buyPriceUSD) * stock.units;
                    diffPercent = ((currentPrice - stock.buyPriceUSD) / stock.buyPriceUSD * 100);
                    totalCurrentEUR = eurUsdRate ? (currentPrice * stock.units) / eurUsdRate : null;
                    diffEUR = eurUsdRate ? diffValue / eurUsdRate : null;
                  }

                  const diffPercentEUR = diffPercent; // Même % car c'est la performance du titre
                  const portfolioPercent = stock.totalUSD && getTotalCurrentUSD() > 0 ? (stock.totalUSD / getTotalCurrentUSD() * 100) : null;
                  const soldStyle = stock.sold ? { opacity: 0.35, textDecoration: 'line-through' } : {};

                  return (
                    <tr key={index} style={soldStyle}>
                      <td className="etf-name">
                        <div>{stock.name} {stock.sold && <span style={{ fontSize: '0.65rem', color: '#ff9800', textDecoration: 'none', display: 'inline-block' }}>VENDU</span>}</div>
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
                        {formatNumber(buyPrice)} {isGBP && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}>GBP</span>}{isEUR && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}>EUR</span>}
                      </td>
                      <td className={`etf-price ${currentPrice && currentPrice > buyPrice ? 'price-higher' : 'price-lower'}`}>
                        {currentPrice ? (
                          <>
                            {formatNumber(currentPrice)}
                            {isGBP && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}> GBP</span>}
                            {isEUR && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}> EUR</span>}
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className="etf-sell-total">
                        {isEUR ? (
                          <div>{formatNumber(stock.buyTotalEUR)} EUR</div>
                        ) : (
                          <>
                            <div>{formatNumber(stock.buyTotalUSD)} USD</div>
                            {eurUsdRate && (
                              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                                {formatNumber(stock.buyTotalUSD / eurUsdRate)} EUR
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="etf-total">
                        {currentPrice ? (
                          <>
                            <div>{formatNumber(currentPrice * stock.units)} {isGBP ? 'GBP' : isEUR ? 'EUR' : 'USD'}</div>
                            {totalCurrentEUR !== null && (
                              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                                {formatNumber(totalCurrentEUR)} EUR
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className={diffValue !== null && diffValue >= 0 ? 'positive' : 'negative'}>
                        {diffValue !== null ? (
                          <>
                            <div>{diffValue >= 0 ? '+' : ''}{formatNumber(diffValue)} {isGBP ? 'GBP' : isEUR ? 'EUR' : 'USD'}</div>
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
                    <div>{formatNumber(getTotalBuyUSD())} USD</div>
                    {getTotalBuyEUR() && (
                      <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                        {formatNumber(getTotalBuyEUR())} EUR
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{formatNumber(getActiveCurrentUSD())} USD</div>
                    {getActiveCurrentEUR() && (
                      <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                        {formatNumber(getActiveCurrentEUR())} EUR
                      </div>
                    )}
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
                  <td className={getTotalCurrentEUR() && getTotalBuyEUR() && (getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? 'positive' : 'negative'}>
                    {eurUsdRate && getTotalCurrentEUR() && getTotalBuyEUR() ? (
                      <>
                        <div>
                          {(getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? '+' : ''}
                          {formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())} EUR
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
                  <td style={{ color: '#2196f3' }}>{formatNumber(liquiditesAchat)} EUR</td>
                  <td style={{ color: '#2196f3' }}>{formatNumber(liquidites)} EUR</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="total-row" style={{ fontSize: '0.8rem', backgroundColor: '#3a4048' }}>
                  <td colSpan="3" style={{ fontWeight: 'bold' }}>TOTAL GÉNÉRAL</td>
                  <td style={{ fontWeight: 'bold' }}>{formatNumber(getTotalBuyEUR() + liquiditesAchat)} EUR</td>
                  <td style={{ fontWeight: 'bold' }}>{getActiveCurrentEUR() && formatNumber(getActiveCurrentEUR() + liquidites)} EUR</td>
                  <td></td>
                  <td className={getTotalCurrentEUR() && getTotalBuyEUR() && (getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? 'positive' : 'negative'} style={{ fontWeight: 'bold' }}>
                    {eurUsdRate && getTotalCurrentEUR() && getTotalBuyEUR() ? (
                      <div>{(getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? '+' : ''}{formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())} EUR</div>
                    ) : <span className="error-text">N/A</span>}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              * Prix d'achat incluent frais et impôts | EUR/USD: {eurUsdRate ? eurUsdRate.toFixed(4) : 'N/A'} | GBP/EUR: {gbpEurRate ? gbpEurRate.toFixed(4) : 'N/A'}
            </p>
          </>
        )}

        <h1 style={{ fontSize: '1.5rem', marginTop: '40px', borderTop: '1px solid #3a3f47', paddingTop: '20px' }}>
          Old Portfolio (ChL)
          {!loading && getTotalCurrentEUR() && (
            <span style={{ fontSize: '1rem', color: '#9fa3a8', marginLeft: '10px' }}>
              ({formatNumber(getTotalCurrentEUR() + liquiditesAchat)} EUR)
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
                  <th>Total achat</th>
                  <th>Total actuel</th>
                  <th>+/- (Devise)</th>
                  <th>+/- (EUR)</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((stock, index) => {
                  const isEUR = stock.currency === 'EUR';
                  const isGBP = stock.currency === 'GBP' || stock.currency === 'GBp';
                  const buyPrice = stock.buyPriceEUR || stock.buyPriceGBP || stock.buyPriceUSD;
                  const currentPrice = isGBP && stock.currency === 'GBp'
                    ? stock.currentPrice / 100
                    : stock.currentPrice;

                  let diffValue = null;
                  let diffPercent = null;
                  let totalCurrentEUR = null;
                  let diffEUR = null;

                  if (isGBP && currentPrice && stock.buyPriceGBP) {
                    diffValue = (currentPrice - stock.buyPriceGBP) * stock.units;
                    diffPercent = ((currentPrice - stock.buyPriceGBP) / stock.buyPriceGBP * 100);
                    totalCurrentEUR = gbpEurRate ? currentPrice * stock.units * gbpEurRate : null;
                    diffEUR = gbpEurRate ? diffValue * gbpEurRate : null;
                  } else if (isEUR && currentPrice) {
                    diffValue = (currentPrice - (stock.buyPriceEUR || 0)) * stock.units;
                    diffPercent = stock.buyPriceEUR ? ((currentPrice - stock.buyPriceEUR) / stock.buyPriceEUR * 100) : null;
                    totalCurrentEUR = currentPrice * stock.units;
                    diffEUR = diffValue;
                  } else if (currentPrice && stock.buyPriceUSD) {
                    diffValue = (currentPrice - stock.buyPriceUSD) * stock.units;
                    diffPercent = ((currentPrice - stock.buyPriceUSD) / stock.buyPriceUSD * 100);
                    totalCurrentEUR = eurUsdRate ? (currentPrice * stock.units) / eurUsdRate : null;
                    diffEUR = eurUsdRate ? diffValue / eurUsdRate : null;
                  }

                  const diffPercentEUR = diffPercent;
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
                        {formatNumber(buyPrice)} {isGBP && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}>GBP</span>}{isEUR && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}>EUR</span>}
                      </td>
                      <td className={`etf-price ${currentPrice && currentPrice > buyPrice ? 'price-higher' : 'price-lower'}`}>
                        {currentPrice ? (
                          <>
                            {formatNumber(currentPrice)}
                            {isGBP && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}> GBP</span>}
                            {isEUR && <span style={{ fontSize: '0.7rem', color: '#9fa3a8' }}> EUR</span>}
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className="etf-sell-total">
                        {isEUR ? (
                          <div>{formatNumber(stock.buyTotalEUR)} EUR</div>
                        ) : (
                          <>
                            <div>{formatNumber(stock.buyTotalUSD)} USD</div>
                            {eurUsdRate && (
                              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                                {formatNumber(stock.buyTotalUSD / eurUsdRate)} EUR
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="etf-total">
                        {currentPrice ? (
                          <>
                            <div>{formatNumber(currentPrice * stock.units)} {isGBP ? 'GBP' : isEUR ? 'EUR' : 'USD'}</div>
                            {totalCurrentEUR !== null && (
                              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                                {formatNumber(totalCurrentEUR)} EUR
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="error-text">N/A</span>
                        )}
                      </td>
                      <td className={diffValue !== null && diffValue >= 0 ? 'positive' : 'negative'}>
                        {diffValue !== null ? (
                          <>
                            <div>{diffValue >= 0 ? '+' : ''}{formatNumber(diffValue)} {isGBP ? 'GBP' : isEUR ? 'EUR' : 'USD'}</div>
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
                    <div>{formatNumber(getTotalBuyUSD())} USD</div>
                    {getTotalBuyEUR() && (
                      <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                        {formatNumber(getTotalBuyEUR())} EUR
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{formatNumber(getTotalCurrentUSD())} USD</div>
                    {getTotalCurrentEUR() && (
                      <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                        {formatNumber(getTotalCurrentEUR())} EUR
                      </div>
                    )}
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
                  <td className={getTotalCurrentEUR() && getTotalBuyEUR() && (getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? 'positive' : 'negative'}>
                    {eurUsdRate && getTotalCurrentEUR() && getTotalBuyEUR() ? (
                      <>
                        <div>
                          {(getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? '+' : ''}
                          {formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())} EUR
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
                  <td style={{ color: '#2196f3' }}>{formatNumber(liquiditesAchat)} EUR</td>
                  <td style={{ color: '#2196f3' }}>{formatNumber(liquiditesAchat)} EUR</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr className="total-row" style={{ fontSize: '0.8rem', backgroundColor: '#3a4048' }}>
                  <td colSpan="3" style={{ fontWeight: 'bold' }}>TOTAL GÉNÉRAL</td>
                  <td style={{ fontWeight: 'bold' }}>{formatNumber(getTotalBuyEUR() + liquiditesAchat)} EUR</td>
                  <td style={{ fontWeight: 'bold' }}>{getTotalCurrentEUR() && formatNumber(getTotalCurrentEUR() + liquiditesAchat)} EUR</td>
                  <td></td>
                  <td className={getTotalCurrentEUR() && getTotalBuyEUR() && (getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? 'positive' : 'negative'} style={{ fontWeight: 'bold' }}>
                    {eurUsdRate && getTotalCurrentEUR() && getTotalBuyEUR() ? (
                      <div>{(getTotalCurrentEUR() - getTotalBuyEUR()) >= 0 ? '+' : ''}{formatNumber(getTotalCurrentEUR() - getTotalBuyEUR())} EUR</div>
                    ) : <span className="error-text">N/A</span>}
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '10px', textAlign: 'center' }}>
              * Prix d'achat incluent frais et impôts | EUR/USD: {eurUsdRate ? eurUsdRate.toFixed(4) : 'N/A'} | GBP/EUR: {gbpEurRate ? gbpEurRate.toFixed(4) : 'N/A'}
            </p>
          </>
        )}
      </header>
    </div>
  );
}

export default PortfolioChL;
