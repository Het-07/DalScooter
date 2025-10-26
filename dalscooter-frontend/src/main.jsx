// src/main.jsx (No Change)
import React,{ StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'; // This should already be here from previous step

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* Ensure this wrapper is here */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)