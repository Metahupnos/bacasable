import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PortfolioETF from './components/PortfolioETF';
import GraphiquesETF from './components/GraphiquesETF';
import SalesHistory from './components/SalesHistory';
import PortfolioChL from './components/PortfolioChL';
import GraphiquesChL from './components/GraphiquesChL';
import PortfolioMel from './components/PortfolioMel';
import GraphiquesMel from './components/GraphiquesMel';
import PortfolioMet from './components/PortfolioMet';
import GraphiquesMet from './components/GraphiquesMet';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Portfolio ETF */}
        <Route path="/etf" element={<PortfolioETF />} />
        <Route path="/etf/charts" element={<GraphiquesETF />} />
        <Route path="/etf/sales" element={<SalesHistory />} />
        {/* Portfolio ChL */}
        <Route path="/chl" element={<PortfolioChL />} />
        <Route path="/chl/charts" element={<GraphiquesChL />} />
        {/* Portfolio Mel */}
        <Route path="/mel" element={<PortfolioMel />} />
        <Route path="/mel/charts" element={<GraphiquesMel />} />
        {/* Portfolio Met */}
        <Route path="/met" element={<PortfolioMet />} />
        <Route path="/met/charts" element={<GraphiquesMet />} />
      </Routes>
    </Router>
  );
}

export default App;
