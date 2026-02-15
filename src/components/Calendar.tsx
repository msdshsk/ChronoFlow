import { useState, useEffect } from 'react';
import type { CalendarDay, Event, Holiday } from '../types/calendar';
import EventChip from './EventChip';
import { EventModal } from './EventModal';
import YearSelectorModal from './YearSelectorModal';
import { googleCalendarService } from '../services/googleCalendarService';

interface CalendarProps {
  isAuthenticated: boolean;
}

export function Calendar({ isAuthenticated }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 環境変数の確認
  const hasHolidayApiKey = !!import.meta.env.VITE_GOOGLE_HOLIDAY_API_KEY;
  const hasOAuthConfig = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_SECRET);

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 祝日データの取得
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const holidayData = await googleCalendarService.getHolidays(currentYear);
        setHolidays(holidayData);
      } catch (error) {
        console.error('祝日の取得に失敗:', error);
        setHolidays([]);
      }
    };

    loadHolidays();
  }, [currentYear]);

  // ユーザーイベントの取得（認証済みの場合のみ）
  useEffect(() => {
    const loadUserEvents = async () => {
      if (!isAuthenticated) {
        setUserEvents([]);
        return;
      }

      try {
        setIsLoading(true);
        const events = await googleCalendarService.getEventsForMonth(currentYear, currentMonth);
        setUserEvents(events);
      } catch (error) {
        console.error('ユーザーイベントの取得に失敗:', error);
        setUserEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserEvents();
  }, [currentYear, currentMonth, isAuthenticated]);

  // カレンダーの日付生成
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, holidays, userEvents]);

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 前月の日付を追加
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const daysInPrevMonth = prevMonth.getDate();
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i;
      const fullDate = `${prevMonthYear}-${String(prevMonthMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      days.push({
        date,
        fullDate,
        isToday: false,
        isCurrentMonth: false,
        events: []
      });
    }

    // 当月の日付を追加
    for (let date = 1; date <= daysInMonth; date++) {
      const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const isToday = fullDate === todayString;

      // その日のイベントを収集
      const dayEvents: Event[] = [];

      // 祝日をチェック
      const holiday = holidays.find(h => h.date === fullDate);
      if (holiday) {
        dayEvents.push({
          id: `holiday-${fullDate}`,
          title: holiday.name,
          date: fullDate,
          type: 'holiday',
          color: '#EF4444'
        });
      }

      // ユーザーイベントをチェック
      const userDayEvents = userEvents.filter(event => {
        // 開始日
        const eventStartDate = event.date;

        // 終了日を取得（endTimeがない場合は開始日と同じ）
        let eventEndDate = eventStartDate;
        if (event.endTime) {
          eventEndDate = event.endTime.split('T')[0];
        }

        // fullDateがイベントの期間内にあるかチェック
        return fullDate >= eventStartDate && fullDate <= eventEndDate;
      });
      dayEvents.push(...userDayEvents);

      days.push({
        date,
        fullDate,
        isToday,
        isCurrentMonth: true,
        events: dayEvents
      });
    }

    // 次月の日付を追加（42日になるまで）
    const remainingDays = 42 - days.length;
    for (let date = 1; date <= remainingDays; date++) {
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
      const fullDate = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      
      days.push({
        date,
        fullDate,
        isToday: false,
        isCurrentMonth: false,
        events: []
      });
    }

    setCalendarDays(days);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };



  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleYearMonthClick = () => {
    setIsYearSelectorOpen(true);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
  };

  const handleCloseYearSelector = () => {
    setIsYearSelectorOpen(false);
  };

  const getDayClassName = (day: CalendarDay, dayIndex: number) => {
    const baseClass = "min-h-24 p-2 border border-gray-200 relative";
    // isToday の場合は bg-white を適用しない（Tailwind のクラス競合を回避）
    const bgClass = day.isToday
      ? "bg-blue-50 border-blue-300"
      : day.isCurrentMonth ? "bg-white" : "bg-gray-50";

    // 日曜日は赤、土曜日は青
    let dayColorClass = "";
    if (day.isCurrentMonth) {
      if (dayIndex % 7 === 0) { // 日曜日
        dayColorClass = "text-red-600";
      } else if (dayIndex % 7 === 6) { // 土曜日
        dayColorClass = "text-blue-600";
      } else {
        dayColorClass = "text-gray-900";
      }
    } else {
      dayColorClass = "text-gray-400";
    }

    return `${baseClass} ${bgClass} ${dayColorClass}`;
  };



  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      {/* カレンダーヘッダー */}
      <div className="mb-6">
        {/* カレンダーナビゲーション */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="前月"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={handleYearMonthClick}
              className="text-2xl font-semibold text-gray-900 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
              title="年を選択"
            >
              {currentYear}年 {monthNames[currentMonth]}
            </button>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="次月"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            今日
          </button>
        </div>
      </div>

      {/* ローディング状態 */}
      {isLoading && isAuthenticated && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            カレンダーを読み込み中...
          </div>
        </div>
      )}

      {/* カレンダーグリッド */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map((day, index) => (
            <div 
              key={day} 
              className={`p-3 text-center font-medium border-r border-gray-200 last:border-r-0 ${
                index === 0 ? 'text-red-600' : 
                index === 6 ? 'text-blue-600' : 
                'text-gray-900'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー日付 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div key={`${day.fullDate}-${index}`} className={getDayClassName(day, index)}>
              <div className="font-medium mb-1">
                {day.isToday ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">
                    {day.date}
                  </span>
                ) : (
                  day.date
                )}
              </div>
              
              {/* イベント表示 */}
              <div className="space-y-1">
                {day.events.slice(0, 2).map((event) => (
                  <EventChip 
                    key={event.id} 
                    event={event} 
                    onClick={handleEventClick}
                  />
                ))}
                {day.events.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{day.events.length - 2} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>祝日 {hasHolidayApiKey ? '(API)' : '(モック)'}</span>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>個人イベント</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-200 rounded border-2 border-blue-300"></div>
          <span>今日</span>
        </div>
      </div>

      {/* 設定状況の説明 */}
      {(!hasHolidayApiKey || !hasOAuthConfig) && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">
            設定を完了して、より多くの機能をご利用ください！
          </h3>
          <div className="text-yellow-800 text-sm space-y-1">
            {!hasHolidayApiKey && (
              <p>• 祝日APIキー（VITE_GOOGLE_HOLIDAY_API_KEY）を設定すると、最新の祝日情報を表示できます</p>
            )}
            {!hasOAuthConfig && (
              <p>• OAuth設定（VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_SECRET）を行うと、個人カレンダーと連携できます</p>
            )}
          </div>
        </div>
      )}

      {/* OAuth設定済みで未認証の場合の説明 */}
      {hasOAuthConfig && !isAuthenticated && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            個人カレンダーと連携しましょう！
          </h3>
          <p className="text-blue-800 text-sm">
            右上の「Googleでログイン」ボタンをクリックして、個人のGoogleカレンダーイベントを表示できます。
          </p>
        </div>
      )}

      {/* イベント詳細モーダル */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* 年選択モーダル */}
      <YearSelectorModal
        isOpen={isYearSelectorOpen}
        currentYear={currentYear}
        onYearSelect={handleYearSelect}
        onClose={handleCloseYearSelector}
      />
    </div>
  );
} 