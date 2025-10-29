import { useState } from 'react';
import { Calendar } from './components/Calendar';
import { AuthButton } from './components/AuthButton';
import AlwaysOnTopButton from './components/AlwaysOnTopButton';
import { DigitalClock } from './components/DigitalClock';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthStateChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ChronoFlow</h1>
              <span className="ml-2 text-sm text-gray-500">カレンダーアプリ</span>
            </div>
            <div className="flex items-center gap-4">
              <DigitalClock />
              <div className="flex items-center gap-3">
                <AlwaysOnTopButton />
                <AuthButton onAuthStateChange={handleAuthStateChange} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Calendar isAuthenticated={isAuthenticated} />
      </main>
    </div>
  );
}

export default App;
