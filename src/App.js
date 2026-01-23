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
import PortfolioPerformer from './components/PortfolioPerformer';
import PortfolioPerformerChoose from './components/PortfolioPerformerChoose';
import PortfolioFiducenter from './components/PortfolioFiducenter';
import GraphiquesFiducenter from './components/GraphiquesFiducenter';
import PortfolioFiducenter5050 from './components/PortfolioFiducenter5050';
import GraphiquesFiducenter5050 from './components/GraphiquesFiducenter5050';
import PortfolioSector from './components/PortfolioSector';
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
        {/* Portfolio Performer */}
        <Route path="/performer" element={<PortfolioPerformer />} />
        {/* Decision Tracker */}
        <Route path="/tracker" element={<PortfolioPerformerChoose />} />
        {/* Portfolio Fiducenter 65/35 */}
        <Route path="/fiducenter" element={<PortfolioFiducenter />} />
        <Route path="/fiducenter/charts" element={<GraphiquesFiducenter />} />
        {/* Portfolio Fiducenter 50/50 */}
        <Route path="/fiducenter5050" element={<PortfolioFiducenter5050 />} />
        <Route path="/fiducenter5050/charts" element={<GraphiquesFiducenter5050 />} />
        {/* Portfolio Secteur - Dashboard unifié */}
        <Route path="/sector" element={<PortfolioSector />} />
      </Routes>
    </Router>
  );
}

export default App;
