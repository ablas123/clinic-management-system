import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <p className="text-gray-600 mb-6">الصفحة غير موجودة</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
        >
          <Home className="w-5 h-5" />
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
};

export default NotFound;
