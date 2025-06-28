import React from 'react';
import type { Event } from '../types/calendar';

interface EventChipProps {
  event: Event;
  onClick?: (event: Event) => void;
}

const EventChip: React.FC<EventChipProps> = ({ event, onClick }) => {
  const getChipStyles = () => {
    const baseStyles = 'inline-block px-1 py-0.5 text-xs font-medium rounded-md truncate max-w-full transition-colors';
    const hoverStyles = onClick ? 'cursor-pointer hover:shadow-sm' : '';
    
    switch (event.type) {
      case 'holiday':
        return `${baseStyles} ${hoverStyles} bg-red-100 text-red-800 border border-red-200 hover:bg-red-200`;
      case 'work':
        return `${baseStyles} ${hoverStyles} bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200`;
      case 'personal':
        return `${baseStyles} ${hoverStyles} bg-green-100 text-green-800 border border-green-200 hover:bg-green-200`;
      default:
        return `${baseStyles} ${hoverStyles} bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200`;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={getChipStyles()}
      title={`${event.title}${onClick ? ' - クリックで詳細表示' : ''}`}
      onClick={handleClick}
    >
      {event.title}
    </div>
  );
};

export default EventChip; 