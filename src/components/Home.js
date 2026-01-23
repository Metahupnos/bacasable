import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Home() {
  const navigate = useNavigate();

  const portfolios = [
    {
      id: 'sector',
      name: 'Portfolio Secteur',
      description: 'Dashboard unifié - Choix du secteur (Materials, Healthcare, Tech, Industrials, Energy)',
      color: '#00e676',
      path: '/sector'
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
      id: 'performer',
      name: 'Portfolio Performer',
      description: 'Top Performers - Screener Finviz + Yahoo Finance',
      color: '#f44336',
      path: '/performer'
    },
    {
      id: 'tracker',
      name: 'Decision Tracker',
      description: 'Univers fixe - Dois-je agir, attendre ou ne rien faire?',
      color: '#e91e63',
      path: '/tracker'
    },
    {
      id: 'fiducenter',
      name: 'Portfolio Fiducenter 65/35',
      description: 'Gestion Fiducenter - 2.6M EUR - Perf 2025: +17%',
      color: '#00bcd4',
      path: '/fiducenter'
    },
    {
      id: 'fiducenter5050',
      name: 'Portfolio Fiducenter 50/50',
      description: 'Gestion Fiducenter - 9.3M EUR - Perf 2025: +8%',
      color: '#673ab7',
      path: '/fiducenter5050'
    },
    {
      id: 'etf',
      name: 'Portfolio ETF',
      description: 'Suivi des ETF (actions vendues)',
      color: '#61dafb',
      path: '/etf'
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
