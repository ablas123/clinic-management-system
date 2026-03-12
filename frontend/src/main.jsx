import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

// 🪵 تسجيل الأخطاء في الكونسول (للتتبع)
window.addEventListener('error', (e) => {
  console.error('💥 Global error:', e.message, e.filename, e.lineno)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('💥 Unhandled promise:', e.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
