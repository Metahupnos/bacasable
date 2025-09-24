import './App.css';

const portfolioData = [
  {
    name: "ISH COR S&P500",
    subtitle: "U.ETF USD(ACC)-PT...",
    price: "605,40 EUR | 354 u...",
    value: "214.312,31 EUR",
    change: "+3.246,59 EUR",
    percentage: "+1,54%",
    positive: true
  },
  {
    name: "ISHAR.III PLC",
    subtitle: "CORE MSCI WO...",
    price: "107,11 EUR | 1.42...",
    value: "152.524,64 EUR",
    change: "+1.967,10 EUR",
    percentage: "+1,31%",
    positive: true
  },
  {
    name: "ISHARES PLC",
    subtitle: "CORE MSC E.M.I...",
    price: "36,85 EUR | 2.56...",
    value: "94.593,95 EUR",
    change: "+4.615,11 EUR",
    percentage: "+5,13%",
    positive: true
  },
  {
    name: "INVESCO MKS",
    subtitle: "PLC MSCI WOR...",
    price: "114,92 EUR | 79...",
    value: "91.472,34 EUR",
    change: "+1.108,88 EUR",
    percentage: "+1,23%",
    positive: true
  },
  {
    name: "IN.M.III PLC-EQQQ",
    subtitle: "NAS.-100 UC.ETF...",
    price: "430,50 EUR | 14...",
    value: "61.992,00 EUR",
    change: "+143,79 EUR",
    percentage: "+0,23%",
    positive: true
  }
];

function App() {
  return (
    <div className="App">
      <div className="mobile-container">
        {/* Header */}
        <div className="header">
          <div className="status-bar">
            <span className="time">17:44</span>
            <div className="right-icons">
              <span className="signal">•••• ☰ 📶</span>
              <span className="battery">97</span>
            </div>
          </div>

          <div className="balance-section">
            <div className="settings-icon">⚙️</div>
            <div className="balance-info">
              <h1 className="total-balance">615.232,42 EUR</h1>
              <div className="balance-change">
                <span className="change-amount">-1.108,05 EUR</span>
                <span className="change-percentage negative">-0,18%</span>
              </div>
            </div>
            <div className="mail-icon">✉️</div>
          </div>

          {/* Navigation tabs */}
          <div className="nav-tabs">
            <div className="tab active">Portefeuille</div>
            <div className="tab">Comptes</div>
            <div className="tab">Ordres</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="sort-icon">↕️</div>
          <div className="filter-options">
            <span className="filter active">Valeur</span>
            <span className="filter">Depuis le début</span>
            <span className="filter">Aujourd'hui</span>
          </div>
        </div>

        {/* Portfolio list */}
        <div className="portfolio-list">
          {portfolioData.map((item, index) => (
            <div key={index} className="portfolio-item">
              <div className="item-left">
                <div className="color-indicator"></div>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-subtitle">{item.subtitle}</div>
                  <div className="item-price">{item.price}</div>
                </div>
              </div>
              <div className="item-right">
                <div className="item-value">{item.value}</div>
                <div className={`item-change ${item.positive ? 'positive' : 'negative'}`}>
                  {item.change}
                </div>
                <div className={`item-percentage ${item.positive ? 'positive' : 'negative'}`}>
                  {item.percentage}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom info */}
        <div className="bottom-info">
          <p>Plus d'infos sur ces chiffres</p>
        </div>

        {/* Bottom navigation */}
        <div className="bottom-nav">
          <div className="nav-item active">
            <div className="nav-icon">💼</div>
            <span>Portefeuille</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">⭐</div>
            <span>Favoris</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🔍</div>
            <span>Rechercher</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🌐</div>
            <span>Actualités</span>
          </div>
          <div className="nav-item">
            <div className="nav-icon">🔍</div>
            <span>Découvrir</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
