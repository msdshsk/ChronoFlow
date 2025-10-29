import { useState, useEffect } from 'react';

export function DigitalClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 (${weekday})`;
  };

  return (
    <div
      className="rounded-lg shadow-inner p-4 border-4"
      style={{
        backgroundColor: '#9fcc2e',
        borderColor: '#5a7a1f',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
        minWidth: '280px',
        width: '280px'
      }}
    >
      <div className="text-center">
        <div
          className="text-4xl font-bold tracking-widest mb-1"
          style={{
            fontFamily: "'Orbitron', monospace",
            color: '#000000',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            letterSpacing: '0.15em',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {formatTime(currentTime)}
        </div>
        <div
          className="text-sm font-semibold"
          style={{
            fontFamily: "'Orbitron', monospace",
            color: '#1a2902',
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {formatDate(currentTime)}
        </div>
      </div>
    </div>
  );
}
