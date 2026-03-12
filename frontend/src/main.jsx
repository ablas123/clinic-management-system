import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 🔧 إضافة معالجة أخطاء عالمية
window.addEventListener('error', (e) => {
  console.error('💥 Global error:', e.message)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('💥 Unhandled promise:', e.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
