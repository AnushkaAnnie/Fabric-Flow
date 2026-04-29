import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Yarn from './pages/Yarn';
import FabricPurchase from './pages/FabricPurchase';
import Knitting from './pages/Knitting';
import Dyeing from './pages/Dyeing';
import IssueToDyer from './pages/IssueToDyer';
import Compacting from './pages/Compacting';
import Search from './pages/Search';
import MasterData from './pages/MasterData';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/yarn" element={<Yarn />} />
            <Route path="/fabric-purchase" element={<FabricPurchase />} />
            <Route path="/knitting" element={<Knitting />} />
            <Route path="/dyeing" element={<Dyeing />} />
            <Route path="/issue-to-dyer" element={<IssueToDyer />} />
            <Route path="/compacting" element={<Compacting />} />
            <Route path="/search" element={<Search />} />
            <Route path="/master" element={<MasterData />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
