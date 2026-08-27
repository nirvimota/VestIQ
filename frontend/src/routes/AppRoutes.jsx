// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Kyc from '../pages/Kyc';
import Dashboard from '../pages/Dashboard';
import Watchlist from '../pages/Watchlist';
import StockDetail from '../pages/StockDetail';
import OrderTicket from '../pages/OrderTicket';
import Portfolio from '../pages/Portfolio';
import OrderHistory from '../pages/OrderHistory';
import Alerts from '../pages/Alerts';
import Profile from '../pages/profile';
import Fundsipo from '../pages/Fundsipo';
import NotFound from '../pages/NotFound';
import LiveMarket from '../pages/market';
import Intraday from '../pages/intraday';
import LongTerm from '../pages/Longterm';
import Learn from '../pages/learn';
import PaperTrading from '../pages/papertrading';

import Navbar from '../components/common/Navbar';
import BottomTabBar from '../components/common/BottomTabBar';

export default function AppRoutes() {
  const location = useLocation();
  const { session } = useAuth();
  // set by Dashboard's openStock() when it navigates to /stock/:symbol —
  // tells us to keep rendering the page underneath instead of replacing it
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      {session && <Navbar />}

      {/* Primary route tree. When backgroundLocation is set, this renders
          AGAINST that location instead of the current one — so e.g.
          /dashboard stays mounted underneath the /stock/:symbol popup. */}
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/kyc" element={<ProtectedRoute><Kyc /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
        <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />
        <Route path="/order/:symbol" element={<ProtectedRoute><OrderTicket /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/funds-ipo" element={<ProtectedRoute><Fundsipo /></ProtectedRoute>} />
        <Route path="/Market" element={<ProtectedRoute><LiveMarket /></ProtectedRoute>} />
        <Route path="/Intraday" element={<ProtectedRoute><Intraday /></ProtectedRoute>} />
        <Route path="/Long-term" element={<ProtectedRoute><LongTerm /></ProtectedRoute>} />
        <Route path="/paper-trading" element={<ProtectedRoute><PaperTrading /></ProtectedRoute>} />
        <Route path="/Learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Overlay route tree — only mounts when backgroundLocation exists,
          i.e. when we arrived via a click that set it. Renders StockDetail
          a second time, on top of the tree above, as the popup. */}
      {backgroundLocation && (
        <Routes>
          <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetail /></ProtectedRoute>} />
        </Routes>
      )}

      {session && <BottomTabBar />}
    </>
  );
}