import React, { useState, useEffect, useCallback } from 'react';
import StockChart from './StockChart';

function TestPage() {
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioComparison, setPortfolioComparison] = useState(null);
  const [currentValue, setCurrentValue] = useState(null);

  // Configuration du portefeuille avec prix d'achat réels (mise à jour après vente EQQQ.DE le 19/09)
  const portfolioRealData = [
    { symbol: 'CSPX.AS', name: 'IS CO S&P500 U.ETF USD', quantity: 354, purchasePrice: 594.966, totalPurchase: 210617.97, purchaseDate: '2025-08-29' },
    { symbol: 'IWDA.AS', name: 'ISHAR.III PLC CORE MSCI WORLD', quantity: 1424, purchasePrice: 105.4987218487395, totalPurchase: 150227.26, purchaseDate: '2025-08-29' },
    { symbol: 'EMIM.AS', name: 'ISHARES PLC CORE MSC E.M.IM UC', quantity: 2567, purchasePrice: 34.979, totalPurchase: 89791.09, purchaseDate: '2025-08-29' },
    { symbol: 'SC0J.DE', name: 'INVESCO MKS PLC MSCI WORLD U.ETF', quantity: 796, purchasePrice: 113.21626, totalPurchase: 90120.14, purchaseDate: '2025-08-29' },
    { symbol: 'EQEU.DE', name: 'INVESCO EQQQ NASDAQ-100', quantity: 144, purchasePrice: 428.57049, totalPurchase: 61714.15, purchaseDate: '2025-09-19' }
  ];

  // Premier ETF du portefeuille : CSPX.AS (ISH COR S&P500)
  const testSymbol = 'CSPX.AS';
  const testName = 'ISH COR S&P500';

  const fetchCurrentPortfolioValue = useCallback(async () => {
    try {
      console.log('💰 Calcul valeur actuelle du portefeuille...');

      let totalCurrentValue = 0;
      let totalPurchaseValue = 0;
      const currentValues = [];

      for (const etf of portfolioRealData) {
        try {
          // Récupérer le prix actuel (dernier prix de clôture)
          const response = await fetch(`http://localhost:4001/api/history/${etf.symbol}/1d`);
          if (!response.ok) continue;

          const data = await response.json();
          const result = data.chart?.result?.[0];
          if (!result) continue;

          const prices = result.indicators?.quote?.[0]?.close || [];
          const currentPrice = prices[prices.length - 1]; // Dernier prix de clôture

          if (currentPrice) {
            const currentValueForETF = currentPrice * etf.quantity;
            const purchaseValueForETF = etf.totalPurchase;
            const gainForETF = currentValueForETF - purchaseValueForETF;
            const gainPercentageForETF = (gainForETF / purchaseValueForETF) * 100;

            totalCurrentValue += currentValueForETF;
            totalPurchaseValue += purchaseValueForETF;

            currentValues.push({
              ...etf,
              currentPrice: currentPrice,
              currentValue: currentValueForETF,
              gain: gainForETF,
              gainPercentage: gainPercentageForETF
            });

            console.log(`💰 ${etf.symbol}: ${currentPrice.toFixed(2)} EUR × ${etf.quantity} = ${currentValueForETF.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR`);
          }
        } catch (err) {
          console.error(`Erreur pour ${etf.symbol}:`, err);
        }
      }

      // Ajouter l'investissement initial EQQQ.DE (vendu le 19/09)
      const eqqqInitialInvestment = 60040.20 + 122.05; // Achat + frais
      totalPurchaseValue += eqqqInitialInvestment;

      const totalGain = totalCurrentValue - totalPurchaseValue;
      const totalGainPercentage = (totalGain / totalPurchaseValue) * 100;

      const portfolioValue = {
        totalCurrentValue,
        totalPurchaseValue,
        totalGain,
        totalGainPercentage,
        etfValues: currentValues,
        eqqqInitialInvestment
      };

      setCurrentValue(portfolioValue);

      console.log(`💰 Valeur totale actuelle: ${totalCurrentValue.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR`);
      console.log(`💰 Investissement total: ${totalPurchaseValue.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR`);
      console.log(`💰 Plus-value totale: ${totalGain.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR (${totalGainPercentage.toFixed(2)}%)`);

    } catch (err) {
      console.error('Erreur calcul valeur actuelle:', err);
    }
  }, []);

  const fetchPortfolioComparison = useCallback(async () => {
    try {
      console.log('🧪 Comparaison portefeuille: Récupération des données historiques...');

      const comparisons = [];

      for (const etf of portfolioRealData) {
        // Inclure tous les ETF du portefeuille
          try {
            // Récupérer les données historiques du 29 août
            const response = await fetch(`http://localhost:4001/api/history/${etf.symbol}/3m`);
            if (!response.ok) continue;

            const data = await response.json();
            const result = data.chart?.result?.[0];
            if (!result) continue;

            const timestamps = result.timestamp || [];
            const prices = result.indicators?.quote?.[0]?.close || [];
            const opens = result.indicators?.quote?.[0]?.open || [];

            // Trouver les données à la date d'achat de cet ETF
            const targetDate = new Date(etf.purchaseDate);
            let historicalClose = null;
            let historicalOpen = null;

            for (let i = 0; i < timestamps.length; i++) {
              const date = new Date(timestamps[i] * 1000);
              if (date.toDateString() === targetDate.toDateString()) {
                historicalClose = prices[i];
                historicalOpen = opens[i];
                break;
              }
            }

            const comparison = {
              ...etf,
              historicalClose,
              historicalOpen,
              closeVsPurchase: historicalClose ? ((historicalClose - etf.purchasePrice) / etf.purchasePrice * 100) : null,
              openVsPurchase: historicalOpen ? ((historicalOpen - etf.purchasePrice) / etf.purchasePrice * 100) : null,
              valueAtClose: historicalClose ? historicalClose * etf.quantity : null,
              valueAtOpen: historicalOpen ? historicalOpen * etf.quantity : null
            };

            comparisons.push(comparison);
            console.log(`🧪 ${etf.symbol}:`);
            console.log(`   Prix d'achat: ${etf.purchasePrice.toFixed(2)} EUR`);
            console.log(`   Prix ouverture ${etf.purchaseDate}: ${historicalOpen?.toFixed(2) || 'N/A'} EUR`);
            console.log(`   Prix clôture ${etf.purchaseDate}: ${historicalClose?.toFixed(2) || 'N/A'} EUR`);

          } catch (err) {
            console.error(`Erreur pour ${etf.symbol}:`, err);
          }
      }

      setPortfolioComparison(comparisons);

    } catch (err) {
      console.error('Erreur comparaison portefeuille:', err);
    }
  }, []);

  const fetchTestData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🧪 Test: Récupération des données pour', testSymbol);

      // Test de l'API historique pour 1 mois
      const response = await fetch(`http://localhost:4001/api/history/${testSymbol}/1m`);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('🧪 Test: Données reçues:', data);

      // Analyser les données reçues
      const result = data.chart?.result?.[0];
      if (!result) {
        throw new Error('Données invalides reçues de Yahoo Finance');
      }

      const timestamps = result.timestamp || [];
      const prices = result.indicators?.quote?.[0]?.close || [];

      console.log('🧪 Test: Points de données:', timestamps.length);
      console.log('🧪 Test: Premier prix:', prices[0]);
      console.log('🧪 Test: Dernier prix:', prices[prices.length - 1]);

      setTestData({
        symbol: testSymbol,
        name: testName,
        dataPoints: timestamps.length,
        firstPrice: prices[0],
        lastPrice: prices[prices.length - 1],
        rawData: data
      });

    } catch (err) {
      console.error('🧪 Test: Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [testSymbol]);

  useEffect(() => {
    fetchTestData();
    fetchPortfolioComparison();
    fetchCurrentPortfolioValue();
  }, [fetchTestData, fetchPortfolioComparison, fetchCurrentPortfolioValue]);

  return (
    <div className="test-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test des Graphiques Financiers</h1>

      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2>Test: {testName} ({testSymbol})</h2>
        <p>Ce test vérifie le bon fonctionnement de l'API Yahoo Finance et des graphiques.</p>

        <button
          onClick={fetchTestData}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Relancer le test
        </button>
        <button
          onClick={fetchPortfolioComparison}
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔍 Comparer prix d'achat vs historique
        </button>
        <button
          onClick={fetchCurrentPortfolioValue}
          style={{
            padding: '8px 16px',
            background: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          💰 Calculer valeur actuelle
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
          <p>Chargement des données de test...</p>
        </div>
      )}

      {error && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>❌ Erreur de test</h3>
          <p>{error}</p>
          <p><strong>Solutions possibles:</strong></p>
          <ul>
            <li>Vérifier que le proxy finance fonctionne sur localhost:4001</li>
            <li>Attendre quelques secondes et relancer le test</li>
            <li>Vérifier la connexion internet</li>
          </ul>
        </div>
      )}

      {testData && !loading && !error && (
        <div>
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>✅ Test réussi</h3>
            <p><strong>Symbole:</strong> {testData.symbol}</p>
            <p><strong>Points de données:</strong> {testData.dataPoints}</p>
            <p><strong>Premier prix:</strong> {testData.firstPrice?.toFixed(2)} EUR</p>
            <p><strong>Dernier prix:</strong> {testData.lastPrice?.toFixed(2)} EUR</p>
            <p><strong>Variation:</strong> {((testData.lastPrice - testData.firstPrice) / testData.firstPrice * 100).toFixed(2)}%</p>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3>📈 Graphique de test (1 mois)</h3>
            <StockChart symbol={testSymbol} etfName={testName} />
          </div>
        </div>
      )}

      {/* Comparaison des prix d'achat vs historique */}
      {portfolioComparison && portfolioComparison.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h3>📊 Comparaison Prix d'achat vs Prix historiques (Portefeuille complet)</h3>

          {portfolioComparison.map((etf, index) => (
            <div key={index} style={{
              marginBottom: '15px',
              padding: '10px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}>
              <h4>{etf.name} ({etf.symbol})</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px' }}>
                <div>
                  <strong>Prix d'achat réel:</strong><br/>
                  {etf.purchasePrice.toFixed(2)} EUR
                </div>
                <div>
                  <strong>Prix ouverture {etf.purchaseDate.split('-').slice(1).join('/')}:</strong><br/>
                  {etf.historicalOpen?.toFixed(2) || 'N/A'} EUR
                  {etf.openVsPurchase && (
                    <span style={{ color: etf.openVsPurchase >= 0 ? 'green' : 'red', marginLeft: '5px' }}>
                      ({etf.openVsPurchase > 0 ? '+' : ''}{etf.openVsPurchase.toFixed(2)}%)
                    </span>
                  )}
                </div>
                <div>
                  <strong>Prix clôture {etf.purchaseDate.split('-').slice(1).join('/')}:</strong><br/>
                  {etf.historicalClose?.toFixed(2) || 'N/A'} EUR
                  {etf.closeVsPurchase && (
                    <span style={{ color: etf.closeVsPurchase >= 0 ? 'green' : 'red', marginLeft: '5px' }}>
                      ({etf.closeVsPurchase > 0 ? '+' : ''}{etf.closeVsPurchase.toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Valeur totale:</strong>
                Achat: {etf.totalPurchase.toLocaleString('fr-FR')} EUR |
                À l'ouverture: {etf.valueAtOpen?.toLocaleString('fr-FR') || 'N/A'} EUR |
                À la clôture: {etf.valueAtClose?.toLocaleString('fr-FR') || 'N/A'} EUR
              </div>
            </div>
          ))}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#d1ecf1',
            borderRadius: '6px',
            border: '1px solid #bee5eb'
          }}>
            <h4>💰 Total Portefeuille Actuel (5 ETF)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <div>
                <strong>Valeur d'achat:</strong><br/>
                {portfolioComparison.reduce((sum, etf) => sum + etf.totalPurchase, 0).toLocaleString('fr-FR')} EUR
              </div>
              <div>
                <strong>À l'ouverture 29/08:</strong><br/>
                {portfolioComparison.reduce((sum, etf) => sum + (etf.valueAtOpen || 0), 0).toLocaleString('fr-FR')} EUR
              </div>
              <div>
                <strong>À la clôture 29/08:</strong><br/>
                {portfolioComparison.reduce((sum, etf) => sum + (etf.valueAtClose || 0), 0).toLocaleString('fr-FR')} EUR
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Valeur actuelle du portefeuille */}
      {currentValue && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #28a745'
        }}>
          <h3>💰 Valeur Actuelle du Portefeuille (5 ETF)</h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '15px',
              background: 'white',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#28a745' }}>Valeur Actuelle</h4>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {currentValue.totalCurrentValue.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR
              </div>
            </div>

            <div style={{
              padding: '15px',
              background: 'white',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#6c757d' }}>Total Investi</h4>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {currentValue.totalPurchaseValue.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                (incluant EQQQ.DE initial: {currentValue.eqqqInitialInvestment.toLocaleString('fr-FR')} EUR)
              </div>
            </div>

            <div style={{
              padding: '15px',
              background: 'white',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: currentValue.totalGain >= 0 ? '#28a745' : '#dc3545' }}>
                Plus-value Totale
              </h4>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: currentValue.totalGain >= 0 ? '#28a745' : '#dc3545'
              }}>
                {currentValue.totalGain >= 0 ? '+' : ''}{currentValue.totalGain.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: currentValue.totalGain >= 0 ? '#28a745' : '#dc3545'
              }}>
                ({currentValue.totalGain >= 0 ? '+' : ''}{currentValue.totalGainPercentage.toFixed(2)}%)
              </div>
            </div>
          </div>

          <h4>📋 Détail par ETF :</h4>
          {currentValue.etfValues.map((etf, index) => (
            <div key={index} style={{
              marginBottom: '10px',
              padding: '10px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{etf.name} ({etf.symbol})</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {etf.quantity} unités × {etf.currentPrice.toFixed(2)} EUR
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {etf.currentValue.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: etf.gain >= 0 ? '#28a745' : '#dc3545'
                  }}>
                    {etf.gain >= 0 ? '+' : ''}{etf.gain.toLocaleString('fr-FR', {minimumFractionDigits: 2})} EUR ({etf.gain >= 0 ? '+' : ''}{etf.gainPercentage.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '40px',
        padding: '15px',
        background: '#e9ecef',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <h4>ℹ️ Informations techniques</h4>
        <p><strong>API testée:</strong> GET /api/history/{testSymbol}/1m</p>
        <p><strong>Source:</strong> Yahoo Finance via proxy localhost:4001</p>
        <p><strong>Période:</strong> 1 mois avec intervalles journaliers</p>
        <p><strong>Cache:</strong> 60 secondes</p>
      </div>
    </div>
  );
}

export default TestPage;