import React from 'react';
import transactionService from '../services/transactionService';

function OrdersPage() {
  const transactions = transactionService.getAllTransactions();
  // const totalFees = transactionService.getTotalFees();

  // Données réelles du compte Bolero
  const totalDeposited = 603000; // 600 000 + 3 000 EUR
  const cashRemaining = 337.18;
  const investedInETF = totalDeposited - cashRemaining;

  // Grouper les transactions par date
  const transactionsByDate = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.date]) {
      acc[transaction.date] = [];
    }
    acc[transaction.date].push(transaction);
    return acc;
  }, {});

  return (
    <div className="orders-page">
      {/* En-tête avec statistiques */}
      <div className="orders-header">
        <h2>Relevé des transactions</h2>
        <div className="orders-stats">
          <div className="stat-item">
            <span className="stat-label">Capital total déposé</span>
            <span className="stat-value">{transactionService.formatCurrency(totalDeposited)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Investi en ETF</span>
            <span className="stat-value">{transactionService.formatCurrency(investedInETF)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Liquidités</span>
            <span className="stat-value">{transactionService.formatCurrency(cashRemaining)}</span>
          </div>
        </div>
      </div>

      {/* Liste des transactions par date */}
      <div className="transactions-list">
        {Object.entries(transactionsByDate).map(([date, dayTransactions]) => (
          <div key={date} className="transaction-date-group">
            <div className="date-header">
              <h3>{transactionService.formatDate(date)}</h3>
              <span className="date-count">
                {dayTransactions.length} transaction{dayTransactions.length > 1 ? 's' : ''}
              </span>
            </div>

            {dayTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-main">
                  <div className="transaction-left">
                    <div className="transaction-type">
                      <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                        {transaction.type}
                      </span>
                      <span className="transaction-time">{transaction.time}</span>
                    </div>
                    <div className="transaction-instrument">
                      <div className="instrument-name">{transaction.instrument}</div>
                      <div className="instrument-details">
                        {transaction.quantity} unités × {transaction.price.toFixed(2)} EUR
                      </div>
                      <div className="instrument-exchange">
                        {transaction.exchange} • {transaction.symbol}
                      </div>
                    </div>
                  </div>

                  <div className="transaction-right">
                    <div className="transaction-value">
                      <span className="total-value">
                        {transactionService.formatCurrency(transaction.totalValue)}
                      </span>
                      <div className="fees-breakdown">
                        <span className="courtage">Courtage: {transactionService.formatCurrency(transaction.courtage)}</span>
                        <span className="impot">Impôt: {transactionService.formatCurrency(transaction.impotBourse)}</span>
                      </div>
                      <div className={`net-amount ${transaction.type.toLowerCase()}`}>
                        {transaction.type === 'Achat' ? '-' : '+'}
                        {transactionService.formatCurrency(transaction.debitNet || transaction.creditNet)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="transaction-footer">
                  <span className="bordereau">Bordereau {transaction.bordereau}</span>
                  <span className="total-fees">
                    Frais totaux: {transactionService.formatCurrency(transaction.totalFees)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdersPage;