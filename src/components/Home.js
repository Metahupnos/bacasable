import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Home() {
  const navigate = useNavigate();

  const portfolios = [
    {
      id: 'etf',
      name: 'Portfolio ETF',
      description: 'Suivi des ETF (actions vendues)',
      color: '#61dafb',
      path: '/etf'
    },
    {
      id: 'chl',
      name: 'Portfolio ChL',
      description: 'Actions US (LLY, GOOGL, REGN, AVGO, IDXX)',
      color: '#4caf50',
      path: '/chl'
    },
    {
      id: 'mel',
      name: 'Portfolio Mel',
      description: 'Actions US (LLY, GOOGL, IDXX)',
      color: '#ff9800',
      path: '/mel'
    },
    {
      id: 'met',
      name: 'Portfolio Met',
      description: 'Actions US (AVGO, LLY, GOOGL, IDXX, REGN)',
      color: '#9c27b0',
      path: '/met'
    },
    {
      id: 'healthcare',
      name: 'Portfolio Healthcare',
      description: 'Biotech & Healthcare (PACS, CRMD, PRAX, OMER, FULC)',
      color: '#e91e63',
      path: '/healthcare'
    },
    {
      id: 'materials',
      name: 'Portfolio Basic Materials',
      description: 'Minières & Matériaux (ERO, ALB, PAAS, CDE, HYMC)',
      color: '#ff5722',
      path: '/materials'
    },
    {
      id: 'industrials',
      name: 'Portfolio Industrials',
      description: 'Transport & Industrie (ZIM, KRMN, SBLK, LUNR, MAN)',
      color: '#00bcd4',
      path: '/industrials'
    },
    {
      id: 'technology',
      name: 'Portfolio Technology',
      description: 'Tech & IA (LPTH, AAOI, ZETA, MU, PATH, VELO)',
      color: '#673ab7',
      path: '/technology'
    }
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ marginBottom: '30px', color: '#61dafb' }}>Mes Portfolios</h1>

        <div className="portfolio-cards">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="portfolio-card"
              onClick={() => navigate(portfolio.path)}
              style={{ borderColor: portfolio.color }}
            >
              <h2 style={{ color: portfolio.color }}>{portfolio.name}</h2>
              <p>{portfolio.description}</p>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default Home;
