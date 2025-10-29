import React from 'react';
import './SalesHistory.css';

function SalesHistory() {
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

  const totalGrossAmount = salesData.reduce((sum, sale) => sum + sale.grossAmount, 0);
  const totalBrokerage = salesData.reduce((sum, sale) => sum + sale.brokerage, 0);
  const totalTax = salesData.reduce((sum, sale) => sum + sale.tax, 0);
  const totalNetAmount = salesData.reduce((sum, sale) => sum + sale.netAmount, 0);

  return (
    <div className="sales-history-container">
      <h1>Historique des Ventes</h1>
      <p className="sales-date">Date de transaction : 28 octobre 2025</p>

      <div className="sales-summary">
        <h2>Résumé</h2>
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
