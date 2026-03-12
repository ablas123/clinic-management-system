import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-lg">
            <h2 className="text-xl font-bold text-red-700 mb-3">⚠️ حدث خطأ</h2>
            <p className="text-gray-600 mb-4 text-sm" dir="ltr">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              🔄 إعادة التحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
