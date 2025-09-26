class TransactionService {
  getAllTransactions() {
    // Données extraites des PDF Bolero
    return [
      // Transactions du 29/08/2025 - Achats initiaux
      {
        id: 'T001',
        date: '29/08/2025',
        time: '09:04:17',
        type: 'Achat',
        instrument: 'IS CO S&P500 U.ETF USD(ACC-PTG.K',
        symbol: 'IE00B5BMR087',
        quantity: 118,
        price: 594.966,
        totalValue: 70205.99,
        courtage: 65.00,
        impotBourse: 84.25,
        totalFees: 149.25,
        debitNet: 70355.24,
        exchange: 'Euronext A\'dam',
        bordereau: '067543276'
      },
      {
        id: 'T002',
        date: '29/08/2025',
        time: '09:04:17',
        type: 'Achat',
        instrument: 'IS CO S&P500 U.ETF USD(ACC-PTG.K',
        symbol: 'IE00B5BMR087',
        quantity: 118,
        price: 594.966,
        totalValue: 70205.99,
        courtage: 65.00,
        impotBourse: 84.25,
        totalFees: 149.25,
        debitNet: 70355.24,
        exchange: 'Euronext A\'dam',
        bordereau: '067543298'
      },
      {
        id: 'T003',
        date: '29/08/2025',
        time: '09:04:17',
        type: 'Achat',
        instrument: 'IS CO S&P500 U.ETF USD(ACC-PTG.K',
        symbol: 'IE00B5BMR087',
        quantity: 118,
        price: 594.966,
        totalValue: 70205.99,
        courtage: 65.00,
        impotBourse: 84.25,
        totalFees: 149.25,
        debitNet: 70355.24,
        exchange: 'Euronext A\'dam',
        bordereau: '067543331'
      },
      {
        id: 'T004',
        date: '29/08/2025',
        time: '09:05:18',
        type: 'Achat',
        instrument: 'ISHAR.III PLC CORE MSCI WORLD',
        symbol: 'IE00B4L5Y983',
        quantity: 475,
        price: 105.5,
        totalValue: 50112.50,
        courtage: 50.00,
        impotBourse: 60.14,
        totalFees: 110.14,
        debitNet: 50222.64,
        exchange: 'JSSI',
        bordereau: '067545627'
      },
      {
        id: 'T005',
        date: '29/08/2025',
        time: '09:06:56',
        type: 'Achat',
        instrument: 'ISHAR.III PLC CORE MSCI WORLD',
        symbol: 'IE00B4L5Y983',
        quantity: 475,
        price: 105.5,
        totalValue: 50112.50,
        courtage: 50.00,
        impotBourse: 60.14,
        totalFees: 110.14,
        debitNet: 50222.64,
        exchange: 'JSSI',
        bordereau: '067546062'
      },
      {
        id: 'T006',
        date: '29/08/2025',
        time: '09:08:47',
        type: 'Achat',
        instrument: 'ISHAR.III PLC CORE MSCI WORLD',
        symbol: 'IE00B4L5Y983',
        quantity: 474,
        price: 105.49,
        totalValue: 50002.26,
        courtage: 50.00,
        impotBourse: 60.00,
        totalFees: 110.00,
        debitNet: 50112.26,
        exchange: 'JSSI',
        bordereau: '067546822'
      },
      {
        id: 'T007',
        date: '29/08/2025',
        time: '09:12:08',
        type: 'Achat',
        instrument: 'INVESCO MKS PLC MSCI WORLD U.ETF',
        symbol: 'IE00B60SX394',
        quantity: 796,
        price: 113.21626,
        totalValue: 90120.14,
        courtage: 135.18,
        impotBourse: 108.14,
        totalFees: 243.32,
        debitNet: 90363.46,
        exchange: 'XETA',
        bordereau: '067548154'
      },
      {
        id: 'T008',
        date: '29/08/2025',
        time: '09:14:10',
        type: 'Achat',
        instrument: 'ISHARES PLC CORE MSC E.M.IM UC',
        symbol: 'IE00BKM4GZ66',
        quantity: 2567,
        price: 34.979,
        totalValue: 89791.09,
        courtage: 80.00,
        impotBourse: 107.75,
        totalFees: 187.75,
        debitNet: 89978.84,
        exchange: 'Euronext A\'dam',
        bordereau: '067548928'
      },
      // Transactions du 19/09/2025 - Vente et achat NASDAQ-100
      {
        id: 'T009',
        date: '19/09/2025',
        time: '09:04:27',
        type: 'Vente',
        instrument: 'INV.MAR.III-EQQQ NASDAQ-100 ETF-',
        symbol: 'IE0032077012',
        quantity: 121,
        price: 507.5,
        totalValue: 61407.50,
        courtage: 50.00,
        impotBourse: 73.69,
        totalFees: 123.69,
        creditNet: 61283.81,
        exchange: 'Euronext Paris',
        bordereau: '074306729'
      },
      {
        id: 'T010',
        date: '19/09/2025',
        time: '09:31:04',
        type: 'Achat',
        instrument: 'IN.M.III PLC-EQQQ NAS.-100UC.ETF',
        symbol: 'IE00BYVTMS52',
        quantity: 144,
        price: 428.57049,
        totalValue: 61714.15,
        courtage: 60.00,
        impotBourse: 74.06,
        totalFees: 134.06,
        debitNet: 61848.21,
        exchange: 'XETA',
        bordereau: '074318900'
      }
    ];
  }

  getTransactionsByType(type) {
    return this.getAllTransactions().filter(t => t.type === type);
  }

  getTransactionsByDate(date) {
    return this.getAllTransactions().filter(t => t.date === date);
  }

  getTotalFees() {
    return this.getAllTransactions().reduce((total, t) => total + t.totalFees, 0);
  }

  getTotalTraded() {
    // Volume total d'échange (achats + ventes en valeur absolue)
    return this.getAllTransactions().reduce((total, t) => {
      return total + (t.debitNet || t.creditNet || t.totalValue);
    }, 0);
  }

  getNetInvested() {
    // Montant net investi (achats - ventes)
    return this.getAllTransactions().reduce((total, t) => {
      if (t.type === 'Achat') {
        return total + (t.debitNet || t.totalValue);
      } else {
        return total - (t.creditNet || t.totalValue);
      }
    }, 0);
  }

  getTotalInvested() {
    // Capital total déployé (achats uniquement)
    return this.getAllTransactions()
      .filter(t => t.type === 'Achat')
      .reduce((total, t) => total + (t.debitNet || t.totalValue), 0);
  }

  formatCurrency(amount) {
    return amount.toLocaleString('fr-FR', {minimumFractionDigits: 2}) + ' EUR';
  }

  formatDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

const transactionService = new TransactionService();
export default transactionService;