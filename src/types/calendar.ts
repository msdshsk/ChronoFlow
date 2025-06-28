export interface Holiday {
  date: string;
  name: string;
  description?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'personal' | 'work';
  color?: string;
  // Google Calendar詳細情報
  startTime?: string;
  endTime?: string;
  location?: string;
  description?: string;
  attendees?: string[];
  creator?: string;
  htmlLink?: string;
}

export interface CalendarDay {
  date: number;
  fullDate: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  events: Event[];
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

export interface UserInfo {
  email: string;
  name: string;
  picture?: string;
} 