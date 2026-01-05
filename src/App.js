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
import PortfolioHealthcare from './components/PortfolioHealthcare';
import GraphiquesHealthcare from './components/GraphiquesHealthcare';
import PortfolioBasicMaterials from './components/PortfolioBasicMaterials';
import GraphiquesBasicMaterials from './components/GraphiquesBasicMaterials';
import PortfolioIndustrials from './components/PortfolioIndustrials';
import GraphiquesIndustrials from './components/GraphiquesIndustrials';
import PortfolioTechnology from './components/PortfolioTechnology';
import GraphiquesTechnology from './components/GraphiquesTechnology';
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
        {/* Portfolio Healthcare */}
        <Route path="/healthcare" element={<PortfolioHealthcare />} />
        <Route path="/healthcare/charts" element={<GraphiquesHealthcare />} />
        {/* Portfolio Basic Materials */}
        <Route path="/materials" element={<PortfolioBasicMaterials />} />
        <Route path="/materials/charts" element={<GraphiquesBasicMaterials />} />
        {/* Portfolio Industrials */}
        <Route path="/industrials" element={<PortfolioIndustrials />} />
        <Route path="/industrials/charts" element={<GraphiquesIndustrials />} />
        {/* Portfolio Technology */}
        <Route path="/technology" element={<PortfolioTechnology />} />
        <Route path="/technology/charts" element={<GraphiquesTechnology />} />
      </Routes>
    </Router>
  );
}

export default App;
