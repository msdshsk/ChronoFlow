import React, { useState, useEffect } from 'react';
import { WindowService } from '../services/windowService';

const AlwaysOnTopButton: React.FC = () => {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 初期状態を取得
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const state = await WindowService.getAlwaysOnTop();
        setIsAlwaysOnTop(state);
      } catch (error) {
        console.error('初期状態の取得に失敗:', error);
      }
    };

    loadInitialState();
  }, []);

  // 最前面表示を切り替える
  const handleToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newState = await WindowService.toggleAlwaysOnTop();
      setIsAlwaysOnTop(newState);
    } catch (error) {
      console.error('最前面表示の切り替えに失敗:', error);
      alert('最前面表示の切り替えに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all duration-200
        flex items-center gap-2 border
        ${isAlwaysOnTop 
          ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 shadow-md' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
      `}
      title={isAlwaysOnTop ? '最前面表示を解除' : '最前面表示にする'}
    >
      <span className="text-lg">
        {isAlwaysOnTop ? '📌' : '🔗'}
      </span>
      <span>
        {isLoading ? '変更中...' : isAlwaysOnTop ? '最前面ON' : '最前面OFF'}
      </span>
    </button>
  );
};

export default AlwaysOnTopButton; 