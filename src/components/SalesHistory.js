import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SalesHistory.css';

function SalesHistory() {
  const navigate = useNavigate();

  const depositData = [
    {
      date: '27/08/2025',
      valueDate: '27/08/2025',
      amount: 600000.00,
      reference: 'Extrait n° 1',
      previousBalance: 0.00,
      newBalance: 600000.00
    },
    {
      date: '01/09/2025',
      valueDate: '01/09/2025',
      amount: 3000.00,
      reference: 'Extrait n° 2',
      previousBalance: 600000.00,
      newBalance: 603000.00
    },
    {
      date: '06/10/2025',
      valueDate: '06/10/2025',
      amount: 7000.00,
      reference: 'Extrait n° 6',
      previousBalance: 337.18,
      newBalance: 7337.18
    }
  ];

  const totalDeposits = depositData.reduce((sum, deposit) => sum + deposit.amount, 0);

  const purchaseData = [
    {
      orderNumber: '067543276, 067543298, 067543331',
      executionDate: '29/08/2025',
      executionTime: '09:04:17',
      valueDate: '02/09/2025',
      etf: 'iShares Core S&P 500 UCITS ETF',
      isin: 'IE00B5BMR087',
      quantity: 354,  // 118 + 118 + 118
      price: 594.966,
      grossAmount: 210617.97,  // 70205.99 × 3
      brokerage: 195.00,  // 65.00 × 3
      tax: 252.75,  // 84.25 × 3
      netAmount: 211065.72  // 70355.24 × 3
    },
    {
      orderNumber: '067545627, 067546062, 067546822',
      executionDate: '29/08/2025',
      executionTime: '09:05:18 - 09:08:47',
      valueDate: '02/09/2025',
      etf: 'iShares Core MSCI World UCITS ETF',
      isin: 'IE00B4L5Y983',
      quantity: 1424,  // 475 + 475 + 474
      price: 105.498,  // Prix moyen pondéré
      grossAmount: 150227.26,  // 50112.50 + 50112.50 + 50002.26
      brokerage: 150.00,  // 50.00 × 3
      tax: 180.28,  // 60.14 + 60.14 + 60.00
      netAmount: 150557.54  // 50222.64 + 50222.64 + 50112.26
    },
    {
      orderNumber: '067548154',
      executionDate: '29/08/2025',
      executionTime: '09:12:08',
      valueDate: '02/09/2025',
      etf: 'Invesco MSCI World UCITS ETF',
      isin: 'IE00B60SX394',
      quantity: 796,
      price: 113.21626,
      grossAmount: 90120.14,
      brokerage: 135.18,
      tax: 108.14,
      netAmount: 90363.46
    },
    {
      orderNumber: '067548928',
      executionDate: '29/08/2025',
      executionTime: '09:14:10',
      valueDate: '02/09/2025',
      etf: 'iShares Core MSCI Emerging Markets IMI UCITS ETF',
      isin: 'IE00BKM4GZ66',
      quantity: 2567,
      price: 34.979,
      grossAmount: 89791.09,
      brokerage: 80.00,
      tax: 107.75,
      netAmount: 89978.84
    },
    {
      orderNumber: '067549641',
      executionDate: '29/08/2025',
      executionTime: '09:15:59',
      valueDate: '02/09/2025',
      etf: 'Invesco EQQQ Nasdaq-100 UCITS ETF',
      isin: 'IE0032077012',
      quantity: 121,
      price: 496.2,
      grossAmount: 60040.20,
      brokerage: 50.00,
      tax: 72.05,
      netAmount: 60162.25
    }
  ];

  const dividendData = {
    orderNumber: '073852502',
    executionDate: '18/09/2025',
    executionTime: '12:59:13',
    valueDate: '18/09/2025',
    etf: 'Invesco EQQQ Nasdaq-100 UCITS ETF (distributif)',
    isin: 'IE0032077012',
    quantity: 121,
    dividendPerShare: 0.421405, // USD
    grossAmountUSD: 50.99,
    foreignTax: 0.00,
    withholdingTaxEUR: 12.85, // 30% précompte mobilier
    brokerageUSD: 0.59,
    vatUSD: 0.12,
    netAmountUSD: 34.98,
    exchangeRate: 1.1904,
    netAmountEUR: 29.39
  };

  const switchData = {
    sale: {
      orderNumber: '074306729',
      executionDate: '19/09/2025',
      executionTime: '09:04:27',
      valueDate: '23/09/2025',
      etf: 'Invesco EQQQ Nasdaq-100 UCITS ETF (ancien)',
      isin: 'IE0032077012',
      quantity: 121,
      price: 507.5,
      grossAmount: 61407.50,
      brokerage: 50.00,
      tax: 73.69,
      netAmount: 61283.81
    },
    purchase: {
      orderNumber: '074318900',
      executionDate: '19/09/2025',
      executionTime: '09:31:04',
      valueDate: '23/09/2025',
      etf: 'Invesco EQQQ Nasdaq-100 UCITS ETF (nouveau)',
      isin: 'IE00BYVTMS52',
      quantity: 144,
      price: 428.57049,
      grossAmount: 61714.15,
      brokerage: 60.00,
      tax: 74.06,
      netAmount: 61848.21
    }
  };

  const salesData = [
    {
      orderNumber: '090098246',
      executionDate: '28/10/2025',
      executionTime: '09:42:10',
      valueDate: '30/10/2025',
      etf: 'iShares Core S&P 500 UCITS ETF',
      isin: 'IE00B5BMR087',
      quantity: 354,
      price: 630.111,
      grossAmount: 223059.29,
      brokerage: 334.59,
      tax: 267.67,
      netAmount: 222457.03
    },
    {
      orderNumber: '090098776',
      executionDate: '28/10/2025',
      executionTime: '09:43:40',
      valueDate: '30/10/2025',
      etf: 'iShares Core MSCI World UCITS ETF',
      isin: 'IE00B4L5Y983',
      quantity: 1424,
      price: 111.23,
      grossAmount: 158391.52,
      brokerage: 237.59,
      tax: 190.07,
      netAmount: 157963.86
    },
    {
      orderNumber: '090098779',
      executionDate: '28/10/2025',
      executionTime: '09:43:40',
      valueDate: '30/10/2025',
      etf: 'iShares Core MSCI Emerging Markets IMI UCITS ETF',
      isin: 'IE00BKM4GZ66',
      quantity: 2567,
      price: 38.4,
      grossAmount: 98572.80,
      brokerage: 95.00,
      tax: 118.29,
      netAmount: 98359.51
    },
    {
      orderNumber: '090098993',
      executionDate: '28/10/2025',
      executionTime: '09:44:13',
      valueDate: '30/10/2025',
      etf: 'Invesco MSCI World UCITS ETF',
      isin: 'IE00B60SX394',
      quantity: 796,
      price: 119.36616,
      grossAmount: 95015.46,
      brokerage: 142.52,
      tax: 114.02,
      netAmount: 94758.92
    },
    {
      orderNumber: '090099204',
      executionDate: '28/10/2025',
      executionTime: '09:44:50',
      valueDate: '30/10/2025',
      etf: 'Invesco EQQQ Nasdaq-100 UCITS ETF',
      isin: 'IE00BYVTMS52',
      quantity: 144,
      price: 451.4,
      grossAmount: 65001.60,
      brokerage: 60.00,
      tax: 78.00,
      netAmount: 64863.60
    }
  ];

  const totalPurchaseGrossAmount = purchaseData.reduce((sum, purchase) => sum + purchase.grossAmount, 0);
  const totalPurchaseBrokerage = purchaseData.reduce((sum, purchase) => sum + purchase.brokerage, 0);
  const totalPurchaseTax = purchaseData.reduce((sum, purchase) => sum + purchase.tax, 0);
  const totalPurchaseNetAmount = purchaseData.reduce((sum, purchase) => sum + purchase.netAmount, 0);

  const totalGrossAmount = salesData.reduce((sum, sale) => sum + sale.grossAmount, 0);
  const totalBrokerage = salesData.reduce((sum, sale) => sum + sale.brokerage, 0);
  const totalTax = salesData.reduce((sum, sale) => sum + sale.tax, 0);
  const totalNetAmount = salesData.reduce((sum, sale) => sum + sale.netAmount, 0);

  // Calculer les gains/pertes par ETF
  const performanceByETF = {
    'S&P 500': {
      purchased: 354,
      purchaseAmount: 211065.72,
      sold: 354,
      saleAmount: 222457.03,
      gain: 222457.03 - 211065.72
    },
    'MSCI World': {
      purchased: 1424,
      purchaseAmount: 150557.54,
      sold: 1424,
      saleAmount: 157963.86,
      gain: 157963.86 - 150557.54
    },
    'MSCI EM': {
      purchased: 2567,
      purchaseAmount: 89978.84,
      sold: 2567,
      saleAmount: 98359.51,
      gain: 98359.51 - 89978.84
    },
    'Invesco World': {
      purchased: 796,
      purchaseAmount: 90363.46,
      sold: 796,
      saleAmount: 94758.92,
      gain: 94758.92 - 90363.46
    },
    'Nasdaq-100': {
      purchased: 144,
      purchaseAmount: 60162.25 + 61848.21, // Achat initial + achat nouveau
      sold: 121 + 144,
      saleAmount: 61283.81 + 64863.60 + 29.39, // Vente ancien + vente nouveau + dividende
      gain: (61283.81 + 64863.60 + 29.39) - (60162.25 + 61848.21)
    }
  };

  const totalGain = Object.values(performanceByETF).reduce((sum, etf) => sum + etf.gain, 0);
  const totalInvested = Object.values(performanceByETF).reduce((sum, etf) => sum + etf.purchaseAmount, 0);
  const totalPerformance = (totalGain / totalInvested) * 100;

  return (
    <div className="sales-history-container">
      <div className="nav-buttons">
        <button onClick={() => navigate('/etf')} className="nav-button">Portfolio</button>
        <button onClick={() => navigate('/etf/charts')} className="nav-button">Graphiques</button>
      </div>

      <div className="sales-summary" style={{ borderColor: '#2196f3', background: 'linear-gradient(135deg, #1e2228 0%, #1e2838 100%)' }}>
        <h2 style={{ color: '#2196f3' }}>Alimentations du Compte</h2>
        <div className="summary-grid">
          {depositData.map((deposit, index) => (
            <div key={index} className="summary-item">
              <span className="summary-label">{deposit.date} :</span>
              <span className="summary-value">{deposit.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
          ))}
          <div className="summary-item total">
            <span className="summary-label">Total alimenté :</span>
            <span className="summary-value" style={{ color: '#2196f3', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {totalDeposits.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
            </span>
          </div>
        </div>
      </div>

      <div className="sales-summary" style={{ borderColor: '#61dafb', background: 'linear-gradient(135deg, #1e2228 0%, #2a3038 100%)' }}>
        <h2 style={{ color: '#61dafb' }}>Performance Globale du Portefeuille</h2>
        <div className="summary-grid">
          <div className="summary-item total">
            <span className="summary-label">Total investi :</span>
            <span className="summary-value">{totalInvested.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item total">
            <span className="summary-label">Total récupéré :</span>
            <span className="summary-value">{(totalInvested + totalGain).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item total">
            <span className="summary-label">Gain net réalisé :</span>
            <span className="summary-value" style={{ color: totalGain >= 0 ? '#4caf50' : '#ff6b6b', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
            </span>
          </div>
          <div className="summary-item total">
            <span className="summary-label">Performance :</span>
            <span className="summary-value" style={{ color: totalPerformance >= 0 ? '#4caf50' : '#ff6b6b', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {totalPerformance >= 0 ? '+' : ''}{totalPerformance.toFixed(2)}%
            </span>
          </div>
        </div>

        <h3 style={{ color: '#9fa3a8', fontSize: '0.9rem', marginTop: '20px', marginBottom: '10px' }}>Détail par ETF</h3>
        {Object.entries(performanceByETF).map(([name, data]) => (
          <div key={name} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px solid #3a3f47',
            fontSize: '0.85rem'
          }}>
            <span style={{ color: '#e6e6e6' }}>{name}</span>
            <span style={{ color: data.gain >= 0 ? '#4caf50' : '#ff6b6b' }}>
              {data.gain >= 0 ? '+' : ''}{data.gain.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
              <span style={{ marginLeft: '8px', color: '#9fa3a8', fontSize: '0.8rem' }}>
                ({((data.gain / data.purchaseAmount) * 100).toFixed(2)}%)
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="sales-summary">
        <h2>Achats du 29 août 2025</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Nombre de transactions :</span>
            <span className="summary-value">{purchaseData.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Montant brut total :</span>
            <span className="summary-value">{totalPurchaseGrossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Courtage total :</span>
            <span className="summary-value negative">{totalPurchaseBrokerage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Impôts total :</span>
            <span className="summary-value negative">{totalPurchaseTax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item total">
            <span className="summary-label">Débit net total :</span>
            <span className="summary-value negative">{totalPurchaseNetAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
        </div>
      </div>

      <div className="sales-list">
        <h2>Détail des Achats</h2>
        {purchaseData.map((purchase, index) => (
          <div key={index} className="sale-card">
            <div className="sale-header">
              <h3>{purchase.etf}</h3>
              <span className="order-number">Ordre #{purchase.orderNumber}</span>
            </div>

            <div className="sale-details">
              <div className="detail-row">
                <span className="detail-label">ISIN :</span>
                <span className="detail-value">{purchase.isin}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date d'exécution :</span>
                <span className="detail-value">{purchase.executionDate} à {purchase.executionTime}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date de valeur :</span>
                <span className="detail-value">{purchase.valueDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Quantité achetée :</span>
                <span className="detail-value">{purchase.quantity} parts</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Prix unitaire :</span>
                <span className="detail-value">{purchase.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} EUR</span>
              </div>
              <div className="detail-row highlight">
                <span className="detail-label">Montant brut :</span>
                <span className="detail-value">{purchase.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Courtage :</span>
                <span className="detail-value negative">-{purchase.brokerage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Impôt de bourse (0.12%) :</span>
                <span className="detail-value negative">-{purchase.tax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
              <div className="detail-row net-amount">
                <span className="detail-label">Débit net :</span>
                <span className="detail-value negative">{purchase.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sales-summary" style={{ borderColor: '#9c27b0', background: 'linear-gradient(135deg, #1e2228 0%, #2a2838 100%)' }}>
        <h2 style={{ color: '#9c27b0' }}>Dividende reçu le 18 septembre 2025</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">ETF :</span>
            <span className="summary-value" style={{ color: '#9c27b0' }}>{dividendData.etf}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Montant brut :</span>
            <span className="summary-value">{dividendData.grossAmountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Précompte mobilier (30%) :</span>
            <span className="summary-value negative">{dividendData.withholdingTaxEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item total">
            <span className="summary-label">Crédit net :</span>
            <span className="summary-value">{dividendData.netAmountEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#9fa3a8', marginTop: '10px', fontStyle: 'italic' }}>
          * Ce dividende a été soumis à taxation (30% de précompte mobilier), ce qui a motivé la vente de cet ETF distributif au profit d'un ETF capitalisé.
        </p>
      </div>

      <div className="sales-list">
        <h2>Détail du Dividende</h2>
        <div className="sale-card" style={{ borderLeft: '4px solid #9c27b0' }}>
          <div className="sale-header">
            <h3>{dividendData.etf}</h3>
            <span className="order-number">Bordereau #{dividendData.orderNumber}</span>
          </div>

          <div className="sale-details">
            <div className="detail-row">
              <span className="detail-label">ISIN :</span>
              <span className="detail-value">{dividendData.isin}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date d'exécution :</span>
              <span className="detail-value">{dividendData.executionDate} à {dividendData.executionTime}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date de valeur :</span>
              <span className="detail-value">{dividendData.valueDate}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Quantité de parts :</span>
              <span className="detail-value">{dividendData.quantity} parts</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Dividende par part :</span>
              <span className="detail-value">{dividendData.dividendPerShare.toLocaleString('fr-FR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} USD</span>
            </div>
            <div className="detail-row highlight">
              <span className="detail-label">Montant brut :</span>
              <span className="detail-value">{dividendData.grossAmountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Prélèvement étranger :</span>
              <span className="detail-value">{dividendData.foreignTax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Précompte mobilier (30%) :</span>
              <span className="detail-value negative">{dividendData.withholdingTaxEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Frais :</span>
              <span className="detail-value negative">{dividendData.brokerageUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">TVA :</span>
              <span className="detail-value negative">{dividendData.vatUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Net en USD :</span>
              <span className="detail-value">{dividendData.netAmountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Taux de change :</span>
              <span className="detail-value">1 EUR = {dividendData.exchangeRate.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USD</span>
            </div>
            <div className="detail-row net-amount">
              <span className="detail-label">Crédit net :</span>
              <span className="detail-value">{dividendData.netAmountEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sales-summary" style={{ borderColor: '#ff9800' }}>
        <h2>Switch ETF Nasdaq-100 du 19 septembre 2025</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Opération :</span>
            <span className="summary-value" style={{ color: '#ff9800' }}>Remplacement ancien → nouveau ETF</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Coût net de l'opération :</span>
            <span className="summary-value negative">{(switchData.purchase.netAmount - switchData.sale.netAmount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
        </div>
      </div>

      <div className="sales-list">
        <h2>Détail du Switch</h2>
        <div className="sale-card" style={{ borderLeft: '4px solid #ff6b6b' }}>
          <div className="sale-header">
            <h3>{switchData.sale.etf}</h3>
            <span className="order-number">Ordre #{switchData.sale.orderNumber}</span>
          </div>
          <div className="sale-details">
            <div className="detail-row">
              <span className="detail-label">Type :</span>
              <span className="detail-value" style={{ color: '#ff6b6b', fontWeight: 'bold' }}>VENTE</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ISIN :</span>
              <span className="detail-value">{switchData.sale.isin}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date d'exécution :</span>
              <span className="detail-value">{switchData.sale.executionDate} à {switchData.sale.executionTime}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Quantité vendue :</span>
              <span className="detail-value">{switchData.sale.quantity} parts</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Prix unitaire :</span>
              <span className="detail-value">{switchData.sale.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} EUR</span>
            </div>
            <div className="detail-row highlight">
              <span className="detail-label">Montant brut :</span>
              <span className="detail-value">{switchData.sale.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Courtage :</span>
              <span className="detail-value negative">-{switchData.sale.brokerage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Impôt de bourse (0.12%) :</span>
              <span className="detail-value negative">-{switchData.sale.tax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row net-amount">
              <span className="detail-label">Crédit net :</span>
              <span className="detail-value">{switchData.sale.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
          </div>
        </div>

        <div className="sale-card" style={{ borderLeft: '4px solid #4caf50' }}>
          <div className="sale-header">
            <h3>{switchData.purchase.etf}</h3>
            <span className="order-number">Ordre #{switchData.purchase.orderNumber}</span>
          </div>
          <div className="sale-details">
            <div className="detail-row">
              <span className="detail-label">Type :</span>
              <span className="detail-value" style={{ color: '#4caf50', fontWeight: 'bold' }}>ACHAT</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ISIN :</span>
              <span className="detail-value">{switchData.purchase.isin}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date d'exécution :</span>
              <span className="detail-value">{switchData.purchase.executionDate} à {switchData.purchase.executionTime}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Quantité achetée :</span>
              <span className="detail-value">{switchData.purchase.quantity} parts</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Prix unitaire :</span>
              <span className="detail-value">{switchData.purchase.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} EUR</span>
            </div>
            <div className="detail-row highlight">
              <span className="detail-label">Montant brut :</span>
              <span className="detail-value">{switchData.purchase.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Courtage :</span>
              <span className="detail-value negative">-{switchData.purchase.brokerage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Impôt de bourse (0.12%) :</span>
              <span className="detail-value negative">-{switchData.purchase.tax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
            <div className="detail-row net-amount">
              <span className="detail-label">Débit net :</span>
              <span className="detail-value negative">{switchData.purchase.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sales-summary">
        <h2>Ventes du 28 octobre 2025</h2>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Nombre de transactions :</span>
            <span className="summary-value">{salesData.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Montant brut total :</span>
            <span className="summary-value">{totalGrossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Courtage total :</span>
            <span className="summary-value negative">{totalBrokerage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Impôts total :</span>
            <span className="summary-value negative">{totalTax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
          <div className="summary-item total">
            <span className="summary-label">Montant net total :</span>
            <span className="summary-value">{totalNetAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
          </div>
        </div>
      </div>

      <div className="sales-list">
        <h2>Détail des Transactions</h2>
        {salesData.map((sale, index) => (
          <div key={index} className="sale-card">
            <div className="sale-header">
              <h3>{sale.etf}</h3>
              <span className="order-number">Ordre #{sale.orderNumber}</span>
            </div>

            <div className="sale-details">
              <div className="detail-row">
                <span className="detail-label">ISIN :</span>
                <span className="detail-value">{sale.isin}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date d'exécution :</span>
                <span className="detail-value">{sale.executionDate} à {sale.executionTime}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date de valeur :</span>
                <span className="detail-value">{sale.valueDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Quantité vendue :</span>
                <span className="detail-value">{sale.quantity} parts</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Prix unitaire :</span>
                <span className="detail-value">{sale.price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} EUR</span>
              </div>
              <div className="detail-row highlight">
                <span className="detail-label">Montant brut :</span>
                <span className="detail-value">{sale.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Courtage :</span>
                <span className="detail-value negative">-{sale.brokerage.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Impôt de bourse (0.12%) :</span>
                <span className="detail-value negative">-{sale.tax.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
              <div className="detail-row net-amount">
                <span className="detail-label">Crédit net :</span>
                <span className="detail-value">{sale.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SalesHistory;
