import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Portfolio from './components/Portfolio';
import Charts from './components/Charts';
import SalesHistory from './components/SalesHistory';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/sales" element={<SalesHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
