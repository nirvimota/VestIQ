// C:\nirvi\vestIQ\frontend\src\main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';
import { TradingProvider } from './context/TradingContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TradingProvider>
      <App />
    </TradingProvider>
  </React.StrictMode>
);