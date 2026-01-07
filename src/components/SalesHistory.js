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
      newBalance: 600000.00,
      type: 'deposit'
    },
    {
      date: '01/09/2025',
      valueDate: '01/09/2025',
      amount: 3000.00,
      reference: 'Extrait n° 2',
      previousBalance: 600000.00,
      newBalance: 603000.00,
      type: 'deposit'
    },
    {
      date: '06/10/2025',
      valueDate: '06/10/2025',
      amount: 7000.00,
      reference: 'Extrait n° 6',
      previousBalance: 337.18,
      newBalance: 7337.18,
      type: 'deposit'
    },
    {
      date: '14/11/2025',
      valueDate: '14/11/2025',
      amount: -2000.00,
      reference: 'Extrait n° 8',
      previousBalance: 6741.40,
      newBalance: 4741.40,
      type: 'withdrawal'
    },
    {
      date: '15/11/2025',
      valueDate: '15/11/2025',
      amount: -8000.00,
      reference: 'Extrait n° 9',
      previousBalance: 8735.69,
      newBalance: 735.69,
      type: 'withdrawal'
    }
  ];

  const totalDeposits = depositData.filter(d => d.type === 'deposit').reduce((sum, d) => sum + d.amount, 0);
  const totalWithdrawals = depositData.filter(d => d.type === 'withdrawal').reduce((sum, d) => sum + Math.abs(d.amount), 0);
  const netDeposits = totalDeposits - totalWithdrawals;

  // Conversions EUR → USD pour le compte actions US
  const conversionData = [
    {
      date: '18/11/2025',
      valueDate: '20/11/2025',
      reference: 'Extrait n° 10',
      amountEUR: 200000.00,
      amountUSD: 211260.00,
      exchangeRate: 1.0563,
      commission: 105.63,
      commissionRate: 0.05
    },
    {
      date: '20/11/2025',
      valueDate: '22/11/2025',
      reference: 'Extrait n° 12',
      amountEUR: 200000.00,
      amountUSD: 211800.00,
      exchangeRate: 1.059,
      commission: 105.90,
      commissionRate: 0.05
    }
  ];

  const totalConvertedEUR = conversionData.reduce((sum, c) => sum + c.amountEUR, 0);
  const totalConvertedUSD = conversionData.reduce((sum, c) => sum + c.amountUSD, 0);
  const totalCommissions = conversionData.reduce((sum, c) => sum + c.commission, 0);

  // Achats d'actions US
  const usStockPurchases = [
    // Eli Lilly - 17/11/2025 (76+70+76 = 222 actions @ 1067.0301 USD)
    {
      orderNumber: '000051985288',
      executionDate: '17/11/2025',
      stock: 'Eli Lilly and Co.',
      ticker: 'LLY',
      quantity: 76,
      price: 1067.0301,
      currency: 'USD'
    },
    {
      orderNumber: '000051985300',
      executionDate: '17/11/2025',
      stock: 'Eli Lilly and Co.',
      ticker: 'LLY',
      quantity: 70,
      price: 1067.0301,
      currency: 'USD'
    },
    {
      orderNumber: '000051985563',
      executionDate: '17/11/2025',
      stock: 'Eli Lilly and Co.',
      ticker: 'LLY',
      quantity: 76,
      price: 1067.0301,
      currency: 'USD'
    },
    // IDXX - 25/11/2025
    {
      orderNumber: '000052140351',
      executionDate: '25/11/2025',
      stock: 'IDEXX Laboratories Inc',
      ticker: 'IDXX',
      quantity: 65,
      price: 738.935,
      currency: 'USD'
    },
    // AVGO - 25/11/2025
    {
      orderNumber: '000052140379',
      executionDate: '25/11/2025',
      stock: 'Broadcom Inc',
      ticker: 'AVGO',
      quantity: 150,
      price: 392.29,
      currency: 'USD'
    },
    // REGN - 25/11/2025
    {
      orderNumber: '000052140547',
      executionDate: '25/11/2025',
      stock: 'Regeneron Pharmaceuticals Inc',
      ticker: 'REGN',
      quantity: 75,
      price: 759.52,
      currency: 'USD'
    },
    // AMAT - 28/11/2025
    {
      orderNumber: '000052191412',
      executionDate: '28/11/2025',
      stock: 'Applied Materials Inc',
      ticker: 'AMAT',
      quantity: 240,
      price: 254.20,
      currency: 'USD'
    },
    // WDC - 28/11/2025
    {
      orderNumber: '000052191453',
      executionDate: '28/11/2025',
      stock: 'Western Digital Corp.',
      ticker: 'WDC',
      quantity: 400,
      price: 162.76,
      currency: 'USD'
    },
    // VanEck Gold Miners - 01/12/2025
    {
      orderNumber: '000052206369',
      executionDate: '01/12/2025',
      stock: 'VanEck Gold Miners ETF',
      ticker: 'G2X',
      quantity: 600,
      price: 80.42,
      currency: 'EUR'
    }
  ];

  // Opérations Alphabet (GOOG) - 20/11/2025
  // Achat 350 → Achat 350 → Vente 700 → Rachat 350 = Position finale: 350 actions
  const alphabetOperations = {
    initialPurchase1: {
      bordereau: '2025 99715215',
      executionDate: '20/11/2025',
      stock: 'Alphabet Inc Class A',
      ticker: 'GOOG',
      quantity: 350,
      price: 306.2028,
      grossAmount: 107170.98,
      brokerage: 130.00,
      tax: 375.10,
      totalAmount: 107676.08,
      currency: 'USD'
    },
    initialPurchase2: {
      bordereau: '2025 99715216',
      executionDate: '20/11/2025',
      stock: 'Alphabet Inc Class A',
      ticker: 'GOOG',
      quantity: 350,
      price: 306.20,
      grossAmount: 107170.00,
      brokerage: 130.00,
      tax: 375.10,
      totalAmount: 107675.10,
      currency: 'USD'
    },
    sale: {
      bordereau: '2025 99741957',
      executionDate: '20/11/2025',
      stock: 'Alphabet Inc Class A',
      ticker: 'GOOG',
      quantity: 700,
      price: 299.32217,
      grossAmount: 209525.52,
      brokerage: 330.00,
      tax: 733.34,
      netAmount: 208462.18,
      currency: 'USD'
    },
    repurchase: {
      bordereau: '2025 99848566',
      executionDate: '20/11/2025',
      stock: 'Alphabet Inc Class A',
      ticker: 'GOOG',
      quantity: 350,
      price: 291.466,
      grossAmount: 102013.10,
      brokerage: 130.00,
      tax: 357.05,
      totalAmount: 102500.15,
      currency: 'USD'
    }
  };

  // Calculs pour les actions US
  // eslint-disable-next-line no-unused-vars
  const totalUSStockPurchases = usStockPurchases.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  // Récapitulatif du portefeuille actions US (positions actuelles au 22/12/2025)
  const usPortfolioSummary = {
    'LLY': { name: 'Eli Lilly', quantity: 111, avgPrice: 1032.07, totalCost: 114559.58 },
    'GOOG': { name: 'Alphabet', quantity: 350, avgPrice: 291.47, totalCost: 102500.15 },
    'WDC': { name: 'Western Digital', quantity: 400, avgPrice: 163.44, totalCost: 65376.85 },
    'AMAT': { name: 'Applied Materials', quantity: 240, avgPrice: 251.98, totalCost: 60476.15 },
    'G2X': { name: 'VanEck Gold Miners', quantity: 600, avgPrice: 81.62, totalCost: 48970.62, currency: 'EUR' }
  };

  // Vente LLY du 05/01/2026
  // eslint-disable-next-line no-unused-vars
  const llySale2026 = {
    orderNumber: '118171131',
    reference: '000052757686',
    bordereau: '2026 1067387',
    executionDate: '05/01/2026',
    stock: 'Eli Lilly and Co.',
    ticker: 'LLY',
    quantity: 111,
    price: 1055.0473,
    grossAmount: 117110.25,
    brokerage: 150.00,
    tax: 409.89,
    netAmount: 116550.36,
    currency: 'USD'
  };

  // Ventes Actions US du 22/12/2025
  const usStockSales = [
    {
      orderNumber: '117120508',
      reference: '000052557374',
      bordereau: '2025 110278867',
      executionDate: '22/12/2025',
      stock: 'Rocket Lab Corporation',
      ticker: 'RKLB',
      quantity: 2200,
      price: 77.30708,
      grossAmount: 170075.58,
      brokerage: 270.00,
      tax: 595.26,
      netAmount: 169210.32,
      currency: 'USD'
    },
    {
      orderNumber: '117115879',
      reference: '000052556569',
      bordereau: '2025 110266584',
      executionDate: '22/12/2025',
      stock: 'Broadcom Inc.',
      ticker: 'AVGO',
      quantity: 150,
      price: 341.009,
      grossAmount: 51151.35,
      brokerage: 50.00,
      tax: 179.03,
      netAmount: 50922.32,
      currency: 'USD'
    },
    {
      orderNumber: '117115267',
      reference: '000052556448',
      bordereau: '2025 110264476',
      executionDate: '22/12/2025',
      stock: 'Regeneron Pharmaceuticals',
      ticker: 'REGN',
      quantity: 75,
      price: 780.9601,
      grossAmount: 58572.01,
      brokerage: 50.00,
      tax: 205.00,
      netAmount: 58317.01,
      netAmountEUR: 49280.95,
      exchangeRate: 1.183358,
      currency: 'USD',
      settlementCurrency: 'EUR'
    },
    {
      orderNumber: '117062590',
      reference: '000052548858',
      bordereau: '2025 110157099',
      executionDate: '22/12/2025',
      stock: 'IDEXX Laboratories',
      ticker: 'IDXX',
      quantity: 65,
      price: 695.5601,
      grossAmount: 45211.41,
      brokerage: 50.00,
      tax: 158.24,
      netAmount: 45003.17,
      currency: 'USD'
    }
  ];

  // Vente partielle LLY du 08/12/2025
  // eslint-disable-next-line no-unused-vars
  const llySale = {
    orderNumber: '000052329454',
    executionDate: '08/12/2025',
    stock: 'Eli Lilly and Co.',
    ticker: 'LLY',
    quantity: 111,
    price: 1076.98,
    currency: 'USD'
  };

  // Achats RKLB (vendus le 22/12/2025)
  // eslint-disable-next-line no-unused-vars
  const rklbPurchases = [
    {
      reference: '000052408393',
      executionDate: '12/12/2025',
      stock: 'Rocket Lab Corporation',
      ticker: 'RKLB',
      quantity: 1000,
      price: 77.18,
      currency: 'USD'
    },
    {
      reference: '000052332080',
      executionDate: '08/12/2025',
      stock: 'Rocket Lab Corporation',
      ticker: 'RKLB',
      quantity: 1200,
      price: 77.18,
      currency: 'USD'
    }
  ];

  const totalUSStockSales = usStockSales.reduce((sum, s) => sum + s.netAmount, 0);

  const totalUSPortfolioValue = Object.values(usPortfolioSummary).reduce((sum, s) => sum + s.totalCost, 0);

  // Timeline complète du portefeuille (évolution chronologique - ordre Bolero: date desc, ref desc)
  const portfolioTimeline = [
    // 06/01/2026 - Achat SK Hynix
    { date: '06/01/2026', type: 'buy', description: 'Achat SK Hynix GDR (100 actions)', amountEUR: -43210.50, amountUSD: -50916.14, feesEUR: 210.50, details: '100 × 430 EUR (règlement USD)', currency: 'EUR', ref: '000052790956', bordereau: '2026 1744402' },

    // 05/01/2026 - Vente LLY + Achat HYMC
    { date: '05/01/2026', type: 'sell', description: 'Vente Eli Lilly (111 actions)', amountUSD: 116550.36, costBasisUSD: 114559.58, feesUSD: 559.89, details: '111 × 1055.05 USD', currency: 'USD', ref: '000052757686', bordereau: '2026 1067387' },
    { date: '05/01/2026', type: 'buy', description: 'Achat Hycroft Mining (2000 actions)', amountUSD: -55695.28, feesUSD: 244.08, details: '2000 × 27.73 USD', currency: 'USD', ref: '000052759164', bordereau: '2026 1081560' },

    // 22/12/2025 - Ventes (costBasis = coût d'achat original)
    { date: '22/12/2025', type: 'sell', description: 'Vente Rocket Lab (2200 actions)', amountUSD: 169210.32, costBasisUSD: 126722.13, feesUSD: 865.26, details: '2200 × 77.31 USD', currency: 'USD', ref: '000052557374', bordereau: '2025 110278867' },
    { date: '22/12/2025', type: 'sell', description: 'Vente Broadcom (150 actions)', amountUSD: 50922.32, costBasisUSD: 57968.64, feesUSD: 229.03, details: '150 × 341.01 USD', currency: 'USD', ref: '000052556569', bordereau: '2025 110266584' },
    { date: '22/12/2025', type: 'sell', description: 'Vente Regeneron (75 actions)', amountUSD: 58520.19, costBasisUSD: 59138.92, feesUSD: 255.00, details: '75 × 780.96 USD', currency: 'USD', ref: '000052556448', bordereau: '2025 110264476' },
    { date: '22/12/2025', type: 'sell', description: 'Vente IDEXX Labs (65 actions)', amountUSD: 45003.17, costBasisUSD: 49798.35, feesUSD: 208.24, details: '65 × 695.56 USD', currency: 'USD', ref: '000052548858', bordereau: '2025 110157099' },

    // 12/12/2025
    { date: '12/12/2025', type: 'buy', description: 'Achat Rocket Lab (1000 actions)', amountUSD: -65081.82, feesUSD: 276.82, details: '1000 × 64.81 USD', currency: 'USD', ref: '000052408393', bordereau: '2025 107188554' },

    // 08/12/2025
    { date: '08/12/2025', type: 'buy', description: 'Achat Rocket Lab (1200 actions)', amountUSD: -61640.31, feesUSD: 264.81, details: '1200 × 51.15 USD', currency: 'USD', ref: '000052332080', bordereau: '2025 105389100' },
    { date: '08/12/2025', type: 'sell', description: 'Vente Eli Lilly (111 actions)', amountUSD: 109682.83, costBasisUSD: 114559.58, feesUSD: 535.77, details: '111 × 992.96 USD', currency: 'USD', ref: '000052329454', bordereau: '2025 105347104' },

    // 01/12/2025
    { date: '01/12/2025', type: 'buy', description: 'Achat VanEck Gold Miners (600 parts)', amountEUR: -48970.62, feesEUR: 118.62, details: '600 × 81.42 EUR', ref: '000052206369', bordereau: '2025 102706493' },

    // 28/11/2025
    { date: '28/11/2025', type: 'buy', description: 'Achat Western Digital (400 actions)', amountUSD: -65376.85, feesUSD: 277.85, details: '400 × 162.75 USD', currency: 'USD', ref: '000052191453', bordereau: '2025 102441099' },
    { date: '28/11/2025', type: 'buy', description: 'Achat Applied Materials (240 actions)', amountUSD: -60476.15, feesUSD: 260.75, details: '240 × 250.90 USD', currency: 'USD', ref: '000052191412', bordereau: '2025 102440377' },

    // 25/11/2025
    { date: '25/11/2025', type: 'buy', description: 'Achat Regeneron (75 actions)', amountUSD: -59138.92, feesUSD: 256.09, details: '75 × 785.10 USD', currency: 'USD', ref: '000052140547', bordereau: '2025 101411934' },
    { date: '25/11/2025', type: 'buy', description: 'Achat Broadcom (150 actions)', amountUSD: -57968.64, feesUSD: 252.01, details: '150 × 384.78 USD', currency: 'USD', ref: '000052140379', bordereau: '2025 101410483' },
    { date: '25/11/2025', type: 'buy', description: 'Achat IDEXX Labs (65 actions)', amountUSD: -49798.35, feesUSD: 223.51, details: '65 × 762.69 USD', currency: 'USD', ref: '000052140351', bordereau: '2025 101410175' },

    // 20/11/2025 - GOOG + Conversion
    { date: '20/11/2025', type: 'buy', description: 'Rachat Alphabet (350 actions)', amountUSD: -102500.15, feesUSD: 487.05, details: '350 × 291.47 USD', currency: 'USD', ref: '000052060315', bordereau: '2025 99848566' },
    { date: '20/11/2025', type: 'sell', description: 'Vente Alphabet (700 actions)', amountUSD: 208462.18, costBasisUSD: 215271.21, feesUSD: 1063.34, details: '700 × 299.32 USD', currency: 'USD', ref: '000052053456', bordereau: '2025 99741957' },
    { date: '20/11/2025', type: 'buy', description: 'Achat Alphabet (350 actions)', amountUSD: -107676.08, feesUSD: 505.10, details: '350 × 306.20 USD', currency: 'USD', ref: '000052051289', bordereau: '2025 99715215' },
    { date: '20/11/2025', type: 'buy', description: 'Achat Alphabet (350 actions)', amountUSD: -107595.13, feesUSD: 504.82, details: '350 × 305.97 USD', currency: 'USD', ref: '000052051199', bordereau: '2025 99714369' },
    { date: '20/11/2025', type: 'conversion', description: 'Conversion EUR → USD', amountEUR: -200000.00, amountUSD: 211800.00, feesEUR: 105.90, details: 'Taux 1.059', ref: 'Extrait n°12' },

    // 18/11/2025
    { date: '18/11/2025', type: 'conversion', description: 'Conversion EUR → USD', amountEUR: -200000.00, amountUSD: 211260.00, feesEUR: 105.63, details: 'Taux 1.0563', ref: 'Extrait n°10' },

    // 17/11/2025 - LLY
    { date: '17/11/2025', type: 'buy', description: 'Achat Eli Lilly (76 actions)', amountUSD: -78450.98, feesUSD: 343.38, details: '76 × 1027.73 USD', currency: 'USD', ref: '000051985563', bordereau: '2025 98912939' },
    { date: '17/11/2025', type: 'buy', description: 'Achat Eli Lilly (70 actions)', amountUSD: -72239.08, feesUSD: 321.71, details: '70 × 1027.39 USD', currency: 'USD', ref: '000051985300', bordereau: '2025 98912525' },
    { date: '17/11/2025', type: 'buy', description: 'Achat Eli Lilly (76 actions)', amountUSD: -78429.10, feesUSD: 343.30, details: '76 × 1027.44 USD', currency: 'USD', ref: '000051985288', bordereau: '2025 98912498' },

    // 15/11/2025
    { date: '15/11/2025', type: 'withdrawal', description: 'Retrait', amountEUR: -8000.00, ref: 'Extrait n°9' },

    // 14/11/2025
    { date: '14/11/2025', type: 'withdrawal', description: 'Retrait', amountEUR: -2000.00, ref: 'Extrait n°8' },

    // 28/10/2025 - Ventes ETF (costBasis = coût d'achat original)
    { date: '28/10/2025', type: 'sell', description: 'Vente Invesco Nasdaq-100 (144 parts)', amountEUR: 64863.60, costBasisEUR: 61848.21, feesEUR: 138.00, details: '144 × 451.40 EUR', ref: '000051589834', bordereau: '2025 90099204' },
    { date: '28/10/2025', type: 'sell', description: 'Vente Invesco MSCI World (796 parts)', amountEUR: 94758.92, costBasisEUR: 90363.46, feesEUR: 256.54, details: '796 × 119.37 EUR', ref: '000051589814', bordereau: '2025 90098993' },
    { date: '28/10/2025', type: 'sell', description: 'Vente iShares MSCI EM (2567 parts)', amountEUR: 98359.51, costBasisEUR: 89978.84, feesEUR: 213.29, details: '2567 × 38.40 EUR', ref: '000051589778', bordereau: '2025 90098779' },
    { date: '28/10/2025', type: 'sell', description: 'Vente iShares MSCI World (1424 parts)', amountEUR: 157963.86, costBasisEUR: 150557.54, feesEUR: 427.66, details: '1424 × 111.23 EUR', ref: '000051589752', bordereau: '2025 90098776' },
    { date: '28/10/2025', type: 'sell', description: 'Vente iShares S&P 500 (354 parts)', amountEUR: 222457.03, costBasisEUR: 211065.72, feesEUR: 602.26, details: '354 × 630.11 EUR', ref: '000051589730', bordereau: '2025 90098246' },

    // 06/10/2025
    { date: '06/10/2025', type: 'deposit', description: 'Dépôt complémentaire', amountEUR: 7000.00, ref: 'Extrait n°6' },

    // 19/09/2025 - Switch Nasdaq
    { date: '19/09/2025', type: 'buy', description: 'Achat Invesco Nasdaq-100 nouveau (144 parts)', amountEUR: -61848.21, feesEUR: 134.06, details: '144 × 428.57 EUR', ref: '000050784266', bordereau: '2025 74318900' },
    { date: '19/09/2025', type: 'sell', description: 'Vente Invesco Nasdaq-100 ancien (121 parts)', amountEUR: 61283.81, costBasisEUR: 60162.25, feesEUR: 123.69, details: '121 × 507.50 EUR', ref: '000050782251', bordereau: '2025 74306729' },

    // 18/09/2025
    { date: '18/09/2025', type: 'dividend', description: 'Dividende Invesco Nasdaq-100', amountEUR: 29.39, feesEUR: 12.85, details: 'Brut 50.99 USD - 30% précompte', ref: '073852502' },

    // 01/09/2025
    { date: '01/09/2025', type: 'deposit', description: 'Dépôt complémentaire', amountEUR: 3000.00, ref: 'Extrait n°2' },

    // 29/08/2025 - Achats ETF
    { date: '29/08/2025', type: 'buy', description: 'Achat Invesco Nasdaq-100 (121 parts)', amountEUR: -60162.25, feesEUR: 122.05, details: '121 × 496.20 EUR', ref: '000050453617', bordereau: '2025 67549641' },
    { date: '29/08/2025', type: 'buy', description: 'Achat iShares MSCI EM (2567 parts)', amountEUR: -89978.84, feesEUR: 187.75, details: '2567 × 34.98 EUR', ref: '000050453551', bordereau: '2025 67548928' },
    { date: '29/08/2025', type: 'buy', description: 'Achat Invesco MSCI World (796 parts)', amountEUR: -90363.46, feesEUR: 243.32, details: '796 × 113.22 EUR', ref: '000050453478', bordereau: '2025 67548154' },
    { date: '29/08/2025', type: 'buy', description: 'Achat iShares MSCI World (1424 parts)', amountEUR: -150557.54, feesEUR: 330.28, details: '475+475+474 × 105.50 EUR', ref: '000050453228-367', bordereau: '2025 67545627 (+2)' },
    { date: '29/08/2025', type: 'buy', description: 'Achat iShares S&P 500 (354 parts)', amountEUR: -211065.72, feesEUR: 447.75, details: '3×118 × 594.97 EUR', ref: '000050453081-150', bordereau: '2025 67543276/298/331' },

    // 27/08/2025
    { date: '27/08/2025', type: 'deposit', description: 'Dépôt initial', amountEUR: 600000.00, ref: 'Extrait n°1' }
  ];

  // Taux EUR/USD pour conversion (moyenne des conversions effectuées)
  const tauxEURUSD = 1.057;

  // Calculer le solde cumulé pour chaque transaction (du plus ancien au plus récent)
  // Logique: liquidités = cash disponible, investi = coût d'achat des positions, total = liq + investi
  // Tout est converti en EUR pour affichage
  const timelineWithBalance = (() => {
    let liquiditeEUR = 0;
    let liquiditeUSD = 0;
    let investiEUR = 0;
    let investiUSD = 0;

    // D'abord calculer les soldes dans l'ordre chronologique (ancien → récent)
    const reversedTimeline = [...portfolioTimeline].reverse();
    const withBalances = reversedTimeline.map(item => {
      // Dépôts: augmentent les liquidités
      if (item.type === 'deposit') {
        liquiditeEUR += item.amountEUR || 0;
      }
      // Retraits: diminuent les liquidités
      else if (item.type === 'withdrawal') {
        liquiditeEUR += item.amountEUR || 0; // amountEUR est négatif pour les retraits
      }
      // Dividendes: ajoutent aux liquidités
      else if (item.type === 'dividend') {
        liquiditeEUR += item.amountEUR || 0;
      }
      // Conversions: transfèrent EUR vers USD dans les liquidités + frais déduits (pas d'investissement)
      else if (item.type === 'conversion') {
        liquiditeEUR += item.amountEUR || 0; // négatif (on débite EUR)
        liquiditeEUR -= item.feesEUR || 0; // frais de conversion
        liquiditeUSD += item.amountUSD || 0; // positif (on crédite USD)
      }
      // Achats: transfèrent de liquidités vers investi
      else if (item.type === 'buy') {
        const cost = Math.abs(item.amountEUR || item.amountUSD || 0);
        if (item.currency === 'USD') {
          liquiditeUSD -= cost;
          investiUSD += cost;
        } else {
          liquiditeEUR -= cost;
          investiEUR += cost;
        }
      }
      // Ventes: transfèrent de investi vers liquidités
      // On utilise costBasis si disponible, sinon le montant de vente
      else if (item.type === 'sell') {
        if (item.currency === 'USD') {
          liquiditeUSD += item.amountUSD || 0;
          investiUSD -= item.costBasisUSD || item.amountUSD || 0;
        } else {
          liquiditeEUR += item.amountEUR || 0;
          investiEUR -= item.costBasisEUR || item.amountEUR || 0;
        }
      }

      // Convertir tout en EUR pour affichage
      const liquiditeTotalEUR = liquiditeEUR + (liquiditeUSD / tauxEURUSD);
      const investiTotalEUR = investiEUR + (investiUSD / tauxEURUSD);

      return {
        ...item,
        // Valeurs brutes pour debug
        rawLiquiditeEUR: liquiditeEUR,
        rawLiquiditeUSD: liquiditeUSD,
        rawInvestiEUR: investiEUR,
        rawInvestiUSD: investiUSD,
        // Valeurs converties pour affichage
        liquiditeEUR: liquiditeTotalEUR,
        investiEUR: investiTotalEUR,
        totalEUR: liquiditeTotalEUR + investiTotalEUR
      };
    });

    // Puis remettre dans l'ordre Bolero (récent → ancien)
    return withBalances.reverse();
  })();

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
        <button onClick={() => navigate('/')} className="nav-button">Accueil</button>
        <button onClick={() => navigate('/chl')} className="nav-button">Portfolio</button>
        <button onClick={() => navigate('/chl/charts')} className="nav-button">Graphiques</button>
      </div>

      {/* Tableau chronologique de l'évolution du portefeuille */}
      <div className="sales-summary" style={{ borderColor: '#61dafb', background: 'linear-gradient(135deg, #1e2228 0%, #1a2530 100%)' }}>
        <h2 style={{ color: '#61dafb' }}>Évolution du Portefeuille</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>
          Historique chronologique de toutes les transactions depuis la création
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #3a3f47' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: '#61dafb' }}>Date</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: '#61dafb' }}>Type</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: '#61dafb' }}>Description</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#61dafb' }}>Montant</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#ff6b6b' }}>Frais</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#2196f3' }}>Liquidités</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#ff9800' }}>Investi</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: '#4caf50' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {timelineWithBalance.map((item, index) => {
                const typeColors = {
                  deposit: '#4caf50',
                  withdrawal: '#ff6b6b',
                  buy: '#ff9800',
                  sell: '#2196f3',
                  dividend: '#9c27b0',
                  conversion: '#ffc107'
                };
                const typeLabels = {
                  deposit: 'Dépôt',
                  withdrawal: 'Retrait',
                  buy: 'Achat',
                  sell: 'Vente',
                  dividend: 'Dividende',
                  conversion: 'Conversion'
                };

                return (
                  <tr
                    key={index}
                    style={{
                      borderBottom: '1px solid #2a3038',
                      backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    <td style={{ padding: '8px', color: '#e6e6e6' }}>{item.date}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        backgroundColor: typeColors[item.type],
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}>
                        {typeLabels[item.type]}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#e6e6e6' }}>
                      <div>{item.description}</div>
                      {item.details && (
                        <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '2px' }}>
                          {item.details}
                        </div>
                      )}
                      {item.ref && (
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace' }}>
                          Réf: {item.ref}
                        </div>
                      )}
                      {item.bordereau && (
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '1px', fontFamily: 'monospace' }}>
                          Bord: {item.bordereau}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '0.75rem' }}>
                      {item.type !== 'conversion' ? (
                        <>
                          {item.amountEUR && (
                            <div style={{ color: item.amountEUR > 0 ? '#4caf50' : '#ff6b6b' }}>
                              {item.amountEUR > 0 ? '+' : ''}{item.amountEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                            </div>
                          )}
                          {item.amountUSD && (
                            <div style={{ color: item.amountUSD > 0 ? '#4caf50' : '#ff6b6b' }}>
                              {item.amountUSD > 0 ? '+' : ''}{item.amountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
                            </div>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#ff6b6b', fontSize: '0.7rem' }}>
                      {item.feesEUR || item.feesUSD ? (
                        <>
                          {item.feesEUR && <div>{item.feesEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>}
                          {item.feesUSD && <div>{item.feesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $</div>}
                        </>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '0.75rem' }}>
                      <div style={{ color: '#2196f3' }}>{item.liquiditeEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '0.75rem' }}>
                      {item.investiEUR !== 0 ? (
                        <div style={{ color: '#ff9800' }}>{item.investiEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.75rem' }}>
                      <div style={{ color: '#4caf50' }}>{item.totalEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #61dafb', backgroundColor: 'rgba(97, 218, 251, 0.1)' }}>
                <td colSpan="4" style={{ padding: '12px 8px', fontWeight: 'bold', color: '#61dafb' }}>
                  SOLDE FINAL (22/12/2025)
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: '#ff6b6b', fontSize: '0.75rem' }}>
                  {portfolioTimeline.reduce((sum, item) => sum + (item.feesEUR || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <div style={{ color: '#2196f3' }}>{timelineWithBalance[0]?.liquiditeEUR?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                  <div style={{ fontSize: '0.6rem', color: '#888' }}>
                    ({timelineWithBalance[0]?.rawLiquiditeEUR?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € + {timelineWithBalance[0]?.rawLiquiditeUSD?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $)
                  </div>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  <div style={{ color: '#ff9800' }}>{timelineWithBalance[0]?.investiEUR?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  <div style={{ color: '#4caf50' }}>{timelineWithBalance[0]?.totalEUR?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', fontSize: '0.75rem' }}>
            <span><span style={{ color: '#4caf50' }}>●</span> Dépôt</span>
            <span><span style={{ color: '#ff6b6b' }}>●</span> Retrait</span>
            <span><span style={{ color: '#ff9800' }}>●</span> Achat</span>
            <span><span style={{ color: '#2196f3' }}>●</span> Vente</span>
            <span><span style={{ color: '#9c27b0' }}>●</span> Dividende</span>
            <span><span style={{ color: '#ffc107' }}>●</span> Conversion</span>
          </div>
        </div>
      </div>

      <div className="sales-summary" style={{ borderColor: '#2196f3', background: 'linear-gradient(135deg, #1e2228 0%, #1e2838 100%)' }}>
        <h2 style={{ color: '#2196f3' }}>Mouvements de Fonds</h2>
        <h3 style={{ color: '#4caf50', fontSize: '0.95rem', marginTop: '15px', marginBottom: '10px' }}>Alimentations</h3>
        <div className="summary-grid">
          {depositData.filter(d => d.type === 'deposit').map((deposit, index) => (
            <div key={index} className="summary-item">
              <span className="summary-label">{deposit.date} :</span>
              <span className="summary-value" style={{ color: '#4caf50' }}>+{deposit.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
          ))}
          <div className="summary-item total">
            <span className="summary-label">Total alimenté :</span>
            <span className="summary-value" style={{ color: '#4caf50', fontSize: '1rem', fontWeight: 'bold' }}>
              +{totalDeposits.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
            </span>
          </div>
        </div>
        <h3 style={{ color: '#ff6b6b', fontSize: '0.95rem', marginTop: '20px', marginBottom: '10px' }}>Retraits</h3>
        <div className="summary-grid">
          {depositData.filter(d => d.type === 'withdrawal').map((withdrawal, index) => (
            <div key={index} className="summary-item">
              <span className="summary-label">{withdrawal.date} :</span>
              <span className="summary-value" style={{ color: '#ff6b6b' }}>{withdrawal.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR</span>
            </div>
          ))}
          <div className="summary-item total">
            <span className="summary-label">Total retiré :</span>
            <span className="summary-value" style={{ color: '#ff6b6b', fontSize: '1rem', fontWeight: 'bold' }}>
              -{totalWithdrawals.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
            </span>
          </div>
        </div>
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #3a3f47' }}>
          <div className="summary-item total">
            <span className="summary-label">Flux net :</span>
            <span className="summary-value" style={{ color: '#2196f3', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {netDeposits.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
            </span>
          </div>
        </div>
      </div>

      <div className="sales-summary" style={{ borderColor: '#ffc107', background: 'linear-gradient(135deg, #1e2228 0%, #2a2820 100%)' }}>
        <h2 style={{ color: '#ffc107' }}>Conversions EUR → USD (Compte Actions US)</h2>
        <div className="summary-grid">
          {conversionData.map((conversion, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #3a3f47'
            }}>
              <div>
                <span className="summary-label">{conversion.date}</span>
                <span style={{ color: '#9fa3a8', fontSize: '0.8rem', marginLeft: '10px' }}>({conversion.reference})</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><span style={{ color: '#ff6b6b' }}>-{conversion.amountEUR.toLocaleString('fr-FR')} EUR</span></div>
                <div><span style={{ color: '#4caf50' }}>+{conversion.amountUSD.toLocaleString('fr-FR')} USD</span></div>
                <div style={{ fontSize: '0.75rem', color: '#9fa3a8' }}>Taux: {conversion.exchangeRate} | Commission: {conversion.commission.toFixed(2)} EUR</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #3a3f47' }}>
          <div className="summary-item total">
            <span className="summary-label">Total converti :</span>
            <span className="summary-value">
              <span style={{ color: '#ff6b6b' }}>{totalConvertedEUR.toLocaleString('fr-FR')} EUR</span>
              <span style={{ margin: '0 10px' }}>→</span>
              <span style={{ color: '#4caf50' }}>{totalConvertedUSD.toLocaleString('fr-FR')} USD</span>
            </span>
          </div>
          <div className="summary-item" style={{ marginTop: '5px' }}>
            <span className="summary-label">Frais de change :</span>
            <span className="summary-value" style={{ color: '#ff6b6b' }}>{totalCommissions.toFixed(2)} EUR (0.05%)</span>
          </div>
        </div>
      </div>

      {/* Section Ventes Actions US du 22/12/2025 */}
      <div className="sales-summary" style={{ borderColor: '#f44336', background: 'linear-gradient(135deg, #1e2228 0%, #2a1e20 100%)' }}>
        <h2 style={{ color: '#f44336' }}>Ventes Actions US - 22/12/2025</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>Liquidation de 4 positions (RKLB, AVGO, REGN, IDXX)</p>

        {usStockSales.map((sale, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #3a3f47'
          }}>
            <div>
              <span style={{ color: '#f44336', fontWeight: 'bold', marginRight: '10px' }}>{sale.ticker}</span>
              <span style={{ color: '#e6e6e6' }}>{sale.stock}</span>
              <div style={{ fontSize: '0.75rem', color: '#9fa3a8', marginTop: '2px' }}>
                Réf: {sale.reference} | Bordereau: {sale.bordereau}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#e6e6e6' }}>{sale.quantity.toLocaleString('fr-FR')} actions @ ${sale.price.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: '#9fa3a8' }}>Brut: </span>
                <span style={{ color: '#e6e6e6' }}>${sale.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9fa3a8' }}>
                Courtage: ${sale.brokerage.toFixed(2)} | Impôt: ${sale.tax.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#4caf50', fontWeight: 'bold', marginTop: '4px' }}>
                Net: {sale.settlementCurrency === 'EUR'
                  ? `${sale.netAmountEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR`
                  : `$${sale.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`
                }
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #3a3f47' }}>
          <div className="summary-item total">
            <span className="summary-label">Total net des ventes :</span>
            <span className="summary-value" style={{ color: '#4caf50', fontSize: '1.1rem', fontWeight: 'bold' }}>
              ${totalUSStockSales.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </div>

      {/* Section Portefeuille Actions US */}
      <div className="sales-summary" style={{ borderColor: '#e91e63', background: 'linear-gradient(135deg, #1e2228 0%, #2a1e28 100%)' }}>
        <h2 style={{ color: '#e91e63' }}>Portefeuille Actions US</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>Positions actuelles au 22/12/2025</p>

        {Object.entries(usPortfolioSummary).map(([ticker, data]) => (
          <div key={ticker} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderBottom: '1px solid #3a3f47'
          }}>
            <div>
              <span style={{ color: '#e91e63', fontWeight: 'bold', marginRight: '10px' }}>{ticker}</span>
              <span style={{ color: '#e6e6e6' }}>{data.name}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#e6e6e6' }}>{data.quantity} actions @ ${data.avgPrice.toFixed(2)}</div>
              <div style={{ color: '#9fa3a8', fontSize: '0.85rem' }}>${data.totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #3a3f47' }}>
          <div className="summary-item total">
            <span className="summary-label">Total investi Actions US :</span>
            <span className="summary-value" style={{ color: '#e91e63', fontSize: '1.1rem', fontWeight: 'bold' }}>
              ${totalUSPortfolioValue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </div>

      {/* Opération spéciale Alphabet */}
      <div className="sales-summary" style={{ borderColor: '#00bcd4', background: 'linear-gradient(135deg, #1e2228 0%, #1e2830 100%)' }}>
        <h2 style={{ color: '#00bcd4' }}>Opérations Alphabet (GOOG) - 20/11/2025</h2>
        <p style={{ fontSize: '0.8rem', color: '#9fa3a8', marginBottom: '15px' }}>Achat 350+350 → Vente 700 → Rachat 350 = Position finale: 350 actions</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div style={{ padding: '12px', background: '#2a3038', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
            <h4 style={{ color: '#4caf50', marginBottom: '8px', fontSize: '0.85rem' }}>1. Achat</h4>
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ color: '#e6e6e6' }}>{alphabetOperations.initialPurchase1.quantity} actions</div>
              <div style={{ color: '#9fa3a8' }}>@ ${alphabetOperations.initialPurchase1.price.toFixed(2)}</div>
              <div style={{ color: '#ff6b6b', marginTop: '5px' }}>-${alphabetOperations.initialPurchase1.totalAmount.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '3px' }}>Frais: ${(alphabetOperations.initialPurchase1.brokerage + alphabetOperations.initialPurchase1.tax).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ padding: '12px', background: '#2a3038', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
            <h4 style={{ color: '#4caf50', marginBottom: '8px', fontSize: '0.85rem' }}>2. Achat</h4>
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ color: '#e6e6e6' }}>{alphabetOperations.initialPurchase2.quantity} actions</div>
              <div style={{ color: '#9fa3a8' }}>@ ${alphabetOperations.initialPurchase2.price.toFixed(2)}</div>
              <div style={{ color: '#ff6b6b', marginTop: '5px' }}>-${alphabetOperations.initialPurchase2.totalAmount.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '3px' }}>Frais: ${(alphabetOperations.initialPurchase2.brokerage + alphabetOperations.initialPurchase2.tax).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ padding: '12px', background: '#2a3038', borderRadius: '8px', borderLeft: '3px solid #ff6b6b' }}>
            <h4 style={{ color: '#ff6b6b', marginBottom: '8px', fontSize: '0.85rem' }}>3. Vente</h4>
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ color: '#e6e6e6' }}>{alphabetOperations.sale.quantity} actions</div>
              <div style={{ color: '#9fa3a8' }}>@ ${alphabetOperations.sale.price.toFixed(2)}</div>
              <div style={{ color: '#4caf50', marginTop: '5px' }}>+${alphabetOperations.sale.netAmount.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '3px' }}>Frais: ${(alphabetOperations.sale.brokerage + alphabetOperations.sale.tax).toFixed(2)}</div>
            </div>
          </div>

          <div style={{ padding: '12px', background: '#2a3038', borderRadius: '8px', borderLeft: '3px solid #00bcd4' }}>
            <h4 style={{ color: '#00bcd4', marginBottom: '8px', fontSize: '0.85rem' }}>4. Rachat</h4>
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ color: '#e6e6e6' }}>{alphabetOperations.repurchase.quantity} actions</div>
              <div style={{ color: '#9fa3a8' }}>@ ${alphabetOperations.repurchase.price.toFixed(2)}</div>
              <div style={{ color: '#ff6b6b', marginTop: '5px' }}>-${alphabetOperations.repurchase.totalAmount.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: '0.7rem', color: '#9fa3a8', marginTop: '3px' }}>Frais: ${(alphabetOperations.repurchase.brokerage + alphabetOperations.repurchase.tax).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #3a3f47' }}>
          <div className="summary-item" style={{ marginTop: '5px' }}>
            <span className="summary-label">Position finale :</span>
            <span className="summary-value" style={{ color: '#00bcd4' }}>
              {alphabetOperations.repurchase.quantity} actions GOOG @ ${alphabetOperations.repurchase.price.toFixed(2)} = ${alphabetOperations.repurchase.totalAmount.toLocaleString('fr-FR')} USD
            </span>
          </div>
          <div className="summary-item" style={{ marginTop: '10px' }}>
            <span className="summary-label">Total frais opérations GOOG :</span>
            <span className="summary-value" style={{ color: '#ff6b6b' }}>
              ${(alphabetOperations.initialPurchase1.brokerage + alphabetOperations.initialPurchase1.tax +
                 alphabetOperations.initialPurchase2.brokerage + alphabetOperations.initialPurchase2.tax +
                 alphabetOperations.sale.brokerage + alphabetOperations.sale.tax +
                 alphabetOperations.repurchase.brokerage + alphabetOperations.repurchase.tax).toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      <div className="sales-summary" style={{ borderColor: '#61dafb', background: 'linear-gradient(135deg, #1e2228 0%, #2a3038 100%)' }}>
        <h2 style={{ color: '#61dafb' }}>Performance Globale du Portefeuille ETF</h2>
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
