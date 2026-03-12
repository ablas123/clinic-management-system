import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-primary-700 mb-4">
          🏥 Clinic Management System
        </h1>
        <p className="text-gray-600 mb-6">
          Frontend connected to backend successfully!
        </p>
        <div className="bg-primary-50 p-4 rounded-lg">
          <p className="text-primary-700 font-medium">
            Backend URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
