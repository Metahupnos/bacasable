import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Portfolio_ETF from './components/Portfolio_ETF';
import Graphiques_ETF from './components/Graphiques_ETF';
import SalesHistory from './components/SalesHistory';
import Portfolio_ChL from './components/Portfolio_ChL';
import Graphiques_ChL from './components/Graphiques_ChL';
import Portfolio_Mel from './components/Portfolio_Mel';
import Graphiques_Mel from './components/Graphiques_Mel';
import Portfolio_Met from './components/Portfolio_Met';
import Graphiques_Met from './components/Graphiques_Met';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Portfolio ETF */}
        <Route path="/etf" element={<Portfolio_ETF />} />
        <Route path="/etf/charts" element={<Graphiques_ETF />} />
        <Route path="/etf/sales" element={<SalesHistory />} />
        {/* Portfolio ChL */}
        <Route path="/chl" element={<Portfolio_ChL />} />
        <Route path="/chl/charts" element={<Graphiques_ChL />} />
        {/* Portfolio Mel */}
        <Route path="/mel" element={<Portfolio_Mel />} />
        <Route path="/mel/charts" element={<Graphiques_Mel />} />
        {/* Portfolio Met */}
        <Route path="/met" element={<Portfolio_Met />} />
        <Route path="/met/charts" element={<Graphiques_Met />} />
      </Routes>
    </Router>
  );
}

export default App;
