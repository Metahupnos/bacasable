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
      id: 'portfolio2026',
      name: 'Portfolio 2026-01-22',
      description: 'Métaux/Mining (USAR, HL, CDE, ARIS, NGD) + Biotech (MRNA, CRVS, ERAS)',
      color: '#ffd700',
      path: '/portfolio2026'
    },
    {
      id: 'all',
      name: 'Portfolio All - Basic Materials',
      description: 'Top 20 Finviz: HYMC, CRML, UAMY, METC, USAR, HL, AG, NGD, CDE...',
      color: '#ff9800',
      path: '/all'
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
