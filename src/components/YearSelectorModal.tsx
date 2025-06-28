import React from 'react';

interface YearSelectorModalProps {
  isOpen: boolean;
  currentYear: number;
  onYearSelect: (year: number) => void;
  onClose: () => void;
}

const YearSelectorModal: React.FC<YearSelectorModalProps> = ({
  isOpen,
  currentYear,
  onYearSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  // 現在年を中心に前後10年を表示
  const startYear = currentYear - 10;
  const endYear = currentYear + 10;
  const years = [];
  
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  const handleYearClick = (year: number) => {
    onYearSelect(year);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">年を選択</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 年の選択グリッド */}
        <div className="grid grid-cols-4 gap-2">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleYearClick(year)}
              className={`
                p-3 rounded-lg text-center font-medium transition-all duration-200
                ${year === currentYear
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }
                hover:scale-105 active:scale-95
              `}
            >
              {year}
            </button>
          ))}
        </div>

        {/* 現在年への移動ボタン */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => handleYearClick(new Date().getFullYear())}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            今年（{new Date().getFullYear()}）に戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default YearSelectorModal; 