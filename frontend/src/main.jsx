import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import axios from 'axios'
import App from './App.jsx'
import "./index.css"

// Send all /api requests to the backend (fixes 404/500 when using relative URLs)
const apiBase = import.meta.env.VITE_API_URL
if (apiBase) {
  axios.defaults.baseURL = apiBase
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-text)',
          border: '1px solid var(--toast-border)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: 'var(--toast-text)',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'var(--toast-text)',
          },
        },
      }}
    />
  </StrictMode>,
)
