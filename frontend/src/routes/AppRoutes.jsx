import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

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
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}